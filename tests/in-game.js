(function () {
    "use strict";

    if (!window.GameCef) return;

    var active = false;
    var loadingPromise = null;
    var originalSend = GameCef.send.bind(GameCef);

    function isTestControlEvent(eventName) {
        var name = String(eventName || "");
        return name.indexOf("cef-test:") === 0 || name.indexOf("test:") === 0;
    }

    // While the visual test is active, prevent the real UI from sending actions
    // such as spawn:submit, dialog:response or ticket:close to the game server.
    GameCef.send = function (eventName, data) {
        if (active && !isTestControlEvent(eventName)) {
            console.info("[CEF TEST] blocked outgoing event:", eventName, data);
            return true;
        }

        return originalSend(eventName, data === undefined ? "" : data);
    };

    function parsePayload(data) {
        if (data === null || data === undefined || data === "") return {};
        if (typeof data === "object") return data;

        var text = String(data).trim();
        if (!text) return {};

        try {
            var parsed = JSON.parse(text);
            if (parsed && typeof parsed === "object") return parsed;
            return { view: String(parsed || "") };
        } catch (_) {
            return { view: text };
        }
    }

    function selectedView(data, fallback) {
        var payload = parsePayload(data);
        return payload.view || payload.View || payload.id || payload.Id || fallback || "gallery";
    }

    function ensureStyle() {
        if (document.getElementById("cef-in-game-test-style")) return;

        var link = document.createElement("link");
        link.id = "cef-in-game-test-style";
        link.rel = "stylesheet";
        link.href = "./tests/visual-test.css?v=20260922-ingame-menu1";
        document.head.appendChild(link);
    }

    function loadScript(id, src) {
        return new Promise(function (resolve, reject) {
            var existing = document.getElementById(id);
            if (existing) {
                if (existing.dataset.loaded === "1") resolve();
                else existing.addEventListener("load", resolve, { once: true });
                return;
            }

            var script = document.createElement("script");
            script.id = id;
            script.src = src;
            script.async = false;
            script.addEventListener("load", function () {
                script.dataset.loaded = "1";
                resolve();
            }, { once: true });
            script.addEventListener("error", function () {
                reject(new Error("Failed to load " + src));
            }, { once: true });
            document.body.appendChild(script);
        });
    }

    function ensureLoaded() {
        if (window.CefVisualTests && window.CefVisualTests.views.length) return Promise.resolve();
        if (loadingPromise) return loadingPromise;

        window.__CEF_IN_GAME_TEST_BOOTSTRAP__ = true;
        ensureStyle();

        loadingPromise = loadScript("cef-in-game-test-framework", "./tests/visual-test.js?v=20260922-ingame-menu1")
            .then(function () {
                return loadScript("cef-in-game-test-cases", "./tests/cases.js?v=20260922-ingame-menu1");
            })
            .then(function () {
                if (!window.CefVisualTests)
                    throw new Error("CefVisualTests was not initialized");
                window.CefVisualTests.init(false);
            })
            .catch(function (error) {
                loadingPromise = null;
                console.error("[CEF TEST]", error);
                throw error;
            });

        return loadingPromise;
    }

    function sendControl(eventName, data) {
        return originalSend(eventName, data === undefined ? "" : data);
    }

    function open(data) {
        active = true;
        var view = selectedView(data, "gallery");

        ensureLoaded().then(function () {
            window.CefVisualTests.open(view);
            sendControl("cef-test:ready", JSON.stringify({ View: view }));
        }).catch(function (error) {
            active = false;
            sendControl("cef-test:error", String(error && error.message ? error.message : error));
        });
    }

    function changeView(data) {
        active = true;
        var view = selectedView(data, "gallery");

        ensureLoaded().then(function () {
            if (!window.CefVisualTests.open(view))
                console.warn("[CEF TEST] unknown view:", view);
        });
    }

    function close(notifyServer) {
        if (window.CefVisualTests)
            window.CefVisualTests.close(true);

        active = false;
        if (notifyServer !== false)
            sendControl("cef-test:closed", "");
    }

    GameCef.on("cef-test:show", open);
    GameCef.on("cef-test:view", changeView);
    GameCef.on("cef-test:hide", function () { close(false); });

    // Short aliases are supported as well.
    GameCef.on("test:show", open);
    GameCef.on("test:view", changeView);
    GameCef.on("test:hide", function () { close(false); });

    window.CefInGameTests = {
        get active() { return active; },
        open: open,
        view: changeView,
        close: function () { close(false); },
        closeFromUi: function () { close(true); }
    };
})();
