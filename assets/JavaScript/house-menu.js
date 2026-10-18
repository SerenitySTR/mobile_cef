var HouseMenu = {
    screen: null,
    data: {
        HouseId: 0,
        Number: 0,
        Owner: "",
        Price: 0,
        Class: "",
        Garage: false,
        Locked: false,
        Image: ""
    },
    lockPending: false,
    lockTimer: null,

    Init: function () {
        this.screen = document.getElementById("house-menu");
        if (!this.screen || this.screen.getAttribute("data-bound") === "1")
            return;

        this.screen.setAttribute("data-bound", "1");
        var self = this;
        var close = document.getElementById("house-menu-close");
        var info = document.getElementById("house-menu-info");
        var lock = document.getElementById("house-menu-lock");
        var sell = document.getElementById("house-menu-sell");
        var confirmSell = document.getElementById("house-menu-confirm-sell");
        var confirmCancel = document.getElementById("house-menu-confirm-cancel");

        if (close)
            close.onclick = function () { self.Close(); };
        if (info)
            info.onclick = function () { self.Render(); };
        if (lock)
            lock.onclick = function () { self.ToggleDoor(); };
        if (sell)
            sell.onclick = function () { self.OpenSellConfirm(); };
        if (confirmSell)
            confirmSell.onclick = function () { self.ConfirmSell(); };
        if (confirmCancel)
            confirmCancel.onclick = function () { self.CloseSellConfirm(); };

        document.addEventListener("keydown", function (event) {
            if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
                return;
            if (!self.screen || !self.screen.classList.contains("active"))
                return;

            if (event.key === "Escape") {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (self.SellConfirmOpen()) {
                    self.CloseSellConfirm();
                    return;
                }
                self.Close();
                return;
            }

            if (event.key === "Enter" && self.SellConfirmOpen()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.ConfirmSell();
            }
        }, true);
    },

    Show: function (data) {
        this.Init();
        if (!this.screen)
            return;
        if (data !== undefined && data !== null && data !== "")
            this.SetData(data);
        this.CloseSellConfirm();
        this.screen.classList.add("active");
        this.screen.setAttribute("aria-hidden", "false");
    },

    Hide: function () {
        this.Init();
        this.CloseSellConfirm();
        if (!this.screen)
            return;
        this.screen.classList.remove("active");
        this.screen.setAttribute("aria-hidden", "true");
    },

    Close: function () {
        this.Hide();
        GameCef.sendJson("house:close", { HouseId: this.data.HouseId });
    },

    SetData: function (raw) {
        var data = this.Parse(raw);
        if (!data)
            return;

        var id = this.First(data, ["HouseId", "houseId", "Id", "id", "Number", "number"]);
        var number = this.First(data, ["Number", "number", "HouseNumber", "houseNumber", "Id", "id"]);
        var owner = this.First(data, ["Owner", "owner", "OwnerName", "ownerName"]);
        var price = this.First(data, ["Price", "price"]);
        var houseClass = this.First(data, ["Class", "class", "HouseClass", "houseClass"]);
        var garage = this.First(data, ["Garage", "garage", "HasGarage", "hasGarage"]);
        var locked = this.First(data, ["Locked", "locked", "IsLocked", "isLocked"]);
        var image = this.First(data, ["Image", "image"]);

        if (id !== undefined) this.data.HouseId = Number(id) || 0;
        if (number !== undefined) this.data.Number = number;
        if (owner !== undefined) this.data.Owner = String(owner || "");
        if (price !== undefined) this.data.Price = Number(price) || 0;
        if (houseClass !== undefined) this.data.Class = String(houseClass || "");
        if (garage !== undefined) this.data.Garage = this.ToBool(garage);
        if (locked !== undefined) this.data.Locked = this.ToBool(locked);
        if (image !== undefined) this.data.Image = String(image || "");
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }
        this.lockPending = false;
        this.Render();
    },

    Render: function () {
        this.Init();
        var number = this.data.Number || this.data.HouseId || "—";
        this.SetText("house-menu-number-title", "Будинок №" + number);
        this.SetText("house-menu-image-number", "№ " + number);
        this.SetText("house-menu-number", "№ " + number);
        this.SetText("house-menu-owner", this.data.Owner || "—");
        this.SetText("house-menu-price", this.Money(this.data.Price));
        this.SetText("house-menu-class", this.data.Class || "—");
        this.SetText("house-menu-garage", this.data.Garage ? "Так" : "Ні");
        this.SetText("house-menu-door-status", this.data.Locked ? "Закрито" : "Відкрито");
        this.SetText("house-menu-door-badge", this.data.Locked ? "Закрито" : "Відкрито");

        var statePrice = Math.floor(Math.max(0, Number(this.data.Price) || 0) / 2);
        this.SetText("house-menu-sell-price", this.Money(statePrice));
        this.SetText("house-menu-confirm-price", this.Money(statePrice));

        var status = document.getElementById("house-menu-door-status");
        var badge = document.getElementById("house-menu-door-badge");
        var lock = document.getElementById("house-menu-lock");
        var image = document.getElementById("house-menu-image");

        if (status) {
            status.classList.toggle("status-open", !this.data.Locked);
            status.classList.toggle("status-closed", this.data.Locked);
        }
        if (badge)
            badge.classList.toggle("locked", this.data.Locked);
        if (lock) {
            lock.disabled = this.lockPending;
            var lockLabel = lock.querySelector("span:last-child");
            if (lockLabel)
                lockLabel.textContent = this.data.Locked ? "Відкрити двері" : "Закрити двері";
            lock.setAttribute("title", this.data.Locked ? "Відкрити двері" : "Закрити двері");
        }
        if (image) {
            var fallbackImage = "./assets/CSS/Images/Spawn/house-new.webp";
            image.onerror = function () {
                image.onerror = null;
                image.src = fallbackImage;
            };
            image.src = this.data.Image || fallbackImage;
        }
    },

    ToggleDoor: function () {
        if (this.lockPending)
            return;
        this.lockPending = true;
        GameCef.sendJson("house:lock", { HouseId: this.data.HouseId });
        this.data.Locked = !this.data.Locked;
        this.Render();
        var self = this;
        if (this.lockTimer)
            clearTimeout(this.lockTimer);
        this.lockTimer = setTimeout(function () {
            self.lockTimer = null;
            self.lockPending = false;
            self.Render();
        }, 800);
    },

    OpenSellConfirm: function () {
        var confirm = document.getElementById("house-menu-confirm");
        if (!confirm)
            return;
        confirm.classList.add("active");
        confirm.setAttribute("aria-hidden", "false");
    },

    CloseSellConfirm: function () {
        var confirm = document.getElementById("house-menu-confirm");
        if (!confirm)
            return;
        confirm.classList.remove("active");
        confirm.setAttribute("aria-hidden", "true");
    },

    SellConfirmOpen: function () {
        var confirm = document.getElementById("house-menu-confirm");
        return !!(confirm && confirm.classList.contains("active"));
    },

    ConfirmSell: function () {
        if (!this.SellConfirmOpen())
            return;
        this.CloseSellConfirm();
        GameCef.sendJson("house:sell", { HouseId: this.data.HouseId });
    },

    Parse: function (data) {
        if (data === undefined || data === null || data === "")
            return null;
        if (typeof data === "object")
            return data;
        try { return JSON.parse(data); }
        catch (_) { return null; }
    },

    First: function (data, keys) {
        for (var i = 0; i < keys.length; i++)
            if (Object.prototype.hasOwnProperty.call(data, keys[i]))
                return data[keys[i]];
        return undefined;
    },

    ToBool: function (value) {
        if (typeof value === "boolean")
            return value;
        if (typeof value === "number")
            return value !== 0;
        value = String(value || "").toLowerCase();
        return value === "true" || value === "1" || value === "yes" || value === "так" || value === "locked" || value === "closed";
    },

    Money: function (value) {
        var number = Math.max(0, Math.floor(Number(value) || 0));
        return "$" + String(number).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },

    SetText: function (id, value) {
        var element = document.getElementById(id);
        if (element)
            element.textContent = value;
    }
};

GameCef.on("house:show", function (data) { HouseMenu.Show(data); });
GameCef.on("house:hide", function () { HouseMenu.Hide(); });
GameCef.on("house:set", function (data) { HouseMenu.SetData(data); });
