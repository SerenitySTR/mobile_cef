(function() {
    var ukrainianLayout = {
        Backquote: "'",
        KeyQ: "й",
        KeyW: "ц",
        KeyE: "у",
        KeyR: "к",
        KeyT: "е",
        KeyY: "н",
        KeyU: "г",
        KeyI: "ш",
        KeyO: "щ",
        KeyP: "з",
        BracketLeft: "х",
        BracketRight: "ї",
        KeyA: "ф",
        KeyS: "і",
        KeyD: "в",
        KeyF: "а",
        KeyG: "п",
        KeyH: "р",
        KeyJ: "о",
        KeyK: "л",
        KeyL: "д",
        Semicolon: "ж",
        Quote: "є",
        KeyZ: "я",
        KeyX: "ч",
        KeyC: "с",
        KeyV: "м",
        KeyB: "и",
        KeyN: "т",
        KeyM: "ь",
        Comma: "б",
        Period: "ю"
    };

    var latinLayout = {
        KeyQ: "q", KeyW: "w", KeyE: "e", KeyR: "r", KeyT: "t",
        KeyY: "y", KeyU: "u", KeyI: "i", KeyO: "o", KeyP: "p",
        KeyA: "a", KeyS: "s", KeyD: "d", KeyF: "f", KeyG: "g",
        KeyH: "h", KeyJ: "j", KeyK: "k", KeyL: "l",
        KeyZ: "z", KeyX: "x", KeyC: "c", KeyV: "v", KeyB: "b",
        KeyN: "n", KeyM: "m"
    };

    function isMobile() {
        return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    }

    function insertText(element, text) {
        var start = typeof element.selectionStart === "number" ? element.selectionStart : element.value.length;
        var end = typeof element.selectionEnd === "number" ? element.selectionEnd : start;

        element.value = element.value.substring(0, start) + text + element.value.substring(end);

        var position = start + text.length;

        if (element.setSelectionRange)
            element.setSelectionRange(position, position);

        element.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function shouldUseUkrainianFallback(event) {
        var expectedLatin = latinLayout[event.code];

        if (!ukrainianLayout[event.code])
            return false;

        if (!expectedLatin)
            return event.key && event.key.length === 1 && event.key.charCodeAt(0) > 127;

        if (!event.key || event.key.length !== 1)
            return true;

        return event.key.toLowerCase() !== expectedLatin;
    }

    function handleBrokenPcUnicode(event) {
        if (isMobile() || event.ctrlKey || event.altKey || event.metaKey)
            return;

        var element = event.currentTarget;

        if (!shouldUseUkrainianFallback(event))
            return;

        var value = ukrainianLayout[event.code];

        if (!value)
            return;

        event.preventDefault();
        event.stopPropagation();

        if (event.shiftKey)
            value = value.toUpperCase();

        insertText(element, value);
    }

    function prepare(element) {
        if (!element || element.dataset.unicodeInputReady === "1")
            return;

        if (element.tagName !== "INPUT" && element.tagName !== "TEXTAREA")
            return;

        var type = (element.getAttribute("type") || "text").toLowerCase();

        if (["button", "submit", "reset", "checkbox", "radio", "range", "file", "hidden"].indexOf(type) !== -1)
            return;

        element.dataset.unicodeInputReady = "1";
        element.setAttribute("lang", "uk");
        element.setAttribute("dir", "auto");

        if (type === "text" || type === "search" || type === "email" || type === "password")
            element.setAttribute("inputmode", "text");

        element.setAttribute("autocapitalize", "none");
        element.setAttribute("autocorrect", "off");
        element.setAttribute("spellcheck", "false");

        element.addEventListener("keydown", handleBrokenPcUnicode, true);
    }

    function prepareAll(root) {
        var scope = root || document;
        var elements = scope.querySelectorAll("input, textarea");

        for (var i = 0; i < elements.length; i++)
            prepare(elements[i]);
    }

    window.UnicodeInput = {
        Prepare: prepare,
        PrepareAll: prepareAll
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            prepareAll(document);
        });
    } else {
        prepareAll(document);
    }

    var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var nodes = mutations[i].addedNodes;

            for (var j = 0; j < nodes.length; j++) {
                var node = nodes[j];

                if (node.nodeType !== 1)
                    continue;

                if (node.matches && (node.matches("input") || node.matches("textarea")))
                    prepare(node);

                if (node.querySelectorAll)
                    prepareAll(node);
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
