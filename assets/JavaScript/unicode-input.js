(function() {
    var uk = {
        Backquote: "ʼ",
        KeyQ: "й", KeyW: "ц", KeyE: "у", KeyR: "к", KeyT: "е",
        KeyY: "н", KeyU: "г", KeyI: "ш", KeyO: "щ", KeyP: "з",
        BracketLeft: "х", BracketRight: "ї",
        KeyA: "ф", KeyS: "і", KeyD: "в", KeyF: "а", KeyG: "п",
        KeyH: "р", KeyJ: "о", KeyK: "л", KeyL: "д",
        Semicolon: "ж", Quote: "є",
        KeyZ: "я", KeyX: "ч", KeyC: "с", KeyV: "м", KeyB: "и",
        KeyN: "т", KeyM: "ь", Comma: "б", Period: "ю"
    };

    var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    var suppressNativeInput = false;
    var lastValue = "";
    var lastStart = 0;
    var lastEnd = 0;

    function editable() {
        var el = document.activeElement;
        if (!el)
            return null;

        if (el.tagName === "TEXTAREA")
            return el;

        if (el.tagName !== "INPUT")
            return null;

        var type = (el.type || "text").toLowerCase();
        return ["text", "password", "search", "email", "url", "tel"].indexOf(type) !== -1 ? el : null;
    }

    function fireInput(el) {
        try {
            el.dispatchEvent(new InputEvent("input", {
                bubbles: true,
                inputType: "insertText",
                data: null
            }));
        } catch (_) {
            el.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    function replaceSelection(el, value) {
        var start = typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
        var end = typeof el.selectionEnd === "number" ? el.selectionEnd : start;

        el.value = el.value.slice(0, start) + value + el.value.slice(end);

        var pos = start + value.length;
        if (el.setSelectionRange)
            el.setSelectionRange(pos, pos);

        fireInput(el);
    }

    function remember(el) {
        lastValue = el.value;
        lastStart = typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
        lastEnd = typeof el.selectionEnd === "number" ? el.selectionEnd : lastStart;
    }

    function restore(el) {
        el.value = lastValue;
        if (el.setSelectionRange)
            el.setSelectionRange(lastStart, lastEnd);
    }

    if (!mobile) {
        document.addEventListener("keydown", function(event) {
            var el = editable();
            if (!el)
                return;

            remember(el);

            if (event.ctrlKey || event.altKey || event.metaKey)
                return;

            var ch = uk[event.code];
            if (!ch)
                return;

            /*
             * The PC omp-cef build corrupts non-ASCII WM_CHAR before Chromium
             * receives it. For Ukrainian keyboard input we therefore use only
             * the physical KeyboardEvent.code and never the broken event.key.
             */
            event.preventDefault();
            event.stopImmediatePropagation();

            suppressNativeInput = true;

            if (event.shiftKey)
                ch = ch.toUpperCase();

            replaceSelection(el, ch);

            setTimeout(function() {
                suppressNativeInput = false;
                remember(el);
            }, 0);
        }, true);

        document.addEventListener("keypress", function(event) {
            if (!suppressNativeInput || !editable())
                return;

            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);

        document.addEventListener("beforeinput", function(event) {
            if (!suppressNativeInput || !editable())
                return;

            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);

        document.addEventListener("textInput", function(event) {
            if (!suppressNativeInput || !editable())
                return;

            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);

        document.addEventListener("input", function(event) {
            if (!suppressNativeInput)
                return;

            var el = editable();
            if (!el || event.target !== el)
                return;

            /*
             * Our synthetic input event is allowed. A second native event in
             * the same key cycle is the mojibake character from CEF.
             */
            if (event.isTrusted) {
                event.stopImmediatePropagation();
                restore(el);
            }
        }, true);
    }

    function prepare(el) {
        if (!el || el.dataset.unicodeInputReady === "1")
            return;

        el.dataset.unicodeInputReady = "1";
        el.setAttribute("lang", "uk");
        el.setAttribute("dir", "auto");

        if (el.tagName === "INPUT")
            el.setAttribute("inputmode", "text");

        el.setAttribute("autocorrect", "off");
        el.setAttribute("spellcheck", "false");
    }

    function prepareAll(root) {
        var items = (root || document).querySelectorAll("input, textarea");
        for (var i = 0; i < items.length; i++)
            prepare(items[i]);
    }

    if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", function() { prepareAll(document); });
    else
        prepareAll(document);

    new MutationObserver(function(records) {
        for (var i = 0; i < records.length; i++) {
            for (var j = 0; j < records[i].addedNodes.length; j++) {
                var node = records[i].addedNodes[j];
                if (node.nodeType !== 1)
                    continue;
                if (node.matches && node.matches("input, textarea"))
                    prepare(node);
                if (node.querySelectorAll)
                    prepareAll(node);
            }
        }
    }).observe(document.documentElement, { childList: true, subtree: true });
})();
