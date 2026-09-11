var MainMenu = {
    screen: null,
    grid: null,
    items: [
        {
            Id: "statistics",
            Title: "Статистика",
            Description: "Статистика та навички персонажа",
            Image: "./assets/CSS/Images/Spawn/standard.svg",
            Event: "main-menu:select"
        }
    ],

    Init: function() {
        this.screen = document.getElementById("main-menu");
        this.grid = document.getElementById("main-menu-grid");
    },

    Show: function(data) {
        this.Init();

        if (!this.screen)
            return;

        data = this.Parse(data) || {};

        var profile = this.Get(data, "Profile", "profile") || data;
        var items = this.Get(data, "Items", "items");

        this.SetProfile(profile);

        if (items && Array.isArray(items))
            this.SetItems(items);
        else
            this.Render();

        this.screen.classList.add("active");

        if (typeof Loading !== "undefined" && Loading.Hide)
            Loading.Hide();
    },

    Hide: function() {
        this.Init();

        if (this.screen)
            this.screen.classList.remove("active");
    },

    SetProfile: function(data) {
        var profile = this.Parse(data) || {};
        var name = this.Get(profile, "Name", "name");
        var id = this.Get(profile, "Id", "id");
        var level = this.Get(profile, "Level", "level");
        var avatar = this.Get(profile, "Avatar", "avatar");

        var nameElement = document.getElementById("main-menu-player-name");
        var idElement = document.getElementById("main-menu-player-id");
        var levelElement = document.getElementById("main-menu-player-level");
        var avatarElement = document.getElementById("main-menu-avatar");

        if (nameElement)
            nameElement.textContent = name || "Serenity";

        if (idElement)
            idElement.textContent = id !== undefined ? id : 0;

        if (levelElement)
            levelElement.textContent = (level !== undefined ? level : 1) + " рівень";

        if (avatarElement) {
            avatarElement.classList.remove("has-image");
            avatarElement.style.backgroundImage = "";
            avatarElement.textContent = this.GetInitial(name || "Serenity");

            if (avatar) {
                avatarElement.classList.add("has-image");
                avatarElement.style.backgroundImage = "url('" + this.EscapeAttribute(avatar) + "')";
            }
        }
    },

    SetItems: function(items) {
        if (!Array.isArray(items))
            return;

        this.items = items;
        this.Render();
    },

    AddItem: function(item) {
        if (!item)
            return;

        var id = this.Get(item, "Id", "id");

        if (!id)
            return;

        for (var i = 0; i < this.items.length; i++) {
            if (this.Get(this.items[i], "Id", "id") === id)
                return;
        }

        this.items.push(item);
        this.Render();
    },

    RemoveItem: function(id) {
        for (var i = this.items.length - 1; i >= 0; i--) {
            if (this.Get(this.items[i], "Id", "id") === id)
                this.items.splice(i, 1);
        }

        this.Render();
    },

    UpdateItem: function(id, data) {
        if (!data)
            return;

        for (var i = 0; i < this.items.length; i++) {
            if (this.Get(this.items[i], "Id", "id") !== id)
                continue;

            for (var key in data)
                this.items[i][key] = data[key];

            break;
        }

        this.Render();
    },

    Render: function() {
        this.Init();

        if (!this.grid)
            return;

        this.grid.innerHTML = "";

        for (var i = 0; i < this.items.length; i++)
            this.AddCard(this.items[i]);
    },

    AddCard: function(item) {
        var id = this.Get(item, "Id", "id");
        var title = this.Get(item, "Title", "title");
        var description = this.Get(item, "Description", "description");
        var image = this.Get(item, "Image", "image");
        var eventName = this.Get(item, "Event", "event");

        var card = document.createElement("button");
        card.type = "button";
        card.className = "main-menu-card";

        if (this.items.length === 1)
            card.classList.add("single");

        card.innerHTML =
            '<span class="main-menu-card-background" style="background-image:url(\'' + this.EscapeAttribute(image || "./assets/CSS/Images/Spawn/standard.svg") + '\')"></span>' +
            '<span class="main-menu-card-overlay"></span>' +
            '<span class="main-menu-card-content">' +
                '<span class="main-menu-card-title">' + this.Escape(title || "") + '</span>' +
                '<span class="main-menu-card-description">' + this.Escape(description || "") + '</span>' +
            '</span>' +
            '<span class="main-menu-card-arrow">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"></path></svg>' +
            '</span>';

        card.onclick = function() {
            MainMenu.Select(id, eventName);
        };

        this.grid.appendChild(card);
    },

    Select: function(id, eventName) {
        if (!id)
            return;

        this.Hide();

        GameCef.sendJson(eventName || "main-menu:select", { Id: id });
    },

    GetInitial: function(name) {
        name = String(name || "").trim();
        return name ? name.charAt(0).toUpperCase() : "?";
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
            console.error("MainMenu JSON parse error:");
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
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    EscapeAttribute: function(value) {
        return String(value || "")
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/\"/g, "&quot;");
    }
};

var mainMenuClose = document.getElementById("main-menu-close");

if (mainMenuClose) {
    mainMenuClose.onclick = function() {
        MainMenu.Hide();
        GameCef.sendJson("main-menu:close", {});
    };
}

GameCef.on("main-menu:show", function(data) {
    MainMenu.Show(data);
});

GameCef.on("main-menu:hide", function() {
    MainMenu.Hide();
});

GameCef.on("main-menu:items", function(data) {
    var items = MainMenu.Parse(data);

    if (items)
        MainMenu.SetItems(items);
});
