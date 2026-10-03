var QuickMenu = {
    screen: null,
    left: null,
    right: null,
    state: {
        menuId: "",
        closeOnSelect: false,
        items: []
    },

    icons: {
        engine: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 12h15l3 3v8h-4l-2.5 3H11l-2-3H5v-8h3v-3ZM12 12V8h7v4M4 12v8M27 14h2v7h-2"></path></svg>',
        lights: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M15 8.5c-4.5.2-7.2 3-7.2 7.5s2.7 7.3 7.2 7.5v-15Z"></path><path d="M19 10.5h9M19 16h10M19 21.5h9"></path></svg>',
        trunk: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 15h20v9H6z"></path><path d="M9 15v-4h14v4M6 19h20M10 13l2-4h8l2 4"></path></svg>',
        doors: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8.5 26V8.5c0-1.4 1-2.5 2.4-2.7L23.5 4v22H8.5Z"></path><path d="M8.5 26h17M18.5 15.5h2"></path></svg>',
        lock: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="14" width="18" height="13" rx="2"></rect><path d="M11 14v-4a5 5 0 0 1 10 0v4M16 19v4"></path></svg>',
        key: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="11" cy="16" r="5"></circle><path d="M16 16h11M23 16v4M19 16v3"></path></svg>',
        car: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5.5 19.5h21l-1.8-5.2a3.2 3.2 0 0 0-3-2.2H10.3a3.2 3.2 0 0 0-3 2.2l-1.8 5.2Z"></path><path d="M4.5 19.5v5.6c0 1.3 1 2.4 2.4 2.4h2v-3h14.2v3h2c1.3 0 2.4-1 2.4-2.4v-5.6M8 20.5h4M20 20.5h4"></path></svg>',
        repair: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M20.5 5.5a7 7 0 0 0-8.8 8.8L5 21l6 6 6.7-6.7a7 7 0 0 0 8.8-8.8l-4 4-4-1-1-4 4-4Z"></path></svg>',
        fuel: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 4h12v24H7zM9 8h8v6H9zM19 10h3l3 3v10a2 2 0 0 0 4 0V12l-4-4"></path></svg>',
        home: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 15 16 5l11 10v12H5V15Z"></path><path d="M12 27v-8h8v8"></path></svg>',
        player: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="10" r="5"></circle><path d="M7 27c.8-6 4-9 9-9s8.2 3 9 9"></path></svg>',
        settings: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="4"></circle><path d="m16 4 2 3 4-.2.8 3.9 3.5 2-2 3.5 2 3.5-3.5 2-.8 3.9-4-.2-2 3-2-3-4 .2-.8-3.9-3.5-2 2-3.5-2-3.5 3.5-2 .8-3.9 4 .2 2-3Z"></path></svg>',
        info: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11"></circle><path d="M16 14v8M16 10h.01"></path></svg>',
        star: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 4 3.7 7.5 8.3 1.2-6 5.8 1.4 8.2L16 22.8 8.6 26.7l1.4-8.2-6-5.8 8.3-1.2L16 4Z"></path></svg>',
        dots: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="8" cy="16" r="1.7"></circle><circle cx="16" cy="16" r="1.7"></circle><circle cx="24" cy="16" r="1.7"></circle></svg>'
    },

    Init: function () {
        if (this.screen)
            return;

        this.screen = document.getElementById("quick-menu");
        if (!this.screen)
            return;

        this.left = document.getElementById("quick-menu-left");
        this.right = document.getElementById("quick-menu-right");

        var close = document.getElementById("quick-menu-close");
        if (close)
            close.addEventListener("click", function () { QuickMenu.Close(true); });
    },

    Parse: function (data) {
        if (!data)
            return {};

        if (typeof data === "object")
            return data;

        try {
            return JSON.parse(data);
        } catch (_) {
            return {};
        }
    },

    Get: function (data, upper, lower) {
        if (!data)
            return undefined;
        if (data[upper] !== undefined)
            return data[upper];
        return data[lower];
    },

    NormalizeItem: function (raw, index) {
        raw = raw || {};

        var id = this.Get(raw, "Id", "id");
        var text = this.Get(raw, "Text", "text");
        var icon = this.Get(raw, "Icon", "icon");
        var status = this.Get(raw, "Status", "status");
        var active = this.Get(raw, "Active", "active");
        var disabled = this.Get(raw, "Disabled", "disabled");
        var visible = this.Get(raw, "Visible", "visible");
        var closeOnSelect = this.Get(raw, "CloseOnSelect", "closeOnSelect");

        return {
            id: id !== undefined ? id : index,
            text: text !== undefined ? String(text) : "Дія " + (index + 1),
            icon: icon !== undefined ? String(icon).toLowerCase() : "dots",
            status: status !== undefined && status !== null ? String(status) : "",
            active: active === true,
            disabled: disabled === true,
            visible: visible !== false,
            closeOnSelect: closeOnSelect
        };
    },

    Apply: function (data) {
        data = this.Parse(data);

        var menuId = this.Get(data, "MenuId", "menuId");
        var closeOnSelect = this.Get(data, "CloseOnSelect", "closeOnSelect");
        var items = this.Get(data, "Items", "items");

        if (menuId !== undefined)
            this.state.menuId = String(menuId || "");

        if (closeOnSelect !== undefined)
            this.state.closeOnSelect = closeOnSelect === true;

        if (Array.isArray(items)) {
            this.state.items = [];
            for (var i = 0; i < items.length; i++)
                this.state.items.push(this.NormalizeItem(items[i], i));
        }

        this.Render();
    },

    Render: function () {
        this.Init();
        if (!this.screen || !this.left || !this.right)
            return;

        this.left.innerHTML = "";
        this.right.innerHTML = "";

        var visibleIndex = 0;

        for (var i = 0; i < this.state.items.length; i++) {
            var item = this.state.items[i];
            var button = this.CreateItem(item);

            if (!item.visible) {
                button.classList.add("hidden");
                this.left.appendChild(button);
                continue;
            }

            if (visibleIndex % 2 === 0)
                this.left.appendChild(button);
            else
                this.right.appendChild(button);

            visibleIndex++;
        }
    },

    CreateItem: function (item) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "quick-menu-item";
        button.setAttribute("data-quick-menu-id", String(item.id));

        if (item.active)
            button.classList.add("active");
        if (item.disabled)
            button.classList.add("disabled");
        if (!item.status)
            button.classList.add("no-status");

        var icon = document.createElement("span");
        icon.className = "quick-menu-icon";
        icon.innerHTML = this.icons[item.icon] || this.icons.dots;

        var copy = document.createElement("span");
        copy.className = "quick-menu-copy";

        var title = document.createElement("strong");
        title.textContent = item.text;

        var status = document.createElement("small");
        status.className = "quick-menu-status";
        status.textContent = item.status;

        copy.appendChild(title);
        copy.appendChild(status);
        button.appendChild(icon);
        button.appendChild(copy);

        if (!item.disabled) {
            button.addEventListener("click", function () {
                QuickMenu.Select(item);
            });
        }

        return button;
    },

    Select: function (item) {
        if (!item || item.disabled)
            return;

        if (window.GameCef) {
            GameCef.sendJson("quick-menu:select", {
                MenuId: this.state.menuId,
                Id: item.id
            });
        }

        var shouldClose = item.closeOnSelect !== undefined
            ? item.closeOnSelect === true
            : this.state.closeOnSelect;

        if (shouldClose)
            this.Hide();
    },

    Show: function (data) {
        this.Init();
        if (!this.screen)
            return;

        this.Apply(data);
        this.screen.classList.remove("closing");
        this.screen.classList.add("active");
        this.screen.setAttribute("aria-hidden", "false");

        void this.screen.offsetWidth;
        this.screen.classList.add("opened");

        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Focus(this.screen);
    },

    Hide: function (callback) {
        this.Init();
        if (!this.screen || !this.screen.classList.contains("active")) {
            if (callback)
                callback();
            return;
        }

        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Release(this.screen);

        this.screen.classList.remove("opened");
        this.screen.classList.add("closing");

        setTimeout(function () {
            if (QuickMenu.screen) {
                QuickMenu.screen.classList.remove("active", "closing");
                QuickMenu.screen.setAttribute("aria-hidden", "true");
            }

            if (callback)
                callback();
        }, 190);
    },

    Close: function (notifyServer) {
        var menuId = this.state.menuId;
        this.Hide();

        if (notifyServer !== false && window.GameCef) {
            GameCef.sendJson("quick-menu:close", {
                MenuId: menuId
            });
        }
    }
};

GameCef.on("quick-menu:show", function (data) { QuickMenu.Show(data); });
GameCef.on("quick-menu:update", function (data) { QuickMenu.Apply(data); });
GameCef.on("quick-menu:hide", function () { QuickMenu.Hide(); });

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape")
        return;

    QuickMenu.Init();
    if (!QuickMenu.screen || !QuickMenu.screen.classList.contains("active"))
        return;

    event.preventDefault();
    QuickMenu.Close(true);
});
