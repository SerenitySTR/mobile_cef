var Tickets = {
    data: {
        IsAdmin: false,
        Tickets: []
    },

    selectedId: 0,
    filter: "all",

    Init: function() {
        this.screen = document.getElementById("tickets");
        this.list = document.getElementById("tickets-list");
        this.messages = document.getElementById("tickets-messages");
    },

    Parse: function(data) {
        if (data == null)
            return { IsAdmin: false, Tickets: [] };

        if (Array.isArray(data) && data.length === 1)
            data = data[0];

        if (typeof data === "string") {
            try {
                return JSON.parse(data);
            } catch (error) {
                try {
                    return JSON.parse(decodeURIComponent(data));
                } catch (ignored) {
                    return { IsAdmin: false, Tickets: [] };
                }
            }
        }

        return data;
    },

    Show: function(data) {
        this.Init();

        if (!this.screen)
            return;

        this.data = this.Parse(data);

        if (!this.data || !Array.isArray(this.data.Tickets))
            this.data = { IsAdmin: false, Tickets: [] };

        this.selectedId = 0;
        this.screen.classList.add("active");
        this.screen.setAttribute("aria-hidden", "false");
        this.Render();

        if (this.data.Tickets.length > 0)
            this.Select(this.data.Tickets[0].Id, false);
    },

    Hide: function() {
        this.Init();

        if (!this.screen)
            return;

        this.screen.classList.remove("active");
        this.screen.setAttribute("aria-hidden", "true");
    },

    GetTicket: function(id) {
        return this.data.Tickets.find(function(ticket) {
            return Number(ticket.Id) === Number(id);
        });
    },

    Render: function() {
        var self = this;

        if (!this.list)
            return;

        this.list.innerHTML = "";

        this.data.Tickets
            .filter(function(ticket) {
                return self.filter === "all" || String(ticket.Status).toLowerCase() === self.filter;
            })
            .forEach(function(ticket) {
                var button = document.createElement("button");
                button.className = "ticket-row";

                if (Number(ticket.Id) === Number(self.selectedId))
                    button.classList.add("active");

                button.innerHTML =
                    '<span class="ticket-row-top">' +
                        '<span>#' + Number(ticket.Id) + '</span>' +
                        '<span>' + self.Escape(ticket.Date || "") + '</span>' +
                    '</span>' +
                    '<strong>' + self.Escape(ticket.Title || "Без теми") + '</strong>' +
                    '<small>' + self.Escape(ticket.Author || "") + ' · ' + self.StatusText(ticket.Status) + '</small>';

                button.onclick = function() {
                    self.Select(ticket.Id, true);
                };

                self.list.appendChild(button);
            });
    },

    Select: function(id, notifyServer) {
        var ticket = this.GetTicket(id);

        if (!ticket)
            return;

        this.selectedId = Number(id);

        document.getElementById("tickets-empty").classList.add("hidden");
        document.getElementById("tickets-thread").classList.remove("hidden");
        document.getElementById("tickets-title").textContent = "#" + ticket.Id + "  " + ticket.Title;
        document.getElementById("tickets-meta").textContent = (ticket.Author || "") + (ticket.Date ? " · " + ticket.Date : "");

        var status = document.getElementById("tickets-status");
        var closed = String(ticket.Status).toLowerCase() === "closed";

        status.textContent = this.StatusText(ticket.Status);
        status.className = "tickets-status" + (closed ? " closed" : "");

        document.getElementById("tickets-reply").classList.toggle("hidden", closed);
        document.getElementById("tickets-finish").classList.toggle("hidden", closed);

        var quickToggle = document.getElementById("tickets-quick-toggle");
        var quickReplies = document.getElementById("tickets-quick-replies");

        quickToggle.classList.toggle("hidden", !this.data.IsAdmin || closed);

        if (!this.data.IsAdmin || closed)
            quickReplies.classList.add("hidden");

        this.messages.innerHTML = "";

        (ticket.Messages || []).forEach(this.AddMessage.bind(this));
        this.messages.scrollTop = this.messages.scrollHeight;

        this.Render();

        if (notifyServer) {
            GameCef.sendJson("ticket:open", {
                TicketId: Number(id)
            });
        }
    },

    AddMessage: function(message) {
        var element = document.createElement("div");
        element.className = "ticket-message" + (message.IsAdmin ? " admin" : "");

        element.innerHTML =
            "<b>" + this.Escape(message.Author || "Гравець") + "</b>" +
            "<time>" + this.Escape(message.Time || "") + "</time>" +
            "<p>" + this.Escape(message.Text || "") + "</p>";

        this.messages.appendChild(element);
    },

    Update: function(data) {
        var ticket = this.Parse(data);

        if (!ticket || ticket.Id == null)
            return;

        var index = this.data.Tickets.findIndex(function(item) {
            return Number(item.Id) === Number(ticket.Id);
        });

        if (index >= 0)
            this.data.Tickets[index] = ticket;
        else
            this.data.Tickets.unshift(ticket);

        this.Render();

        if (Number(ticket.Id) === Number(this.selectedId))
            this.Select(ticket.Id, false);
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
    Tickets.Init();

    document.getElementById("tickets-close").onclick = function() {
        Tickets.Hide();
        GameCef.sendJson("ticket:close-ui", {});
    };

    document.getElementById("tickets-create").onclick = function() {
        document.getElementById("tickets-create-modal").classList.remove("hidden");
    };

    document.getElementById("tickets-create-cancel").onclick = function() {
        document.getElementById("tickets-create-modal").classList.add("hidden");
    };

    document.getElementById("tickets-create-submit").onclick = function() {
        var title = document.getElementById("tickets-new-title").value.trim();
        var message = document.getElementById("tickets-new-message").value.trim();

        if (!title || !message)
            return;

        GameCef.sendJson("ticket:create", {
            Title: encodeURIComponent(title),
            Message: encodeURIComponent(message)
        });

        document.getElementById("tickets-create-modal").classList.add("hidden");
    };

    document.getElementById("tickets-send").onclick = function() {
        var input = document.getElementById("tickets-message");
        var message = input.value.trim();

        if (!message || !Tickets.selectedId)
            return;

        GameCef.sendJson("ticket:message", {
            TicketId: Tickets.selectedId,
            Message: encodeURIComponent(message)
        });

        input.value = "";
    };

    document.getElementById("tickets-quick-toggle").onclick = function() {
        document.getElementById("tickets-quick-replies").classList.toggle("hidden");
    };

    document.querySelectorAll("#tickets-quick-replies button").forEach(function(button) {
        button.onclick = function() {
            var message = button.dataset.reply;

            if (!message || !Tickets.selectedId)
                return;

            GameCef.sendJson("ticket:message", {
                TicketId: Tickets.selectedId,
                Message: encodeURIComponent(message)
            });

            document.getElementById("tickets-quick-replies").classList.add("hidden");
        };
    });

    document.getElementById("tickets-finish").onclick = function() {
        if (!Tickets.selectedId)
            return;

        GameCef.sendJson("ticket:close", {
            TicketId: Tickets.selectedId
        });
    };

    document.querySelectorAll(".tickets-tabs button").forEach(function(button) {
        button.onclick = function() {
            document.querySelectorAll(".tickets-tabs button").forEach(function(item) {
                item.classList.remove("active");
            });

            button.classList.add("active");
            Tickets.filter = button.dataset.filter;
            Tickets.Render();
        };
    });
});

GameCef.on("ticket:show", function(data) {
    Tickets.Show(data);
});

GameCef.on("ticket:hide", function() {
    Tickets.Hide();
});

GameCef.on("ticket:update", function(data) {
    Tickets.Update(data);
});
