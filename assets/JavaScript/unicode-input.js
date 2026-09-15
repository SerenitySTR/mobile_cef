(function() {
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

        var composing = false;

        element.addEventListener("compositionstart", function() {
            composing = true;
        });

        element.addEventListener("compositionend", function() {
            composing = false;
            element.dispatchEvent(new Event("input", { bubbles: true }));
        });

        element.addEventListener("keydown", function(event) {
            if (composing || event.isComposing || event.keyCode === 229)
                return;
        });
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
