window.UiViewport = (() => {
    const callbacks = new Set();
    let scheduled = false;
    let width = -1;
    let height = -1;
    function currentSize() {
        const viewport = window.visualViewport;
        return {
            width: Math.round(viewport ? viewport.width : window.innerWidth || 0),
            height: Math.round(viewport ? viewport.height : window.innerHeight || 0)
        };
    }
    function flush(force) {
        scheduled = false;
        const size = currentSize();
        if (!force && size.width === width && size.height === height)
            return;
        width = size.width;
        height = size.height;
        for (const callback of Array.from(callbacks)) {
            try {
                callback(size);
            }
            catch (_) { }
        }
    }
    function schedule() {
        if (scheduled)
            return;
        scheduled = true;
        requestAnimationFrame(() => flush(false));
    }
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    if (window.visualViewport)
        window.visualViewport.addEventListener("resize", schedule, { passive: true });
    return {
        on(callback) {
            if (typeof callback !== "function")
                return null;
            callbacks.add(callback);
            callback(currentSize());
            return callback;
        },
        off(callback) {
            callbacks.delete(callback);
        },
        refresh() {
            flush(true);
        }
    };
})();
