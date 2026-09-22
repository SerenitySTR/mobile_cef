var UiKeyboard = {
    Focus: function(element) {
        if (!element)
            return;

        if (!element.hasAttribute("tabindex"))
            element.setAttribute("tabindex", "-1");

        var applyFocus = function() {
            try {
                window.focus();
            } catch (error) {}

            try {
                element.focus({ preventScroll: true });
            } catch (error) {
                try {
                    element.focus();
                } catch (focusError) {}
            }
        };

        applyFocus();

        if (typeof requestAnimationFrame === "function")
            requestAnimationFrame(applyFocus);

        setTimeout(applyFocus, 40);
    }
};

window.UiKeyboard = UiKeyboard;
