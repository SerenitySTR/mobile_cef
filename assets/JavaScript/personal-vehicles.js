var PersonalVehicles = {
    screen: null,
    vehicles: [],
    maxVehicles: 0,

    Init: function () {
        this.screen = document.getElementById("personal-vehicles");
        if (!this.screen || this.screen.getAttribute("data-bound") === "1")
            return;

        this.screen.setAttribute("data-bound", "1");
        var self = this;
        var close = document.getElementById("personal-vehicles-close");

        if (close)
            close.onclick = function () { self.Close(); };

        document.addEventListener("keydown", function (event) {
            if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
                return;
            if (!self.screen || !self.screen.classList.contains("active"))
                return;
            if (event.key !== "Escape")
                return;

            event.preventDefault();
            event.stopImmediatePropagation();
            self.Close();
        }, true);
    },

    Show: function (data) {
        this.Init();
        if (!this.screen)
            return;

        if (data !== undefined && data !== null && data !== "")
            this.SetData(data);
        else
            this.Render();

        this.screen.classList.add("active");
        this.screen.setAttribute("aria-hidden", "false");
    },

    Hide: function () {
        this.Init();
        if (!this.screen)
            return;
        this.screen.classList.remove("active");
        this.screen.setAttribute("aria-hidden", "true");
    },

    Close: function () {
        this.Hide();
        GameCef.send("personal-vehicles:close", "");
    },

    SetData: function (raw) {
        var data = this.Parse(raw);
        if (data === null)
            return;

        if (Array.isArray(data)) {
            this.vehicles = data;
            this.maxVehicles = 0;
        }
        else {
            var items = this.First(data, ["Vehicles", "vehicles", "Items", "items", "Transport", "transport"]);
            var max = this.First(data, ["MaxVehicles", "maxVehicles", "MaxSlots", "maxSlots", "Slots", "slots"]);
            this.vehicles = Array.isArray(items) ? items : [];
            this.maxVehicles = Math.max(0, Number(max) || 0);
        }

        this.Render();
    },

    Render: function () {
        this.Init();
        var list = document.getElementById("personal-vehicles-list");
        var empty = document.getElementById("personal-vehicles-empty");
        if (!list || !empty)
            return;

        list.innerHTML = "";

        var countText = String(this.vehicles.length);
        if (this.maxVehicles > 0)
            countText += " / " + this.maxVehicles;
        this.SetText("personal-vehicles-count", countText);

        if (!this.vehicles.length) {
            list.style.display = "none";
            empty.classList.add("active");
            empty.setAttribute("aria-hidden", "false");
            return;
        }

        list.style.display = "grid";
        empty.classList.remove("active");
        empty.setAttribute("aria-hidden", "true");

        for (var i = 0; i < this.vehicles.length; i++)
            list.appendChild(this.CreateCard(this.vehicles[i], i));
    },

    CreateCard: function (raw, index) {
        var vehicle = raw && typeof raw === "object" ? raw : {};
        var name = this.First(vehicle, ["Name", "name", "VehicleName", "vehicleName", "ModelName", "modelName"]);
        var fuel = this.First(vehicle, ["Fuel", "fuel"]);
        var maxFuel = this.First(vehicle, ["MaxFuel", "maxFuel", "FuelCapacity", "fuelCapacity"]);
        var condition = this.First(vehicle, ["Condition", "condition", "Health", "health"]);
        var image = this.First(vehicle, ["Image", "image", "ImageUrl", "imageUrl"]);

        var card = document.createElement("article");
        card.className = "personal-vehicle-card";
        card.setAttribute("data-index", String(index));

        var visual = document.createElement("div");
        visual.className = "personal-vehicle-visual";

        if (image) {
            var img = document.createElement("img");
            img.className = "personal-vehicle-image";
            img.alt = String(name || "Транспорт");
            img.draggable = false;
            img.src = String(image);
            img.onerror = function () {
                this.style.display = "none";
            };
            visual.appendChild(img);
        }

        var content = document.createElement("div");
        content.className = "personal-vehicle-content";

        var title = document.createElement("h3");
        title.className = "personal-vehicle-name";
        title.textContent = String(name || "Особистий транспорт");
        content.appendChild(title);

        var stats = document.createElement("div");
        stats.className = "personal-vehicle-stats";
        stats.appendChild(this.CreateStat("ПАЛИВО", this.FuelText(fuel, maxFuel)));
        stats.appendChild(this.CreateStat("СТАН", this.ConditionText(condition)));
        content.appendChild(stats);

        card.append(visual, content);
        return card;
    },

    CreatePlaceholder: function () {
        var placeholder = document.createElement("span");
        placeholder.className = "personal-vehicle-placeholder";
        placeholder.setAttribute("aria-hidden", "true");
        placeholder.innerHTML = '<svg viewBox="0 0 120 80"><path d="M18 52h84"></path><path d="M28 52 21 41a6 6 0 0 1 5-9h68a6 6 0 0 1 5 9l-7 11"></path><path d="M36 32 44 18h32l8 14"></path><path d="M31 41h13M76 41h13"></path><circle cx="34" cy="57" r="8"></circle><circle cx="86" cy="57" r="8"></circle><path d="M18 52v8h8M102 52v8h-8"></path></svg>';
        return placeholder;
    },

    CreateStat: function (label, value) {
        var stat = document.createElement("div");
        stat.className = "personal-vehicle-stat";
        var title = document.createElement("span");
        title.textContent = label;
        var strong = document.createElement("strong");
        strong.textContent = value;
        stat.append(title, strong);
        return stat;
    },

    FuelText: function (fuel, maxFuel) {
        var current = Number(fuel);
        var max = Number(maxFuel);
        if (!isFinite(current))
            return "—";
        current = Math.max(0, Math.round(current));
        if (isFinite(max) && max > 0)
            return current + " / " + Math.round(max) + " л";
        return current + " л";
    },

    ConditionText: function (value) {
        var number = Number(value);
        if (!isFinite(number))
            return "—";
        if (number > 100)
            number = number / 10;
        number = Math.max(0, Math.min(100, Math.round(number)));
        return number + "%";
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

    SetText: function (id, value) {
        var element = document.getElementById(id);
        if (element)
            element.textContent = value;
    }
};

GameCef.on("personal-vehicles:show", function (data) { PersonalVehicles.Show(data); });
GameCef.on("personal-vehicles:hide", function () { PersonalVehicles.Hide(); });
GameCef.on("personal-vehicles:set", function (data) { PersonalVehicles.SetData(data); });
