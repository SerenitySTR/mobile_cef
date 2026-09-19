var Tickets = {
    root: null,
    list: null,
    messages: null,
    selectedId: null,
    filter: "all",
    data: {
        Tickets: []
    },

    Init: function() {
        this.root = document.getElementById("tickets");
        this.list = document.getElementById("tickets-list");
        this.messages = document.getElementById("tickets-messages");
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

    NormalizeList: function(payload) {
        if (!payload)
            return [];

        return payload.Tickets || payload.tickets || [];
    },

    Show: function(data) {
        var payload = this.Parse(data);

        if (payload)
            this.data.Tickets = this.NormalizeList(payload);

        this.root.classList.add("active");
        this.root.setAttribute("aria-hidden", "false");
        this.Render();
    },

    Hide: function() {
        this.root.classList.remove("active");
        this.root.setAttribute("aria-hidden", "true");
        document.getElementById("tickets-create-modal").classList.add("hidden");
    },

    GetTicket: function(id) {
        return this.data.Tickets.find(function(ticket) {
            return Number(ticket.Id ?? ticket.id) === Number(id);
        });
    },

    Value: function(object, pascal, camel, fallback) {
        if (!object)
            return fallback;

        if (object[pascal] !== undefined && object[pascal] !== null)
            return object[pascal];

        if (object[camel] !== undefined && object[camel] !== null)
            return object[camel];

        return fallback;
    },

    Render: function() {
        var self = this;
        var tickets = this.data.Tickets.filter(function(ticket) {
            var status = self.Value(ticket, "Status", "status", "");
            var closed = String(status).toLowerCase() === "closed";

            if (self.filter === "open")
                return !closed;

            if (self.filter === "closed")
                return closed;

            return true;
        });

        this.list.innerHTML = "";

        tickets.forEach(function(ticket) {
            var id = self.Value(ticket, "Id", "id", 0);
            var title = self.Value(ticket, "Title", "title", "Звернення");
            var date = self.Value(ticket, "Date", "date", "");
            var status = self.Value(ticket, "Status", "status", "");
            var button = document.createElement("button");
            button.type = "button";
            button.className = "ticket-row";

            if (Number(id) === Number(self.selectedId))
                button.classList.add("active");

            button.innerHTML =
                '<span class="ticket-row-top">' +
                    '<span>#' + Number(id) + '</span>' +
                    '<span>' + self.Escape(date) + '</span>' +
                '</span>' +
                '<strong>' + self.Escape(title) + '</strong>' +
                '<small>' + self.StatusText(status) + '</small>';

            button.onclick = function() {
                self.Select(id);
            };

            self.list.appendChild(button);
        });

        if (this.selectedId != null && this.GetTicket(this.selectedId))
            this.Select(this.selectedId);
        else if (tickets.length > 0)
            this.Select(this.Value(tickets[0], "Id", "id", 0));
        else
            this.ShowEmpty();
    },

    Select: function(id) {
        var ticket = this.GetTicket(id);

        if (!ticket)
            return;

        var ticketId = this.Value(ticket, "Id", "id", 0);
        var title = this.Value(ticket, "Title", "title", "Звернення");
        var adminName = this.Value(ticket, "AdminName", "adminName", "");
        var statusValue = this.Value(ticket, "Status", "status", "");
        var messages = this.Value(ticket, "Messages", "messages", []);

        this.selectedId = Number(ticketId);

        document.getElementById("tickets-empty").classList.add("hidden");
        document.getElementById("tickets-thread").classList.remove("hidden");
        document.getElementById("tickets-title").textContent = "#" + ticketId + "  " + title;
        document.getElementById("tickets-meta").textContent = adminName ? "Адміністратор: " + adminName : "Очікує адміністратора";

        var closed = String(statusValue).toLowerCase() === "closed";
        var status = document.getElementById("tickets-status");

        status.textContent = this.StatusText(statusValue);
        status.className = "tickets-status" + (closed ? " closed" : "");

        document.getElementById("tickets-reply").classList.toggle("hidden", closed);
        document.getElementById("tickets-finish").classList.toggle("hidden", closed);

        this.messages.innerHTML = "";
        messages.forEach(this.AddMessage.bind(this));
        this.messages.scrollTop = this.messages.scrollHeight;

        this.RenderListSelection();
    },

    RenderListSelection: function() {
        var self = this;

        this.list.querySelectorAll(".ticket-row").forEach(function(button) {
            var id = Number(button.querySelector(".ticket-row-top span").textContent.replace("#", ""));
            button.classList.toggle("active", id === Number(self.selectedId));
        });
    },

    ShowEmpty: function() {
        this.selectedId = null;
        document.getElementById("tickets-empty").classList.remove("hidden");
        document.getElementById("tickets-thread").classList.add("hidden");
    },

    AddMessage: function(message) {
        var isAdmin = this.Value(message, "IsAdmin", "isAdmin", false);
        var senderName = this.Value(message, "SenderName", "senderName", this.Value(message, "Author", "author", "Гравець"));
        var date = this.Value(message, "Date", "date", this.Value(message, "Time", "time", ""));
        var text = this.Value(message, "Message", "message", this.Value(message, "Text", "text", ""));
        var element = document.createElement("div");

        element.className = "ticket-message" + (isAdmin ? " admin" : "");
        element.innerHTML =
            "<b>" + this.Escape(senderName) + "</b>" +
            "<time>" + this.Escape(date) + "</time>" +
            "<p>" + this.Escape(text) + "</p>";

        this.messages.appendChild(element);
    },

    Update: function(data) {
        var ticket = this.Parse(data);

        if (!ticket)
            return;

        if (ticket.Ticket || ticket.ticket)
            ticket = ticket.Ticket || ticket.ticket;

        var ticketId = this.Value(ticket, "Id", "id", null);

        if (ticketId == null)
            return;

        var index = this.data.Tickets.findIndex(function(item) {
            return Number(item.Id ?? item.id) === Number(ticketId);
        });

        if (index >= 0)
            this.data.Tickets[index] = ticket;
        else
            this.data.Tickets.unshift(ticket);

        this.selectedId = Number(ticketId);
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
    Tickets.Init();

    document.getElementById("tickets-close").onclick = function() {
        Tickets.Hide();
        GameCef.send("ticket:hide");
    };

    document.getElementById("tickets-create").onclick = function() {
        document.getElementById("tickets-new-message").value = "";
        document.getElementById("tickets-create-modal").classList.remove("hidden");
    };

    document.getElementById("tickets-create-cancel").onclick = function() {
        document.getElementById("tickets-create-modal").classList.add("hidden");
    };

    document.getElementById("tickets-create-submit").onclick = function() {
        var input = document.getElementById("tickets-new-message");
        var message = input.value.trim();

        if (!message)
            return;

        GameCef.sendJson("ticket:create", {
            Title: "Звернення",
            Message: encodeURIComponent(message)
        });

        input.value = "";
        document.getElementById("tickets-create-modal").classList.add("hidden");
    };

    document.getElementById("tickets-send").onclick = function() {
        var input = document.getElementById("tickets-message");
        var message = input.value.trim();

        if (!message || Tickets.selectedId == null)
            return;

        GameCef.sendJson("ticket:message", {
            TicketId: Tickets.selectedId,
            Message: encodeURIComponent(message)
        });

        input.value = "";
    };

    document.getElementById("tickets-finish").onclick = function() {
        if (Tickets.selectedId == null)
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

if (window.GameCef) {
    GameCef.on("ticket:show", function(data) {
        Tickets.Show(data);
    });

    GameCef.on("ticket:update", function(data) {
        Tickets.Update(data);
    });

    GameCef.on("ticket:hide", function() {
        Tickets.Hide();
    });
}
