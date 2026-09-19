var TicketEvents = {
    Show: "ticket:show",
    Hide: "ticket:hide",
    Update: "ticket:update",
    Create: "ticket:create",
    Message: "ticket:message",
    Close: "ticket:close",
    CloseUi: "ticket:close-ui"
};

var Tickets = {
    root: null,
    tickets: [],
    selectedId: null,
    filter: "all",
    initialized: false,

    Init: function() {
        if (this.initialized)
            return true;

        this.root = document.getElementById("tickets");

        if (!this.root)
            return false;

        this.initialized = true;
        var self = this;

        var closeButton = document.getElementById("tickets-close");
        var createButton = document.getElementById("tickets-create");
        var createCancelButton = document.getElementById("tickets-create-cancel");
        var createSubmitButton = document.getElementById("tickets-create-submit");
        var sendButton = document.getElementById("tickets-send");
        var finishButton = document.getElementById("tickets-finish");
        var messageInput = document.getElementById("tickets-message");
        var newMessageInput = document.getElementById("tickets-new-message");

        if (closeButton)
            closeButton.onclick = function() { self.CloseUi(); };

        if (createButton)
            createButton.onclick = function() { self.OpenCreate(); };

        if (createCancelButton)
            createCancelButton.onclick = function() { self.CloseCreate(); };

        if (createSubmitButton)
            createSubmitButton.onclick = function() { self.Create(); };

        if (sendButton)
            sendButton.onclick = function() { self.SendMessage(); };

        if (finishButton)
            finishButton.onclick = function() { self.CloseTicket(); };

        if (messageInput) {
            messageInput.onkeydown = function(event) {
                event = event || window.event;

                if (event.keyCode !== 13 || event.shiftKey)
                    return;

                if (event.preventDefault)
                    event.preventDefault();

                self.SendMessage();
            };
        }

        if (newMessageInput) {
            newMessageInput.onkeydown = function(event) {
                event = event || window.event;

                if (event.keyCode !== 13 || event.shiftKey)
                    return;

                if (event.preventDefault)
                    event.preventDefault();

                self.Create();
            };
        }

        var tabs = this.root.querySelectorAll(".tickets-tabs button");

        for (var i = 0; i < tabs.length; i++) {
            tabs[i].onclick = function() {
                self.filter = this.getAttribute("data-filter") || "all";

                for (var j = 0; j < tabs.length; j++)
                    tabs[j].className = tabs[j] === this ? "active" : "";

                self.RenderList();
            };
        }

        return true;
    },

    Show: function(data) {
        if (!this.Init())
            return;

        var payload = this.Parse(data);
        var list = payload ? this.Get(payload, ["Tickets", "tickets"]) : null;

        this.tickets = list instanceof Array ? list : [];

        if (this.selectedId !== null && !this.Find(this.selectedId))
            this.selectedId = null;

        if (this.selectedId === null && this.tickets.length > 0)
            this.selectedId = this.Id(this.tickets[0]);

        this.root.className = this.AddClass(this.root.className, "active");
        this.root.setAttribute("aria-hidden", "false");

        this.Render();
    },

    Hide: function() {
        if (!this.Init())
            return;

        this.root.className = this.RemoveClass(this.root.className, "active");
        this.root.setAttribute("aria-hidden", "true");
        this.CloseCreate();
    },

    Update: function(data) {
        if (!this.Init())
            return;

        var payload = this.Parse(data);

        if (!payload)
            return;

        var list = this.Get(payload, ["Tickets", "tickets"]);

        if (list instanceof Array) {
            this.tickets = list;
            this.Render();
            return;
        }

        var ticket = this.Get(payload, ["Ticket", "ticket"]);

        if (!ticket)
            ticket = payload;

        var id = this.Id(ticket);

        if (id === null)
            return;

        var found = false;

        for (var i = 0; i < this.tickets.length; i++) {
            if (this.Id(this.tickets[i]) === id) {
                this.tickets[i] = ticket;
                found = true;
                break;
            }
        }

        if (!found)
            this.tickets.unshift(ticket);

        if (this.selectedId === null)
            this.selectedId = id;

        this.Render();
    },

    Render: function() {
        this.RenderList();
        this.RenderThread();
    },

    RenderList: function() {
        var list = document.getElementById("tickets-list");

        if (!list)
            return;

        list.innerHTML = "";
        var self = this;

        for (var i = 0; i < this.tickets.length; i++) {
            var ticket = this.tickets[i];
            var closed = this.IsClosed(ticket);

            if (this.filter === "open" && closed)
                continue;

            if (this.filter === "closed" && !closed)
                continue;

            var id = this.Id(ticket);
            var title = this.Get(ticket, ["Title", "title"]) || "Звернення";
            var author = this.Get(ticket, ["Author", "author"]) || "";
            var date = this.Get(ticket, ["Date", "date"]) || "";

            var row = document.createElement("button");
            row.type = "button";
            row.className = "ticket-row" + (id === this.selectedId ? " active" : "");
            row.setAttribute("data-ticket-id", id === null ? "" : String(id));

            var top = document.createElement("div");
            top.className = "ticket-row-top";

            var number = document.createElement("span");
            number.appendChild(document.createTextNode(id === null ? "" : "#" + id));

            var status = document.createElement("span");
            status.className = "tickets-status" + (closed ? " closed" : "");
            status.appendChild(document.createTextNode(closed ? "Закрито" : "Відкрито"));

            var strong = document.createElement("strong");
            strong.appendChild(document.createTextNode(title));

            var small = document.createElement("small");
            var info = author;

            if (date)
                info += (info ? " · " : "") + date;

            small.appendChild(document.createTextNode(info));
            top.appendChild(number);
            top.appendChild(status);
            row.appendChild(top);
            row.appendChild(strong);
            row.appendChild(small);

            row.onclick = function() {
                var value = Number(this.getAttribute("data-ticket-id"));

                if (isNaN(value))
                    return;

                self.selectedId = value;
                self.Render();
            };

            list.appendChild(row);
        }
    },

    RenderThread: function() {
        var empty = document.getElementById("tickets-empty");
        var thread = document.getElementById("tickets-thread");
        var ticket = this.Find(this.selectedId);

        if (!ticket) {
            if (empty)
                empty.className = this.RemoveClass(empty.className, "hidden");

            if (thread)
                thread.className = this.AddClass(thread.className, "hidden");

            return;
        }

        if (empty)
            empty.className = this.AddClass(empty.className, "hidden");

        if (thread)
            thread.className = this.RemoveClass(thread.className, "hidden");

        var id = this.Id(ticket);
        var title = this.Get(ticket, ["Title", "title"]) || "Звернення";
        var author = this.Get(ticket, ["Author", "author"]) || "";
        var date = this.Get(ticket, ["Date", "date"]) || "";
        var adminName = this.Get(ticket, ["AdminName", "adminName"]) || "";
        var messages = this.Get(ticket, ["Messages", "messages"]);
        var closed = this.IsClosed(ticket);

        if (!(messages instanceof Array))
            messages = [];

        var titleElement = document.getElementById("tickets-title");
        var metaElement = document.getElementById("tickets-meta");
        var statusElement = document.getElementById("tickets-status");
        var messagesElement = document.getElementById("tickets-messages");
        var replyElement = document.getElementById("tickets-reply");
        var finishButton = document.getElementById("tickets-finish");

        if (titleElement)
            titleElement.textContent = title + (id !== null ? " #" + id : "");

        if (metaElement) {
            var meta = author;

            if (date)
                meta += (meta ? " · " : "") + date;

            if (adminName)
                meta += (meta ? " · " : "") + "Адміністратор: " + adminName;

            metaElement.textContent = meta;
        }

        if (statusElement) {
            statusElement.textContent = closed ? "Закрито" : (adminName ? "В роботі" : "Очікує відповіді");
            statusElement.className = "tickets-status" + (closed ? " closed" : "");
        }

        if (messagesElement) {
            messagesElement.innerHTML = "";

            for (var i = 0; i < messages.length; i++)
                messagesElement.appendChild(this.MessageElement(messages[i]));

            messagesElement.scrollTop = messagesElement.scrollHeight;
        }

        if (replyElement)
            replyElement.className = closed ? this.AddClass(replyElement.className, "hidden") : this.RemoveClass(replyElement.className, "hidden");

        if (finishButton)
            finishButton.className = closed ? this.AddClass(finishButton.className, "hidden") : this.RemoveClass(finishButton.className, "hidden");
    },

    MessageElement: function(message) {
        var isAdmin = this.Get(message, ["IsAdmin", "isAdmin"]) === true;
        var author = this.Get(message, ["Author", "author"]) || (isAdmin ? "Адміністратор" : "Ви");
        var text = this.Get(message, ["Text", "text"]) || "";
        var time = this.Get(message, ["Time", "time"]) || "";

        var item = document.createElement("div");
        item.className = "ticket-message" + (isAdmin ? " admin" : "");

        var header = document.createElement("div");
        var name = document.createElement("b");
        var date = document.createElement("time");
        var body = document.createElement("p");

        name.appendChild(document.createTextNode(author));
        date.appendChild(document.createTextNode(time));
        body.appendChild(document.createTextNode(text));

        header.appendChild(name);
        header.appendChild(date);
        item.appendChild(header);
        item.appendChild(body);

        return item;
    },

    OpenCreate: function() {
        var modal = document.getElementById("tickets-create-modal");
        var input = document.getElementById("tickets-new-message");

        if (modal)
            modal.className = this.RemoveClass(modal.className, "hidden");

        if (input) {
            input.value = "";
            input.focus();
        }
    },

    CloseCreate: function() {
        var modal = document.getElementById("tickets-create-modal");

        if (modal)
            modal.className = this.AddClass(modal.className, "hidden");
    },

    Create: function() {
        var input = document.getElementById("tickets-new-message");

        if (!input)
            return;

        var message = input.value.replace(/^\s+|\s+$/g, "");

        if (!message)
            return;

        GameCef.sendJson(TicketEvents.Create, {
            Message: encodeURIComponent(message)
        });

        input.value = "";
        this.CloseCreate();
    },

    SendMessage: function() {
        var ticket = this.Find(this.selectedId);
        var input = document.getElementById("tickets-message");

        if (!ticket || !input || this.IsClosed(ticket))
            return;

        var id = this.Id(ticket);
        var message = input.value.replace(/^\s+|\s+$/g, "");

        if (id === null || !message)
            return;

        GameCef.sendJson(TicketEvents.Message, {
            TicketId: id,
            Message: encodeURIComponent(message)
        });

        input.value = "";
        input.focus();
    },

    CloseTicket: function() {
        var ticket = this.Find(this.selectedId);

        if (!ticket || this.IsClosed(ticket))
            return;

        var id = this.Id(ticket);

        if (id === null)
            return;

        GameCef.sendJson(TicketEvents.Close, {
            TicketId: id
        });
    },

    CloseUi: function() {
        GameCef.sendJson(TicketEvents.CloseUi, {});
        this.Hide();
    },

    Find: function(id) {
        if (id === null || id === undefined)
            return null;

        id = Number(id);

        for (var i = 0; i < this.tickets.length; i++) {
            if (this.Id(this.tickets[i]) === id)
                return this.tickets[i];
        }

        return null;
    },

    Id: function(ticket) {
        var id = this.Get(ticket, ["Id", "id"]);

        if (id === null || id === undefined || id === "")
            return null;

        id = Number(id);
        return isNaN(id) ? null : id;
    },

    IsClosed: function(ticket) {
        var status = this.Get(ticket, ["Status", "status"]);
        return String(status || "").toLowerCase() === "closed";
    },

    Get: function(object, keys) {
        if (!object || typeof object !== "object")
            return null;

        for (var i = 0; i < keys.length; i++) {
            if (Object.prototype.hasOwnProperty.call(object, keys[i]))
                return object[keys[i]];
        }

        return null;
    },

    Parse: function(data) {
        if (data && typeof data === "object")
            return data;

        if (typeof data !== "string" || !data)
            return {};

        try {
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    },

    AddClass: function(value, className) {
        value = value || "";
        var parts = value.split(/\s+/);

        for (var i = 0; i < parts.length; i++) {
            if (parts[i] === className)
                return value;
        }

        return (value + " " + className).replace(/^\s+|\s+$/g, "");
    },

    RemoveClass: function(value, className) {
        value = value || "";
        var parts = value.split(/\s+/);
        var result = [];

        for (var i = 0; i < parts.length; i++) {
            if (parts[i] && parts[i] !== className)
                result.push(parts[i]);
        }

        return result.join(" ");
    }
};

GameCef.on(TicketEvents.Show, function(data) {
    Tickets.Show(data);
});

GameCef.on(TicketEvents.Hide, function() {
    Tickets.Hide();
});

GameCef.on(TicketEvents.Update, function(data) {
    Tickets.Update(data);
});

window.addEventListener("DOMContentLoaded", function() {
    Tickets.Init();
});
