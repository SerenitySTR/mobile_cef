var Dialog = {
    screen: null,
    window: null,
    dialogId: 0,
    type: "message",
    selectedIndex: -1,
    selectedItemId: 0,
    data: null,

    Init: function() {
        this.screen = document.getElementById("dialog-screen");
        this.window = document.getElementById("dialog-window");
        this.ApplyDeviceLayout();
    },

    ApplyDeviceLayout: function() {
        if (!this.screen)
            return;

        var userAgent = navigator.userAgent || "";
        var isMobileAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
        var isTouch = navigator.maxTouchPoints > 0;
        var width = window.innerWidth || document.documentElement.clientWidth || 0;
        var height = window.innerHeight || document.documentElement.clientHeight || 0;
        var shortSide = Math.min(width, height);
        var landscape = width > height;
        var mobile = isMobileAgent || (isTouch && shortSide <= 900);

        this.screen.classList.toggle("dialog-mobile-landscape", mobile && landscape);
        this.screen.classList.toggle("dialog-mobile-low", mobile && landscape && height <= 430);
    },

    Show: function(data) {
        this.Init();

        if (!this.screen)
            return;

        data = this.Parse(data) || {};
        this.data = data;
        this.dialogId = Number(this.Get(data, "DialogId", "dialogId")) || 0;
        this.type = String(this.Get(data, "Type", "type") || "message").toLowerCase();
        this.selectedIndex = -1;
        this.selectedItemId = 0;

        this.SetHeader(data);
        this.SetText(data);
        this.RenderContent(data);
        this.RenderButtons(this.Get(data, "Buttons", "buttons") || []);

        this.screen.classList.remove("closing");
        this.screen.classList.add("active");

        void this.screen.offsetWidth;
        this.screen.classList.add("opened");

        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Focus(this.screen);
    },

    Hide: function(callback) {
        this.Init();

        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Release(this.screen);

        if (!this.screen || !this.screen.classList.contains("active")) {
            if (callback)
                callback();

            return;
        }

        this.screen.classList.remove("opened");
        this.screen.classList.add("closing");

        setTimeout(function() {
            if (Dialog.screen) {
                Dialog.screen.classList.remove("active");
                Dialog.screen.classList.remove("closing");
            }

            if (callback)
                callback();
        }, 200);
    },

    SetHeader: function(data) {
        var title = this.Get(data, "Title", "title") || "Діалог";
        var icon = this.Get(data, "Icon", "icon");
        var titleElement = document.getElementById("dialog-title");
        var iconElement = document.getElementById("dialog-icon");

        if (titleElement)
            titleElement.textContent = title;

        if (iconElement)
            iconElement.textContent = icon || this.GetDefaultIcon(this.type);
    },

    SetText: function(data) {
        var text = this.Get(data, "Text", "text") || "";
        var element = document.getElementById("dialog-text");

        if (element)
            element.textContent = text;
    },

    RenderContent: function(data) {
        var inputWrap = document.getElementById("dialog-input-wrap");
        var input = document.getElementById("dialog-input");
        var list = document.getElementById("dialog-list");
        var tablist = document.getElementById("dialog-tablist");

        if (inputWrap)
            inputWrap.style.display = "none";

        if (inputWrap)
            inputWrap.classList.remove("dialog-password");

        if (list) {
            list.style.display = "none";
            list.innerHTML = "";
        }

        if (tablist) {
            tablist.style.display = "none";
            tablist.innerHTML = "";
        }

        if (this.type === "input" || this.type === "password") {
            if (!inputWrap || !input)
                return;

            inputWrap.style.display = "block";
            inputWrap.classList.toggle("dialog-password", this.type === "password");
            input.type = this.type === "password" ? "password" : "text";
            input.placeholder = this.Get(data, "Placeholder", "placeholder") || "";
            input.value = this.Get(data, "Value", "value") || "";
            input.maxLength = Number(this.Get(data, "MaxLength", "maxLength")) || 256;

            setTimeout(function() {
                input.focus();
            }, 80);

            return;
        }

        if (this.type === "list") {
            this.RenderList(this.Get(data, "Items", "items") || []);
            return;
        }

        if (this.type === "tablist")
            this.RenderTablist(this.Get(data, "Columns", "columns") || [], this.Get(data, "Items", "items") || []);
    },

    RenderList: function(items) {
        var container = document.getElementById("dialog-list");

        if (!container || !Array.isArray(items))
            return;

        container.style.display = "flex";

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var id = this.Get(item, "Id", "id");
            var title = typeof item === "string" ? item : this.Get(item, "Title", "title");
            var description = typeof item === "string" ? "" : this.Get(item, "Description", "description");
            var button = document.createElement("button");

            button.type = "button";
            button.className = "dialog-list-item";
            button.dataset.index = i;
            button.dataset.itemId = id !== undefined ? id : i;
            button.innerHTML =
                '<span class="dialog-list-number">' + (i + 1) + '</span>' +
                '<span class="dialog-list-content">' +
                    '<span class="dialog-list-title">' + this.Escape(title || "") + '</span>' +
                    (description ? '<span class="dialog-list-description">' + this.Escape(description) + '</span>' : '') +
                '</span>';

            button.onclick = function() {
                Dialog.SelectRow(this);
            };

            container.appendChild(button);
        }
    },

    RenderTablist: function(columns, items) {
        var container = document.getElementById("dialog-tablist");

        if (!container || !Array.isArray(items))
            return;

        container.style.display = "block";

        var table = document.createElement("table");
        table.className = "dialog-table";

        if (Array.isArray(columns) && columns.length > 0) {
            var thead = document.createElement("thead");
            var headerRow = document.createElement("tr");

            for (var i = 0; i < columns.length; i++) {
                var th = document.createElement("th");
                th.textContent = typeof columns[i] === "string" ? columns[i] : (this.Get(columns[i], "Title", "title") || "");
                headerRow.appendChild(th);
            }

            thead.appendChild(headerRow);
            table.appendChild(thead);
        }

        var tbody = document.createElement("tbody");

        for (var rowIndex = 0; rowIndex < items.length; rowIndex++) {
            var item = items[rowIndex];
            var values = this.Get(item, "Values", "values");

            if (!Array.isArray(values))
                values = Array.isArray(item) ? item : [];

            var tr = document.createElement("tr");
            var itemId = this.Get(item, "Id", "id");

            tr.dataset.index = rowIndex;
            tr.dataset.itemId = itemId !== undefined ? itemId : rowIndex;

            for (var columnIndex = 0; columnIndex < values.length; columnIndex++) {
                var td = document.createElement("td");
                td.textContent = values[columnIndex] !== undefined && values[columnIndex] !== null ? values[columnIndex] : "";
                tr.appendChild(td);
            }

            tr.onclick = function() {
                Dialog.SelectRow(this);
            };

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        container.appendChild(table);
    },

    SelectRow: function(element) {
        var selected = this.screen.querySelectorAll(".dialog-list-item.selected, .dialog-table tr.selected");

        for (var i = 0; i < selected.length; i++)
            selected[i].classList.remove("selected");

        element.classList.add("selected");
        this.selectedIndex = Number(element.dataset.index);
        this.selectedItemId = Number(element.dataset.itemId);
    },

    RenderButtons: function(buttons) {
        var container = document.getElementById("dialog-buttons");

        if (!container)
            return;

        container.innerHTML = "";

        if (!Array.isArray(buttons) || buttons.length === 0)
            buttons = [{ Id: 1, Text: "Закрити", Type: "primary" }];

        var mobileLandscape = this.screen && this.screen.classList.contains("dialog-mobile-landscape");
        var columns = buttons.length === 1 ? 1 : buttons.length === 3 && !mobileLandscape ? 3 : 2;

        container.style.setProperty("--dialog-button-columns", columns);

        if (this.screen)
            this.screen.classList.toggle("dialog-many-buttons", mobileLandscape && buttons.length >= 3);

        for (var i = 0; i < buttons.length; i++) {
            var data = buttons[i];
            var id = Number(this.Get(data, "Id", "id"));
            var text = this.Get(data, "Text", "text") || "Кнопка";
            var type = String(this.Get(data, "Type", "type") || "default").toLowerCase();
            var button = document.createElement("button");

            button.type = "button";
            button.className = "dialog-button dialog-button-" + type;
            button.textContent = text;

            button.onclick = function(buttonId) {
                return function() {
                    Dialog.Submit(buttonId);
                };
            }(id);

            container.appendChild(button);
        }
    },

    Submit: function(buttonId) {
        var input = document.getElementById("dialog-input");
        var value = input ? input.value : "";

        var response = {
            DialogId: this.dialogId,
            ButtonId: buttonId,
            Input: encodeURIComponent(value),
            SelectedIndex: this.selectedIndex,
            SelectedItemId: this.selectedItemId
        };

        console.log("Dialog input:", value);
        console.log("Dialog response:", JSON.stringify(response));

        this.Hide(function() {
            GameCef.sendJson("dialog:response", response);
        });
    },

    Close: function() {
        var response = {
            DialogId: this.dialogId,
            ButtonId: -1,
            Input: "",
            SelectedIndex: this.selectedIndex,
            SelectedItemId: this.selectedItemId
        };

        this.Hide(function() {
            GameCef.sendJson("dialog:response", response);
        });
    },

    TogglePassword: function() {
        var input = document.getElementById("dialog-input");

        if (!input)
            return;

        input.type = input.type === "password" ? "text" : "password";
    },

    GetDefaultIcon: function(type) {
        switch (type) {
            case "input":
                return "✎";
            case "password":
                return "●";
            case "list":
                return "≡";
            case "tablist":
                return "☷";
            default:
                return "i";
        }
    },

    Parse: function(data) {
        if (data === undefined || data === null || data === "")
            return null;

        if (typeof data !== "string")
            return data;

        try {
            var result = JSON.parse(data);

            if (typeof result === "string") {
                try {
                    result = JSON.parse(result);
                } catch (error) {}
            }

            return result;
        } catch (error) {
            console.error("Dialog JSON parse error:");
            console.error(error);
            console.error(data);
            return null;
        }
    },

    Get: function(data, pascalName, camelName) {
        if (!data)
            return undefined;

        if (data[pascalName] !== undefined)
            return data[pascalName];

        return data[camelName];
    },

    Escape: function(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

var dialogClose = document.getElementById("dialog-close");
var dialogPasswordToggle = document.getElementById("dialog-password-toggle");
var dialogInput = document.getElementById("dialog-input");

if (dialogClose) {
    dialogClose.onclick = function() {
        var buttons = document.querySelectorAll("#dialog-buttons .dialog-button");

        if (buttons.length > 0) {
            buttons[buttons.length - 1].click();
            return;
        }

        Dialog.Close();
    };
}

if (dialogPasswordToggle) {
    dialogPasswordToggle.onclick = function() {
        Dialog.TogglePassword();
    };
}

document.addEventListener("keydown", function(event) {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
        return;

    if (!Dialog.screen || !Dialog.screen.classList.contains("active"))
        return;

    if (document.getElementById("error-screen")?.classList.contains("active"))
        return;

    var buttons = document.querySelectorAll("#dialog-buttons .dialog-button");

    if (event.key === "Escape") {
        if (buttons.length === 0 || buttons[buttons.length - 1].disabled)
            return;

        event.preventDefault();
        event.stopImmediatePropagation();
        buttons[buttons.length - 1].click();
        return;
    }

    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
        return;

    if (buttons.length === 0 || buttons[0].disabled)
        return;

    event.preventDefault();
    event.stopImmediatePropagation();
    buttons[0].click();
});

GameCef.on("dialog:show", function(data) {
    Dialog.Show(data);
});

GameCef.on("dialog:hide", function() {
    Dialog.Hide();
});

window.addEventListener("resize", function() {
    Dialog.Init();
});

window.addEventListener("orientationchange", function() {
    setTimeout(function() {
        Dialog.Init();
    }, 120);
});
