var UiKeyboard = {
    sink: null,
    scope: null,
    focusTimer: null,

    Init: function() {
        if (this.sink && document.body.contains(this.sink))
            return;

        var sink = document.createElement("input");
        sink.type = "text";
        sink.id = "ui-keyboard-sink";
        sink.tabIndex = -1;
        sink.autocomplete = "off";
        sink.setAttribute("inputmode", "none");
        sink.setAttribute("virtualkeyboardpolicy", "manual");
        sink.setAttribute("aria-hidden", "true");
        sink.setAttribute("data-ui-keyboard-sink", "1");

        sink.style.position = "fixed";
        sink.style.left = "-10000px";
        sink.style.top = "-10000px";
        sink.style.width = "1px";
        sink.style.height = "1px";
        sink.style.opacity = "0";
        sink.style.pointerEvents = "none";
        sink.style.border = "0";
        sink.style.padding = "0";
        sink.style.margin = "0";

        document.body.appendChild(sink);
        this.sink = sink;

        var self = this;

        document.addEventListener("mousedown", function(event) {
            self.RestoreAfterPointer(event.target);
        }, true);

        document.addEventListener("touchend", function(event) {
            self.RestoreAfterPointer(event.target);
        }, true);

        document.addEventListener("click", function(event) {
            self.RestoreAfterPointer(event.target);
        }, true);
    },

    Focus: function(element) {
        this.Init();
        this.scope = element || null;
        this.FocusSink();
    },

    Release: function(element) {
        if (element && this.scope && element !== this.scope)
            return;

        this.scope = null;
        clearTimeout(this.focusTimer);

        if (this.sink && document.activeElement === this.sink)
            this.sink.blur();
    },

    FocusSink: function() {
        var self = this;

        if (!this.IsScopeActive())
            return;

        if (this.IsEditable(document.activeElement))
            return;

        var applyFocus = function() {
            if (!self.IsScopeActive() || self.IsEditable(document.activeElement))
                return;

            try {
                window.focus();
            } catch (error) {}

            try {
                self.sink.focus({ preventScroll: true });
            } catch (error) {
                try {
                    self.sink.focus();
                } catch (focusError) {}
            }
        };

        applyFocus();

        if (typeof requestAnimationFrame === "function")
            requestAnimationFrame(applyFocus);

        clearTimeout(this.focusTimer);
        this.focusTimer = setTimeout(applyFocus, 35);
    },

    RestoreAfterPointer: function(target) {
        if (!this.IsScopeActive())
            return;

        if (this.IsEditable(target))
            return;

        var self = this;
        clearTimeout(this.focusTimer);
        this.focusTimer = setTimeout(function() {
            self.FocusSink();
        }, 0);
    },

    IsScopeActive: function() {
        return !!(
            this.scope &&
            document.body.contains(this.scope) &&
            this.scope.classList.contains("active")
        );
    },

    IsEditable: function(element) {
        if (!element || element === this.sink)
            return false;

        if (element.isContentEditable)
            return true;

        var tag = String(element.tagName || "").toUpperCase();

        if (tag === "TEXTAREA" || tag === "SELECT")
            return !element.disabled;

        if (tag !== "INPUT")
            return false;

        var type = String(element.type || "text").toLowerCase();
        var nonTextTypes = {
            button: true,
            checkbox: true,
            color: true,
            file: true,
            hidden: true,
            image: true,
            radio: true,
            range: true,
            reset: true,
            submit: true
        };

        return !element.disabled && !nonTextTypes[type];
    }
};

window.UiKeyboard = UiKeyboard;
