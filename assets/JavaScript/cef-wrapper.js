window.GameCef = {
    events: {},

    send(eventName, data = "") {
        if (!window.cef)
            return false;

        if (typeof window.cef.emit === "function") {
            window.cef.emit(eventName, data);
            return true;
        }

        return false;
    },

    sendJson(eventName, data) {
        return this.send(eventName, JSON.stringify(data));
    },

    on(eventName, callback) {
        if (!window.cef || typeof window.cef.on !== "function")
            return false;

        this.events[eventName] = callback;

        window.cef.on(eventName, callback);

        return true;
    },

    off(eventName) {
        const callback = this.events[eventName];

        if (!callback)
            return;

        if (window.cef && typeof window.cef.off === "function")
            window.cef.off(eventName, callback);

        delete this.events[eventName];
    },

    receive(eventName, data = "") {
        const callback = this.events[eventName];

        if (callback)
            callback(data);
    }
};
GameCef.send("browser:ready");