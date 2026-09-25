(function () {
    "use strict";

    function parse(data) {
        if (!data) return {};
        if (typeof data === "object") return data;
        try { return JSON.parse(data); } catch (_) { return {}; }
    }

    var SpectatePanel = {
        root: null,
        input: null,
        name: null,
        currentId: 0,

        Init: function () {
            if (this.root) return;

            this.root = document.getElementById("spectate-panel");
            this.input = document.getElementById("spectate-id");
            this.name = document.getElementById("spectate-name");

            if (!this.root || !this.input || !this.name) return;

            document.getElementById("spectate-prev").addEventListener("click", this.Change.bind(this, -1));
            document.getElementById("spectate-next").addEventListener("click", this.Change.bind(this, 1));
            document.getElementById("spectate-refresh").addEventListener("click", this.Track.bind(this));
            document.getElementById("spectate-close").addEventListener("click", this.Stop.bind(this));

            this.input.addEventListener("keydown", function (event) {
                if (event.key === "Enter") this.Track();
            }.bind(this));
        },

        Show: function (data) {
            this.Init();
            if (!this.root) return;

            this.Update(data);
            this.root.classList.add("active");
            this.root.setAttribute("aria-hidden", "false");
        },

        Hide: function () {
            this.Init();
            if (!this.root) return;

            this.root.classList.remove("active");
            this.root.setAttribute("aria-hidden", "true");
        },

        Update: function (data) {
            this.Init();
            var payload = parse(data);
            var id = Number(payload.id ?? payload.Id ?? payload.targetId ?? payload.TargetId);
            var name = payload.name ?? payload.Name ?? payload.targetName ?? payload.TargetName;

            if (Number.isInteger(id) && id >= 0) {
                this.currentId = id;
                this.input.value = id;
            }

            this.name.textContent = name || ("ID " + this.currentId);
        },

        Change: function (step) {
            var id = Math.max(0, (Number(this.input.value) || this.currentId || 0) + step);
            this.input.value = id;
            this.currentId = id;
            this.name.textContent = "ID " + id;
            this.Track(step);
        },

        Track: function (direction) {
            var id = Math.max(0, Number(this.input.value) || 0);
            this.currentId = id;
            this.input.value = id;

            GameCef.sendJson("admin:spectate", {
                TargetId: id,
                Direction: direction || 1
            });
        },

        Stop: function () {
            GameCef.send("admin:spectate:stop");
            this.Hide();
        }
    };

    window.SpectatePanel = SpectatePanel;

    GameCef.on("admin:spectate:show", function (data) {
        SpectatePanel.Show(data);
    });

    GameCef.on("admin:spectate:update", function (data) {
        SpectatePanel.Update(data);
    });

    GameCef.on("admin:spectate:hide", function () {
        SpectatePanel.Hide();
    });
})();
