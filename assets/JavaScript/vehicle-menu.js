var VehicleMenu = {
    screen: null,
    state: {
        vehicleName: "Транспорт",
        engine: false,
        lights: false,
        trunk: false,
        doors: false
    },
    Init: function () {
        if (this.screen)
            return;
        this.screen = document.getElementById("vehicle-menu");
        if (!this.screen)
            return;
        this.CreateTestButtons(20);
        var buttons = this.screen.querySelectorAll("[data-vehicle-action]");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", function () {
                var action = this.getAttribute("data-vehicle-action");
                VehicleMenu.Toggle(action);
            });
        }
        var close = document.getElementById("vehicle-menu-close");
        if (close)
            close.addEventListener("click", function () { VehicleMenu.Close(true); });
    },
    CreateTestButtons: function (count) {
        if (!this.screen || this.screen.querySelector("[data-vehicle-test-button]"))
            return;
        var container = document.createElement("div");
        container.className = "vehicle-menu-test-buttons";
        container.setAttribute("aria-hidden", "true");
        for (var i = 1; i <= count; i++) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "vehicle-menu-test-button";
            button.tabIndex = -1;
            button.setAttribute("data-vehicle-test-button", String(i));
            button.textContent = "Test " + i;
            button.addEventListener("click", function () {
                if (window.GameCef)
                    GameCef.sendJson("vehicle-menu:test", { Index: Number(this.getAttribute("data-vehicle-test-button")) });
            });
            container.appendChild(button);
        }
        this.screen.appendChild(container);
    },
    Parse: function (data) {
        if (!data)
            return {};
        if (typeof data === "object")
            return data;
        try {
            return JSON.parse(data);
        }
        catch (_) {
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
    Apply: function (data) {
        data = this.Parse(data);
        var vehicleName = this.Get(data, "VehicleName", "vehicleName");
        var engine = this.Get(data, "Engine", "engine");
        var lights = this.Get(data, "Lights", "lights");
        var trunk = this.Get(data, "Trunk", "trunk");
        var doors = this.Get(data, "Doors", "doors");
        if (vehicleName !== undefined)
            this.state.vehicleName = String(vehicleName || "Транспорт");
        if (engine !== undefined)
            this.state.engine = !!engine;
        if (lights !== undefined)
            this.state.lights = !!lights;
        if (trunk !== undefined)
            this.state.trunk = !!trunk;
        if (doors !== undefined)
            this.state.doors = !!doors;
        this.Render();
    },
    Render: function () {
        this.Init();
        if (!this.screen)
            return;
        var name = document.getElementById("vehicle-menu-name");
        if (name)
            name.textContent = this.state.vehicleName;
        this.RenderAction("engine", this.state.engine, "Увімкнено", "Вимкнено");
        this.RenderAction("lights", this.state.lights, "Увімкнено", "Вимкнено");
        this.RenderAction("trunk", this.state.trunk, "Відкрито", "Закрито");
        this.RenderAction("doors", this.state.doors, "Відкрито", "Закрито");
    },
    RenderAction: function (action, enabled, enabledText, disabledText) {
        var button = this.screen.querySelector('[data-vehicle-action="' + action + '"]');
        var state = this.screen.querySelector('[data-vehicle-state="' + action + '"]');
        if (button)
            button.classList.toggle("enabled", !!enabled);
        if (state)
            state.textContent = enabled ? enabledText : disabledText;
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
            if (VehicleMenu.screen) {
                VehicleMenu.screen.classList.remove("active", "closing");
                VehicleMenu.screen.setAttribute("aria-hidden", "true");
            }
            if (callback)
                callback();
        }, 190);
    },
    Close: function (notifyServer) {
        this.Hide();
        if (notifyServer !== false && window.GameCef)
            GameCef.send("vehicle-menu:close", "");
    },
    Toggle: function (action) {
        if (!Object.prototype.hasOwnProperty.call(this.state, action))
            return;
        var enabled = !this.state[action];
        this.state[action] = enabled;
        this.Render();
        if (window.GameCef)
            GameCef.sendJson("vehicle-menu:toggle", { Action: action, Enabled: enabled });
    }
};
GameCef.on("vehicle-menu:show", function (data) { VehicleMenu.Show(data); });
GameCef.on("vehicle-menu:update", function (data) { VehicleMenu.Apply(data); });
GameCef.on("vehicle-menu:hide", function () { VehicleMenu.Hide(); });
document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape")
        return;
    VehicleMenu.Init();
    if (!VehicleMenu.screen || !VehicleMenu.screen.classList.contains("active"))
        return;
    event.preventDefault();
    VehicleMenu.Close(true);
});
