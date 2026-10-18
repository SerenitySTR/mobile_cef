window.GameCef = {
    events: Object.create(null),
    boundEvents: Object.create(null),
    pending: [],
    bridge: null,
    maxPending: 64,
    sync() {
        const bridge = window.cef;
        if (!bridge)
            return false;
        if (this.bridge !== bridge) {
            const previous = this.bridge;
            if (previous && typeof previous.off === "function") {
                for (const eventName in this.boundEvents)
                    previous.off(eventName, this.boundEvents[eventName]);
            }
            this.bridge = bridge;
            this.boundEvents = Object.create(null);
        }
        const canSend = typeof bridge.emit === "function" || typeof bridge.sendEvent === "function";
        const canReceive = typeof bridge.on === "function";
        if (canReceive) {
            for (const eventName in this.events) {
                const callbacks = this.events[eventName];
                if (!callbacks || callbacks.size === 0 || this.boundEvents[eventName])
                    continue;
                const dispatcher = (...args) => this.dispatch(eventName, args);
                bridge.on(eventName, dispatcher);
                this.boundEvents[eventName] = dispatcher;
            }
        }
        if (canSend && this.pending.length > 0) {
            const pending = this.pending.splice(0);
            for (const event of pending) {
                if (!this.emit(event.eventName, event.args))
                    this.enqueue(event.eventName, event.args);
            }
        }
        return canSend && canReceive;
    },
    emit(eventName, args) {
        const bridge = this.bridge || window.cef;
        if (!bridge)
            return false;
        try {
            if (typeof bridge.emit === "function") {
                bridge.emit(eventName, ...args);
                return true;
            }
            if (typeof bridge.sendEvent === "function") {
                bridge.sendEvent(eventName, ...args);
                return true;
            }
        }
        catch (_) {
            this.bridge = null;
            this.boundEvents = Object.create(null);
        }
        return false;
    },
    enqueue(eventName, args) {
        const last = this.pending[this.pending.length - 1];
        if (last && last.eventName === eventName && last.args.length === args.length && last.args.every((value, index) => value === args[index]))
            return;
        this.pending.push({ eventName, args });
        if (this.pending.length > this.maxPending)
            this.pending.splice(0, this.pending.length - this.maxPending);
    },
    send(eventName, data = "") {
        return this.sendArgs(eventName, data);
    },
    sendArgs(eventName, ...args) {
        this.sync();
        if (this.emit(eventName, args))
            return true;
        this.enqueue(eventName, args);
        return false;
    },
    sendJson(eventName, data) {
        const json = JSON.stringify(data);
        const asciiJson = json.replace(/[\u007f-\uffff]/g, char => {
            return "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0");
        });
        return this.send(eventName, asciiJson);
    },
    on(eventName, callback) {
        if (typeof callback !== "function")
            return null;
        if (!this.events[eventName])
            this.events[eventName] = new Set();
        this.events[eventName].add(callback);
        this.sync();
        return callback;
    },
    off(eventName, callback) {
        const callbacks = this.events[eventName];
        if (!callbacks)
            return;
        if (callback)
            callbacks.delete(callback);
        else
            callbacks.clear();
        if (callbacks.size > 0)
            return;
        const bound = this.boundEvents[eventName];
        if (bound && this.bridge && typeof this.bridge.off === "function")
            this.bridge.off(eventName, bound);
        delete this.events[eventName];
        delete this.boundEvents[eventName];
    },
    dispatch(eventName, args) {
        const callbacks = this.events[eventName];
        if (!callbacks || callbacks.size === 0)
            return;
        for (const callback of Array.from(callbacks)) {
            try {
                callback(...args);
            }
            catch (_) { }
        }
    },
    receive(eventName, ...args) {
        this.dispatch(eventName, args);
    }
};
setInterval(() => GameCef.sync(), 1000);
window.addEventListener("DOMContentLoaded", () => {
    GameCef.sync();
    GameCef.send("browser:ready");
});
window.addEventListener("load", () => {
    GameCef.sync();
    requestAnimationFrame(() => {
        GameCef.sync();
        GameCef.send("browser:ui-ready");
    });
});
