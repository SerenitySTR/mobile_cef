var Reports = {
    root: null,
    list: null,
    messages: null,
    selectedId: null,
    filter: "all",
    data: {
        Reports: []
    },

    Init: function() {
        this.root = document.getElementById("reports");
        this.list = document.getElementById("reports-list");
        this.messages = document.getElementById("reports-messages");
    },

    Parse: function(data) {
        if (data && typeof data === "object")
            return data;

        if (typeof data !== "string" || !data.trim())
            return null;

        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    },

    Show: function(data) {
        var payload = this.Parse(data);

        if (payload && Array.isArray(payload.Reports))
            this.data = payload;

        this.root.classList.add("active");
        this.root.setAttribute("aria-hidden", "false");
        this.Render();
    },

    Hide: function() {
        this.root.classList.remove("active");
        this.root.setAttribute("aria-hidden", "true");
        document.getElementById("reports-create-modal").classList.add("hidden");
    },

    GetReport: function(id) {
        return this.data.Reports.find(function(report) {
            return Number(report.Id) === Number(id);
        });
    },

    Render: function() {
        var self = this;
        var reports = this.data.Reports.filter(function(report) {
            var closed = String(report.Status).toLowerCase() === "closed";

            if (self.filter === "open")
                return !closed;

            if (self.filter === "closed")
                return closed;

            return true;
        });

        this.list.innerHTML = "";

        reports.forEach(function(report) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "report-row";

            if (Number(report.Id) === Number(self.selectedId))
                button.classList.add("active");

            button.innerHTML =
                '<span class="report-row-top">' +
                    '<span>#' + Number(report.Id) + '</span>' +
                    '<span>' + self.Escape(report.Date || "") + '</span>' +
                '</span>' +
                '<strong>' + self.Escape(report.Title || "Репорт") + '</strong>' +
                '<small>' + self.StatusText(report.Status) + '</small>';

            button.onclick = function() {
                self.Select(report.Id);
            };

            self.list.appendChild(button);
        });

        if (this.selectedId != null && this.GetReport(this.selectedId))
            this.Select(this.selectedId);
        else if (reports.length > 0)
            this.Select(reports[0].Id);
        else
            this.ShowEmpty();
    },

    Select: function(id) {
        var report = this.GetReport(id);

        if (!report)
            return;

        this.selectedId = Number(id);

        document.getElementById("reports-empty").classList.add("hidden");
        document.getElementById("reports-thread").classList.remove("hidden");
        document.getElementById("reports-title").textContent = "#" + report.Id + "  " + (report.Title || "Репорт");
        document.getElementById("reports-meta").textContent = report.AdminName ? "Адміністратор: " + report.AdminName : "Очікує адміністратора";

        var closed = String(report.Status).toLowerCase() === "closed";
        var status = document.getElementById("reports-status");

        status.textContent = this.StatusText(report.Status);
        status.className = "reports-status" + (closed ? " closed" : "");

        document.getElementById("reports-reply").classList.toggle("hidden", closed);
        document.getElementById("reports-finish").classList.toggle("hidden", closed);

        this.messages.innerHTML = "";
        (report.Messages || []).forEach(this.AddMessage.bind(this));
        this.messages.scrollTop = this.messages.scrollHeight;

        this.RenderListSelection();
    },

    RenderListSelection: function() {
        var self = this;

        this.list.querySelectorAll(".report-row").forEach(function(button) {
            var id = Number(button.querySelector(".report-row-top span").textContent.replace("#", ""));
            button.classList.toggle("active", id === Number(self.selectedId));
        });
    },

    ShowEmpty: function() {
        this.selectedId = null;
        document.getElementById("reports-empty").classList.remove("hidden");
        document.getElementById("reports-thread").classList.add("hidden");
    },

    AddMessage: function(message) {
        var element = document.createElement("div");
        element.className = "report-message" + (message.IsAdmin ? " admin" : "");
        element.innerHTML =
            "<b>" + this.Escape(message.Author || "Гравець") + "</b>" +
            "<time>" + this.Escape(message.Time || "") + "</time>" +
            "<p>" + this.Escape(message.Text || "") + "</p>";
        this.messages.appendChild(element);
    },

    Update: function(data) {
        var report = this.Parse(data);

        if (!report || report.Id == null)
            return;

        var index = this.data.Reports.findIndex(function(item) {
            return Number(item.Id) === Number(report.Id);
        });

        if (index >= 0)
            this.data.Reports[index] = report;
        else
            this.data.Reports.unshift(report);

        this.selectedId = Number(report.Id);
        this.Render();
    },

    StatusText: function(status) {
        return String(status).toLowerCase() === "closed" ? "Закрито" : "Відкрито";
    },

    Escape: function(value) {
        var element = document.createElement("div");
        element.textContent = String(value == null ? "" : value);
        return element.innerHTML;
    }
};

window.addEventListener("DOMContentLoaded", function() {
    Reports.Init();

    document.getElementById("reports-close").onclick = function() {
        Reports.Hide();
        GameCef.sendJson("report:close-ui", {});
    };

    document.getElementById("reports-create").onclick = function() {
        document.getElementById("reports-new-message").value = "";
        document.getElementById("reports-create-modal").classList.remove("hidden");
    };

    document.getElementById("reports-create-cancel").onclick = function() {
        document.getElementById("reports-create-modal").classList.add("hidden");
    };

    document.getElementById("reports-create-submit").onclick = function() {
        var input = document.getElementById("reports-new-message");
        var message = input.value.trim();

        if (!message)
            return;

        GameCef.sendJson("report:create", {
            Message: encodeURIComponent(message)
        });

        input.value = "";
        document.getElementById("reports-create-modal").classList.add("hidden");
    };

    document.getElementById("reports-send").onclick = function() {
        var input = document.getElementById("reports-message");
        var message = input.value.trim();

        if (!message || Reports.selectedId == null)
            return;

        GameCef.sendJson("report:message", {
            ReportId: Reports.selectedId,
            Message: encodeURIComponent(message)
        });

        input.value = "";
    };

    document.getElementById("reports-finish").onclick = function() {
        if (Reports.selectedId == null)
            return;

        GameCef.sendJson("report:close", {
            ReportId: Reports.selectedId
        });
    };

    document.querySelectorAll(".reports-tabs button").forEach(function(button) {
        button.onclick = function() {
            document.querySelectorAll(".reports-tabs button").forEach(function(item) {
                item.classList.remove("active");
            });

            button.classList.add("active");
            Reports.filter = button.dataset.filter;
            Reports.Render();
        };
    });
});

GameCef.on("report:show", function(data) {
    Reports.Show(data);
});

GameCef.on("report:hide", function() {
    Reports.Hide();
});

GameCef.on("report:update", function(data) {
    Reports.Update(data);
});
