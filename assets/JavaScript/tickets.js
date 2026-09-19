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
        document.getElementById("tickets-create")?.addEventListener("click", () => this.OpenCreateModal());
        document.getElementById("tickets-create-cancel")?.addEventListener("click", () => this.CloseCreateModal());
        document.getElementById("tickets-create-submit")?.addEventListener("click", () => this.Create());
        document.getElementById("tickets-send")?.addEventListener("click", () => this.SendMessage());
        document.getElementById("tickets-finish")?.addEventListener("click", () => this.CloseTicket());

        document.getElementById("tickets-message")?.addEventListener("keydown", event => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            this.SendMessage();
        });

        document.getElementById("tickets-new-message")?.addEventListener("keydown", event => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            this.Create();
        });

        this.root.querySelectorAll("[data-filter]").forEach(button => {
            button.addEventListener("click", () => {
                this.filter = button.dataset.filter || "all";

                this.root.querySelectorAll("[data-filter]").forEach(item => {
                    item.classList.toggle("active", item === button);
                });

                this.RenderList();
            });
        });
    },

    Show(data) {
        this.Init();
        if (!this.root) return;

        this.SetTickets(data);
        this.root.classList.add("active");
        this.root.setAttribute("aria-hidden", "false");
        this.Render();
    },

    Hide() {
        this.Init();
        if (!this.root) return;

        this.root.classList.remove("active");
        this.root.setAttribute("aria-hidden", "true");
        this.CloseCreateModal();
    },

    Update(data) {
        const ticket = this.NormalizeTicket(data);
        if (!ticket) return;

        const index = this.tickets.findIndex(item => String(item.id) === String(ticket.id));

        if (index === -1) {
            this.tickets.unshift(ticket);
        } else {
            this.tickets[index] = ticket;
        }

        if (this.selectedId == null) {
            this.selectedId = ticket.id;
        }

        this.Render();
    },

    SetTickets(data) {
        const payload = this.Parse(data);
        let list = [];

        if (Array.isArray(payload)) {
            list = payload;
        } else if (payload && Array.isArray(payload.Tickets)) {
            list = payload.Tickets;
        } else if (payload && Array.isArray(payload.tickets)) {
            list = payload.tickets;
        } else {
            const ticket = this.NormalizeTicket(payload);
            if (ticket) list = [ticket];
        }

        this.tickets = list
            .map(ticket => this.NormalizeTicket(ticket))
            .filter(Boolean);

        if (this.selectedId != null && !this.tickets.some(ticket => String(ticket.id) === String(this.selectedId))) {
            this.selectedId = null;
        }

        if (this.selectedId == null && this.tickets.length > 0) {
            this.selectedId = this.tickets[0].id;
        }
    },

    NormalizeTicket(data) {
        const ticket = this.Parse(data);
        if (!ticket || Array.isArray(ticket)) return null;

        const id = ticket.Id ?? ticket.id;
        if (id == null) return null;

        return {
            id,
            title: ticket.Title ?? ticket.title ?? ticket.Subject ?? ticket.subject ?? "Звернення",
            author: ticket.Author ?? ticket.author ?? ticket.PlayerName ?? ticket.playerName ?? "",
            date: ticket.Date ?? ticket.date ?? ticket.CreatedAt ?? ticket.createdAt ?? "",
            status: ticket.Status ?? ticket.status ?? "Open",
            adminName: ticket.AdminName ?? ticket.adminName ?? "",
            messages: (ticket.Messages ?? ticket.messages ?? []).map(message => ({
                author: message.Author ?? message.author ?? message.SenderName ?? message.senderName ?? "",
                text: message.Text ?? message.text ?? message.Message ?? message.message ?? "",
                time: message.Time ?? message.time ?? message.Date ?? message.date ?? "",
                isAdmin: Boolean(message.IsAdmin ?? message.isAdmin)
            }))
        };
    },

    Parse(data) {
        if (data == null || data === "") return null;
        if (typeof data === "object") return data;

        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    },

    Render() {
        this.RenderList();
        this.RenderThread();
    },

    RenderList() {
        const list = document.getElementById("tickets-list");
        if (!list) return;

        const tickets = this.tickets.filter(ticket => {
            if (this.filter === "open") return !this.IsClosed(ticket);
            if (this.filter === "closed") return this.IsClosed(ticket);
            return true;
        });

        list.innerHTML = "";

        tickets.forEach(ticket => {
            const button = document.createElement("button");
            const top = document.createElement("span");
            const id = document.createElement("span");
            const date = document.createElement("span");
            const title = document.createElement("strong");
            const status = document.createElement("small");

            button.type = "button";
            button.className = "ticket-row";
            button.classList.toggle("active", String(ticket.id) === String(this.selectedId));

            top.className = "ticket-row-top";
            id.textContent = `#${ticket.id}`;
            date.textContent = this.FormatTime(ticket.date);
            title.textContent = ticket.title || "Звернення";
            status.textContent = this.StatusText(ticket);

            top.append(id, date);
            button.append(top, title, status);

            button.addEventListener("click", () => {
                this.selectedId = ticket.id;
                this.Render();
            });

            list.appendChild(button);
        });
    },

    RenderThread() {
        const empty = document.getElementById("tickets-empty");
        const thread = document.getElementById("tickets-thread");
        const ticket = this.GetSelected();

        if (!empty || !thread) return;

        empty.classList.toggle("hidden", Boolean(ticket));
        thread.classList.toggle("hidden", !ticket);

        if (!ticket) return;

        const title = document.getElementById("tickets-title");
        const meta = document.getElementById("tickets-meta");
        const status = document.getElementById("tickets-status");
        const messages = document.getElementById("tickets-messages");
        const reply = document.getElementById("tickets-reply");
        const input = document.getElementById("tickets-message");
        const finish = document.getElementById("tickets-finish");
        const closed = this.IsClosed(ticket);

        if (title) title.textContent = `${ticket.title || "Звернення"} #${ticket.id}`;

        if (meta) {
            const parts = [];
            if (ticket.author) parts.push(ticket.author);
            if (ticket.adminName) parts.push(`Адміністратор: ${ticket.adminName}`);
            meta.textContent = parts.join(" · ");
        }

        if (status) {
            status.textContent = this.StatusText(ticket);
            status.classList.toggle("closed", closed);
        }

        if (messages) {
            messages.innerHTML = "";

            ticket.messages.forEach(message => {
                const item = document.createElement("div");
                const head = document.createElement("div");
                const author = document.createElement("b");
                const time = document.createElement("time");
                const text = document.createElement("p");

                item.className = `ticket-message${message.isAdmin ? " admin" : ""}`;
                author.textContent = message.author || (message.isAdmin ? "Адміністратор" : ticket.author || "Гравець");
                time.textContent = this.FormatTime(message.time);
                text.textContent = message.text;

                head.append(author, time);
                item.append(head, text);
                messages.appendChild(item);
            });

            messages.scrollTop = messages.scrollHeight;
        }

        if (reply) reply.classList.toggle("hidden", closed);
        if (finish) finish.classList.toggle("hidden", closed);
        if (input) input.disabled = closed;
    },

    GetSelected() {
        return this.tickets.find(ticket => String(ticket.id) === String(this.selectedId)) || null;
    },

    Create() {
        const input = document.getElementById("tickets-new-message");
        if (!input) return;

        const message = input.value.trim();
        if (!message) return;

        GameCef.sendJson(TicketEvents.Create, {
            Message: encodeURIComponent(message)
        });

        input.value = "";
        this.CloseCreateModal();
    },

    SendMessage() {
        const ticket = this.GetSelected();
        const input = document.getElementById("tickets-message");

        if (!ticket || !input || this.IsClosed(ticket)) return;

        const message = input.value.trim();
        if (!message) return;

        GameCef.sendJson(TicketEvents.Message, {
            TicketId: Number(ticket.id),
            Message: encodeURIComponent(message)
        });

        input.value = "";
        input.focus();
    },

    CloseTicket() {
        const ticket = this.GetSelected();
        if (!ticket || this.IsClosed(ticket)) return;

        GameCef.sendJson(TicketEvents.Close, {
            TicketId: Number(ticket.id)
        });
    },

    CloseUi() {
        GameCef.send(TicketEvents.CloseUi);
        this.Hide();
    },

    OpenCreateModal() {
        const modal = document.getElementById("tickets-create-modal");
        const input = document.getElementById("tickets-new-message");

        modal?.classList.remove("hidden");

        if (input) {
            input.value = "";
            setTimeout(() => input.focus(), 0);
        }
    },

    CloseCreateModal() {
        document.getElementById("tickets-create-modal")?.classList.add("hidden");
    },

    IsClosed(ticket) {
        const status = String(ticket?.status ?? "").toLowerCase();
        return status === "closed" || status === "1";
    },

    StatusText(ticket) {
        if (this.IsClosed(ticket)) return "Закрито";
        if (ticket.adminName) return "В роботі";
        return "Очікує відповіді";
    },

    FormatTime(value) {
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
