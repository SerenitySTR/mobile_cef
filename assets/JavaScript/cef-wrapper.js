(function () {
    "use strict";

    const TRANSPORT_EVENT = "cef:transport:chunk";
    const DIRECT_UTF8_LIMIT = 3000;
    const CHUNK_SIZE = 2400;
    const MAX_CHUNKS = 600;
    const MAX_PAYLOAD_BYTES = 1024 * 1024;
    const TRANSFER_TTL = 30000;

    function utf8Bytes(text) {
        if (window.TextEncoder) {
            return new TextEncoder().encode(text);
        }

        const encoded = unescape(encodeURIComponent(text));
        const bytes = new Uint8Array(encoded.length);

        for (let i = 0; i < encoded.length; i++) {
            bytes[i] = encoded.charCodeAt(i);
        }

        return bytes;
    }

    function bytesToUtf8(bytes) {
        if (window.TextDecoder) {
            return new TextDecoder("utf-8").decode(bytes);
        }

        let binary = "";
        const step = 8192;

        for (let i = 0; i < bytes.length; i += step) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
        }

        return decodeURIComponent(escape(binary));
    }

    function bytesToBase64(bytes) {
        let binary = "";
        const step = 8192;

        for (let i = 0; i < bytes.length; i += step) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
        }

        return btoa(binary);
    }

    function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        return bytes;
    }

    function makeTransferId() {
        return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
    }

    window.GameCef = {
        events: {},
        boundEvents: {},
        pending: [],
        bridge: null,
        incomingTransfers: {},

        sync() {
            const bridge = window.cef;
            if (!bridge) return false;

            if (this.bridge !== bridge) {
                this.bridge = bridge;
                this.boundEvents = {};
            }

            const canSend = typeof bridge.emit === "function" || typeof bridge.sendEvent === "function";
            const canReceive = typeof bridge.on === "function";

            if (canReceive) {
                for (const eventName in this.events) {
                    const callback = this.events[eventName];
                    const boundCallback = this.boundEvents[eventName];

                    if (boundCallback === callback) continue;

                    if (boundCallback && typeof bridge.off === "function") {
                        bridge.off(eventName, boundCallback);
                    }

                    bridge.on(eventName, callback);
                    this.boundEvents[eventName] = callback;
                }
            }

            if (canSend && this.pending.length > 0) {
                const pending = this.pending.splice(0);

                for (const event of pending) {
                    if (event.raw) {
                        this._sendRaw(event.eventName, event.data);
                    } else {
                        this.send(event.eventName, event.data);
                    }
                }
            }

            return canSend && canReceive;
        },

        _sendRaw(eventName, data = "") {
            const bridge = window.cef;

            if (!bridge) {
                this.pending.push({ eventName, data, raw: true });
                return false;
            }

            if (typeof bridge.emit === "function") {
                bridge.emit(eventName, data);
                return true;
            }

            if (typeof bridge.sendEvent === "function") {
                bridge.sendEvent(eventName, data);
                return true;
            }

            this.pending.push({ eventName, data, raw: true });
            return false;
        },

        _mustUseTransport(data) {
            if (!data) return false;

            // Direct bridge strings are safe only when they are short ASCII.
            if (/[^\x00-\x7F]/.test(data)) return true;

            return utf8Bytes(data).length > DIRECT_UTF8_LIMIT;
        },

        send(eventName, data = "") {
            data = data == null ? "" : String(data);

            if (!this._mustUseTransport(data)) {
                return this._sendRaw(eventName, data);
            }

            return this._sendTransport(eventName, data);
        },

        sendJson(eventName, data) {
            // JSON always goes through the UTF-8/Base64 transport. This avoids
            // Android bridge Unicode corruption and the native 4096-byte limit.
            return this._sendTransport(eventName, JSON.stringify(data));
        },

        _sendTransport(eventName, payload) {
            const bytes = utf8Bytes(payload);

            if (bytes.length > MAX_PAYLOAD_BYTES) {
                console.error("[CEF] Payload too large:", eventName, bytes.length);
                return false;
            }

            const base64 = bytesToBase64(bytes);
            const total = Math.max(1, Math.ceil(base64.length / CHUNK_SIZE));

            if (total > MAX_CHUNKS) {
                console.error("[CEF] Too many chunks:", eventName, total);
                return false;
            }

            const id = makeTransferId();

            for (let index = 0; index < total; index++) {
                const packet = JSON.stringify({
                    id: id,
                    index: index,
                    total: total,
                    eventName: eventName,
                    data: base64.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
                });

                // This packet is ASCII-only and intentionally well below 4096 bytes.
                if (!this._sendRaw(TRANSPORT_EVENT, packet)) return false;
            }

            return true;
        },

        _handleTransportChunk(raw) {
            let packet;

            try {
                packet = JSON.parse(raw);
            } catch (_) {
                return;
            }

            if (!packet ||
                typeof packet.id !== "string" ||
                typeof packet.eventName !== "string" ||
                packet.eventName === TRANSPORT_EVENT ||
                !Number.isInteger(packet.index) ||
                !Number.isInteger(packet.total) ||
                packet.total <= 0 || packet.total > MAX_CHUNKS ||
                packet.index < 0 || packet.index >= packet.total) {
                return;
            }

            this._cleanupTransfers();

            let transfer = this.incomingTransfers[packet.id];

            if (!transfer) {
                transfer = {
                    eventName: packet.eventName,
                    total: packet.total,
                    chunks: new Array(packet.total),
                    received: 0,
                    updatedAt: Date.now()
                };
                this.incomingTransfers[packet.id] = transfer;
            }

            if (transfer.eventName !== packet.eventName || transfer.total !== packet.total) {
                delete this.incomingTransfers[packet.id];
                return;
            }

            transfer.updatedAt = Date.now();

            if (transfer.chunks[packet.index] === undefined) {
                transfer.chunks[packet.index] = typeof packet.data === "string" ? packet.data : "";
                transfer.received++;
            }

            if (transfer.received !== transfer.total) return;

            delete this.incomingTransfers[packet.id];

            try {
                const bytes = base64ToBytes(transfer.chunks.join(""));
                if (bytes.length > MAX_PAYLOAD_BYTES) return;

                const payload = bytesToUtf8(bytes);
                this.receive(transfer.eventName, payload);
            } catch (_) {
                // Ignore an incomplete/corrupted transfer instead of forwarding bad JSON.
            }
        },

        _cleanupTransfers() {
            const now = Date.now();

            for (const id in this.incomingTransfers) {
                if (now - this.incomingTransfers[id].updatedAt > TRANSFER_TTL) {
                    delete this.incomingTransfers[id];
                }
            }
        },

        on(eventName, callback) {
            const oldCallback = this.events[eventName];

            if (oldCallback && oldCallback !== callback && this.bridge && typeof this.bridge.off === "function" && this.boundEvents[eventName] === oldCallback) {
                this.bridge.off(eventName, oldCallback);
            }

            this.events[eventName] = callback;
            delete this.boundEvents[eventName];
            return this.sync();
        },

        off(eventName) {
            const callback = this.events[eventName];
            if (!callback) return;

            if (this.bridge && typeof this.bridge.off === "function" && this.boundEvents[eventName] === callback) {
                this.bridge.off(eventName, callback);
            }

            delete this.events[eventName];
            delete this.boundEvents[eventName];
        },

        receive(eventName, data = "") {
            const callback = this.events[eventName];
            if (!callback) return;
            callback(data);
        }
    };

    GameCef.on(TRANSPORT_EVENT, function (data) {
        GameCef._handleTransportChunk(data);
    });

    const cefSyncTimer = setInterval(function () {
        if (GameCef.sync()) clearInterval(cefSyncTimer);
    }, 25);

    window.addEventListener("DOMContentLoaded", function () {
        GameCef.sync();
        GameCef.send("browser:ready");
    });

    window.addEventListener("load", function () {
        GameCef.sync();
        requestAnimationFrame(function () {
            GameCef.sync();
            GameCef.send("browser:ui-ready");
        });
    });
})();
