const TicketEvents = {
    Show: "ticket:show",
    Hide: "ticket:hide",
    Update: "ticket:update",
    Create: "ticket:create",
    Message: "ticket:message",
    Close: "ticket:close",
    CloseUi: "ticket:close-ui"
};

const Tickets = {
    root: null,
    tickets: [],
    selectedId: null,
    filter: "all",
    initialized: false,

    Init() {
        if (this.initialized) return;

        this.root = document.getElementById("tickets");
        if (!this.root) return;

        this.initialized = true;

        document.getElementById("tickets-close")?.addEventListener("click", () => this.CloseUi());
        document.getElementById("tickets-create")?.addEventListener("click", () => this.OpenCreate());
        document.getElementById("tickets-create-cancel")?.addEventListener("click", () => this.CloseCreate());
        document.getElementById("tickets-create-submit")?.addEventListener("click", () => this.Create());
        document.getElementById("tickets-send")?.addEventListener("click", () => this.SendMessage());
        document.getElementById("tickets-finish")?.addEventListener("click", () => this.CloseTicket());

        document.getElementById("tickets-message")?.addEventListener("keydown", event => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            event.stopPropagation();
            this.SendMessage();
        });

        document.addEventListener("keydown", event => {
            if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
                return;

            if (!this.root?.classList.contains("active"))
                return;

            if (document.getElementById("error-screen")?.classList.contains("active") ||
                document.getElementById("dialog-screen")?.classList.contains("active"))
                return;

            const modal = document.getElementById("tickets-create-modal");
            const modalOpen = modal && !modal.classList.contains("hidden");

            if (event.key === "Escape") {
                event.preventDefault();
                event.stopImmediatePropagation();

                if (modalOpen)
                    this.CloseCreate();
                else
                    this.CloseUi();

                return;
            }

            if (!modalOpen || event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
                return;

            if (event.target?.tagName === "BUTTON" || event.target?.tagName === "A")
                return;

            event.preventDefault();
            event.stopImmediatePropagation();
            this.Create();
        });

        document.querySelectorAll("#tickets .tickets-tabs button").forEach(button => {
            button.addEventListener("click", () => {
                this.filter = button.dataset.filter || "all";

                document.querySelectorAll("#tickets .tickets-tabs button").forEach(item => {
                    item.classList.toggle("active", item === button);
                });

                this.RenderList();
            });
        });
    },

    Show(data) {
        this.Init();
        if (!this.root) return;

        const payload = this.Parse(data);
        const list = this.Get(payload, "Tickets", "tickets");

        if (Array.isArray(list)) {
            this.tickets = list;
        } else if (Array.isArray(payload)) {
            this.tickets = payload;
        }

        if (this.selectedId !== null && !this.Find(this.selectedId)) {
            this.selectedId = null;
        }

        this.root.classList.add("active");
        this.root.setAttribute("aria-hidden", "false");

        this.Render();
    },

    Hide() {
        this.Init();
        if (!this.root) return;

        this.root.classList.remove("active");
        this.root.setAttribute("aria-hidden", "true");
        this.CloseCreate();
    },

    Update(data) {
        this.Init();

        const payload = this.Parse(data);
        if (!payload) return;

        if (payload.patch === "ticket") {
            const ticket = payload.ticket;
            const id = this.Id(ticket);
            if (id === null) return;

            const index = this.tickets.findIndex(item => this.Id(item) === id);
            if (index === -1) this.tickets.unshift(ticket);
            else this.tickets[index] = ticket;

            if (this.selectedId === null) this.selectedId = id;
            return;
        }

        if (payload.patch === "message") {
            const ticket = this.Find(payload.ticketId);
            if (!ticket) return;

            const messages = this.Get(ticket, "Messages", "messages") || [];
            ticket.Messages = messages;

            const messageIndex = Number(payload.messageIndex);
            const partIndex = Number(payload.partIndex) || 0;
            const part = payload.message || {};

            if (!messages[messageIndex] || partIndex === 0) {
                messages[messageIndex] = {
                    Author: this.Get(part, "Author", "author", "SenderName", "senderName") || "",
                    Text: this.Get(part, "Text", "text", "Message", "message") || "",
                    Time: this.Get(part, "Time", "time", "Date", "date") || "",
                    IsAdmin: Boolean(this.Get(part, "IsAdmin", "isAdmin"))
                };
            } else {
                messages[messageIndex].Text += this.Get(part, "Text", "text", "Message", "message") || "";
            }
            return;
        }

        if (payload.patch === "ready") {
            this.tickets.sort((a, b) => (this.Id(b) || 0) - (this.Id(a) || 0));
            this.Render();
            return;
        }

        const list = this.Get(payload, "Tickets", "tickets");
        if (Array.isArray(list)) {
            this.tickets = list;
            this.Render();
            return;
        }

        const ticket = this.Get(payload, "Ticket", "ticket") || payload;
        const id = this.Id(ticket);
        if (id === null) return;

        const index = this.tickets.findIndex(item => this.Id(item) === id);

        if (index === -1) this.tickets.unshift(ticket);
        else this.tickets[index] = ticket;

        if (this.selectedId === null) this.selectedId = id;
        this.Render();
    },

    Render() {
        this.RenderList();
        this.RenderThread();
    },

    RenderList() {
        const list = document.getElementById("tickets-list");
        if (!list) return;

        list.innerHTML = "";

        const tickets = this.tickets.filter(ticket => {
            if (this.filter === "all") return true;
            return this.IsClosed(ticket) ? this.filter === "closed" : this.filter === "open";
        });

        tickets.forEach(ticket => {
            const id = this.Id(ticket);
            const row = document.createElement("button");
            const title = this.Get(ticket, "Title", "title") || "Звернення";
            const author = this.Get(ticket, "Author", "author", "PlayerName", "playerName") || "";
            const date = this.Get(ticket, "Date", "date", "CreatedAt", "createdAt") || "";
            const closed = this.IsClosed(ticket);

            row.type = "button";
            row.className = "ticket-row" + (id === this.selectedId ? " active" : "");

            const top = document.createElement("div");
            top.className = "ticket-row-top";

            const number = document.createElement("span");
            number.textContent = id !== null ? `#${id}` : "";

            const status = document.createElement("span");
            status.className = `tickets-status${closed ? " closed" : ""}`;
            status.textContent = closed ? "Закрито" : "Відкрито";

            const strong = document.createElement("strong");
            strong.textContent = title;

            const small = document.createElement("small");
            small.textContent = [author, this.FormatDate(date)].filter(Boolean).join(" · ");

            top.append(number, status);
            row.append(top, strong, small);

            row.addEventListener("click", () => {
                this.selectedId = id;
                this.Render();
            });

            list.appendChild(row);
        });
    },

    RenderThread() {
        const empty = document.getElementById("tickets-empty");
        const thread = document.getElementById("tickets-thread");
        const ticket = this.Find(this.selectedId);

        if (!ticket) {
            empty?.classList.remove("hidden");
            thread?.classList.add("hidden");
            return;
        }

        empty?.classList.add("hidden");
        thread?.classList.remove("hidden");

        const id = this.Id(ticket);
        const title = this.Get(ticket, "Title", "title") || "Звернення";
        const author = this.Get(ticket, "Author", "author", "PlayerName", "playerName") || "";
        const adminName = this.Get(ticket, "AdminName", "adminName") || "";
        const date = this.Get(ticket, "Date", "date", "CreatedAt", "createdAt") || "";
        const messages = this.Get(ticket, "Messages", "messages") || [];
        const closed = this.IsClosed(ticket);

        const titleElement = document.getElementById("tickets-title");
        const metaElement = document.getElementById("tickets-meta");
        const statusElement = document.getElementById("tickets-status");
        const messagesElement = document.getElementById("tickets-messages");
        const replyElement = document.getElementById("tickets-reply");
        const finishButton = document.getElementById("tickets-finish");

        if (titleElement) titleElement.textContent = `${title}${id !== null ? ` #${id}` : ""}`;

        if (metaElement) {
            const meta = [author, this.FormatDate(date)];
            if (adminName) meta.push(`Адміністратор: ${adminName}`);
            metaElement.textContent = meta.filter(Boolean).join(" · ");
        }

        if (statusElement) {
            const statusClass = closed ? " closed" : adminName ? " working" : " waiting";
            statusElement.className = `tickets-status${statusClass}`;
            statusElement.textContent = closed ? "Закрито" : adminName ? "В роботі" : "Очікує відповіді";
        }

        if (messagesElement) {
            messagesElement.innerHTML = "";
            messages.forEach(message => messagesElement.appendChild(this.MessageElement(message)));
            messagesElement.scrollTop = messagesElement.scrollHeight;
        }

        replyElement?.classList.toggle("hidden", closed);
        finishButton?.classList.toggle("hidden", closed);
    },

    MessageElement(message) {
        const isAdmin = Boolean(this.Get(message, "IsAdmin", "isAdmin"));
        const author = this.Get(message, "Author", "author", "SenderName", "senderName") || (isAdmin ? "Адміністратор" : "Ви");
        const text = this.Get(message, "Text", "text", "Message", "message") || "";
        const time = this.Get(message, "Time", "time", "Date", "date") || "";

        const item = document.createElement("div");
        item.className = "ticket-message" + (isAdmin ? " admin" : "");

        const header = document.createElement("div");
        const name = document.createElement("b");
        const date = document.createElement("time");
        const body = document.createElement("p");

        name.textContent = author;
        date.textContent = this.FormatDate(time);
        body.textContent = text;

        header.append(name, date);
        item.append(header, body);

        return item;
    },

    OpenCreate() {
        const modal = document.getElementById("tickets-create-modal");
        const input = document.getElementById("tickets-new-message");

        modal?.classList.remove("hidden");

        if (input) {
            input.value = "";
            input.focus();
        }
    },

    CloseCreate() {
        document.getElementById("tickets-create-modal")?.classList.add("hidden");
    },

    Create() {
        const input = document.getElementById("tickets-new-message");
        if (!input) return;

        const message = input.value.trim();
        if (!message || message.length > 240) return;

        GameCef.sendJson(TicketEvents.Create, {
            Message: encodeURIComponent(message)
        });

        input.value = "";
        this.CloseCreate();
    },

    SendMessage() {
        const ticket = this.Find(this.selectedId);
        const input = document.getElementById("tickets-message");

        if (!ticket || !input || this.IsClosed(ticket)) return;

        const message = input.value.trim();
        const id = this.Id(ticket);

        if (!message || id === null || message.length > 240) return;

        GameCef.sendJson(TicketEvents.Message, {
            TicketId: id,
            Message: encodeURIComponent(message)
        });

        input.value = "";
        input.focus();
    },

    CloseTicket() {
        const ticket = this.Find(this.selectedId);
        if (!ticket || this.IsClosed(ticket)) return;

        const id = this.Id(ticket);
        if (id === null) return;

        GameCef.sendJson(TicketEvents.Close, {
            TicketId: id
        });
    },

    CloseUi() {
        GameCef.sendJson(TicketEvents.CloseUi, {});
        this.Hide();
    },

    Find(id) {
        if (id === null || id === undefined) return null;
        return this.tickets.find(ticket => this.Id(ticket) === Number(id)) || null;
    },

    Id(ticket) {
        const id = this.Get(ticket, "Id", "id", "TicketId", "ticketId");
        if (id === null || id === undefined || id === "") return null;

        const value = Number(id);
        return Number.isNaN(value) ? null : value;
    },

    IsClosed(ticket) {
        const status = this.Get(ticket, "Status", "status");
        const isClosed = this.Get(ticket, "IsClosed", "isClosed");

        if (typeof isClosed === "boolean") return isClosed;
        if (typeof status === "number") return status === 1;

        return String(status || "").toLowerCase() === "closed";
    },

    Get(object, ...keys) {
        if (!object || typeof object !== "object") return null;

        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(object, key)) return object[key];
        }

        return null;
    },

    Parse(data) {
        if (data && typeof data === "object") return data;
        if (typeof data !== "string" || !data.trim()) return null;

        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    },

    FormatDate(value) {
        if (!value) return "";

        const text = String(value);
        if (/^\d{1,2}:\d{2}$/.test(text)) return text;

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return text;

        return date.toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }
};

GameCef.on(TicketEvents.Show, data => Tickets.Show(data));
GameCef.on(TicketEvents.Hide, () => Tickets.Hide());
GameCef.on(TicketEvents.Update, data => Tickets.Update(data));

window.addEventListener("DOMContentLoaded", () => Tickets.Init());
