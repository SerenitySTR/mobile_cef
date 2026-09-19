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
    ticket: null,
    initialized: false,

    Init: function() {
        if (this.initialized) {
            return;
        }

        this.root = document.getElementById("tickets");

        if (!this.root) {
            console.error("[Tickets] #tickets not found");
            return;
        }

        this.initialized = true;

        const self = this;

        const closeButton = document.getElementById("tickets-close");
        const createButton = document.getElementById("tickets-create-submit");
        const createCancelButton = document.getElementById("tickets-create-cancel");
        const sendButton = document.getElementById("tickets-send");
        const finishButton = document.getElementById("tickets-finish");
        const newButton = document.getElementById("tickets-new");
        const messageInput = document.getElementById("tickets-message");
        const newMessageInput = document.getElementById("tickets-new-message");

        if (closeButton) {
            closeButton.addEventListener("click", function() {
                self.CloseUi();
            });
        }

        if (newButton) {
            newButton.addEventListener("click", function() {
                self.OpenCreateModal();
            });
        }

        if (createCancelButton) {
            createCancelButton.addEventListener("click", function() {
                self.CloseCreateModal();
            });
        }

        if (createButton) {
            createButton.addEventListener("click", function() {
                self.Create();
            });
        }

        if (sendButton) {
            sendButton.addEventListener("click", function() {
                self.SendMessage();
            });
        }

        if (finishButton) {
            finishButton.addEventListener("click", function() {
                self.CloseTicket();
            });
        }

        if (messageInput) {
            messageInput.addEventListener("keydown", function(event) {
                if (event.key !== "Enter" || event.shiftKey) {
                    return;
                }

                event.preventDefault();

                self.SendMessage();
            });
        }

        if (newMessageInput) {
            newMessageInput.addEventListener("keydown", function(event) {
                if (event.key !== "Enter" || event.shiftKey) {
                    return;
                }

                event.preventDefault();

                self.Create();
            });
        }

        this.root.addEventListener("click", function(event) {
            const quickReply = event.target.closest("[data-reply]");

            if (!quickReply) {
                return;
            }

            const input = document.getElementById("tickets-message");

            if (!input) {
                return;
            }

            input.value = quickReply.dataset.reply || "";
            input.focus();
        });
    },

    Show: function(data) {
        this.Init();

        if (!this.root) {
            return;
        }

        this.root.classList.add("active");
        this.root.classList.remove("hidden");
        this.root.setAttribute("aria-hidden", "false");

        if (data) {
            this.SetData(data);
        } else {
            this.Render();
        }
    },

    Hide: function() {
        this.Init();

        if (!this.root) {
            return;
        }

        this.root.classList.remove("active");
        this.root.classList.add("hidden");
        this.root.setAttribute("aria-hidden", "true");

        this.CloseCreateModal();
    },

    Update: function(data) {
        this.Init();

        if (!data) {
            return;
        }

        this.SetData(data);
    },

    SetData: function(data) {
        if (!data || typeof data !== "object") {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(data, "ticket")) {
            this.ticket = data.ticket;
        } else if (Object.prototype.hasOwnProperty.call(data, "Ticket")) {
            this.ticket = data.Ticket;
        } else if (
            Object.prototype.hasOwnProperty.call(data, "id") ||
            Object.prototype.hasOwnProperty.call(data, "Id")
        ) {
            this.ticket = data;
        }

        this.Render();
    },

    Render: function() {
        this.Init();

        if (!this.root) {
            return;
        }

        const empty = document.getElementById("tickets-empty");
        const chat = document.getElementById("tickets-chat");
        const newButton = document.getElementById("tickets-new");

        if (!this.ticket) {
            if (empty) {
                empty.classList.remove("hidden");
            }

            if (chat) {
                chat.classList.add("hidden");
            }

            if (newButton) {
                newButton.classList.remove("hidden");
            }

            return;
        }

        if (empty) {
            empty.classList.add("hidden");
        }

        if (chat) {
            chat.classList.remove("hidden");
        }

        if (newButton) {
            newButton.classList.add("hidden");
        }

        const ticketId = this.GetValue(this.ticket, "id", "Id");
        const status = this.GetValue(this.ticket, "status", "Status");
        const adminName = this.GetValue(
            this.ticket,
            "adminName",
            "AdminName"
        );

        const messages = this.GetValue(
            this.ticket,
            "messages",
            "Messages"
        ) || [];

        const title = document.getElementById("tickets-chat-title");
        const statusElement = document.getElementById("tickets-status");
        const adminElement = document.getElementById("tickets-admin");
        const messagesElement = document.getElementById("tickets-messages");
        const messageInput = document.getElementById("tickets-message");
        const sendButton = document.getElementById("tickets-send");
        const finishButton = document.getElementById("tickets-finish");

        if (title) {
            title.textContent = ticketId != null
                ? "Звернення #" + ticketId
                : "Звернення";
        }

        const closed = this.IsClosed(status);

        if (statusElement) {
            if (closed) {
                statusElement.textContent = "Закрито";
            } else if (adminName) {
                statusElement.textContent = "В роботі";
            } else {
                statusElement.textContent = "Очікує адміністратора";
            }
        }

        if (adminElement) {
            adminElement.textContent = adminName
                ? "Адміністратор: " + adminName
                : "Адміністратор ще не призначений";
        }

        if (messagesElement) {
            messagesElement.innerHTML = "";

            for (let i = 0; i < messages.length; i++) {
                messagesElement.appendChild(
                    this.CreateMessageElement(messages[i])
                );
            }

            messagesElement.scrollTop = messagesElement.scrollHeight;
        }

        if (messageInput) {
            messageInput.disabled = closed;

            if (closed) {
                messageInput.value = "";
                messageInput.placeholder = "Звернення закрито";
            } else {
                messageInput.placeholder = "Написати повідомлення...";
            }
        }

        if (sendButton) {
            sendButton.disabled = closed;
        }

        if (finishButton) {
            finishButton.disabled = closed;
            finishButton.classList.toggle("hidden", closed);
        }
    },

    CreateMessageElement: function(message) {
        const isAdmin = Boolean(
            this.GetValue(message, "isAdmin", "IsAdmin")
        );

        const senderName =
            this.GetValue(message, "senderName", "SenderName") ||
            this.GetValue(message, "name", "Name") ||
            (isAdmin ? "Адміністратор" : "Ви");

        const text =
            this.GetValue(message, "message", "Message") ||
            this.GetValue(message, "text", "Text") ||
            "";

        const date =
            this.GetValue(message, "date", "Date") ||
            this.GetValue(message, "time", "Time") ||
            "";

        const wrapper = document.createElement("div");

        wrapper.className = isAdmin
            ? "tickets-message tickets-message-admin"
            : "tickets-message tickets-message-player";

        const info = document.createElement("small");
        const bubble = document.createElement("div");

        info.className = "tickets-message-info";
        bubble.className = "tickets-message-bubble";

        info.textContent = date
            ? senderName + " · " + this.FormatDate(date)
            : senderName;

        bubble.textContent = text;

        wrapper.appendChild(info);
        wrapper.appendChild(bubble);

        return wrapper;
    },

    Create: function() {
        const input = document.getElementById("tickets-new-message");

        if (!input) {
            return;
        }

        const message = input.value.trim();

        if (!message) {
            return;
        }

        if (!window.GameCef) {
            return;
        }

        GameCef.sendJson(TicketEvents.Create, {
            Message: message
        });

        input.value = "";

        this.CloseCreateModal();
    },

    SendMessage: function() {
        if (!this.ticket) {
            return;
        }

        const input = document.getElementById("tickets-message");

        if (!input) {
            return;
        }

        const message = input.value.trim();

        if (!message) {
            return;
        }

        const ticketId = this.GetValue(
            this.ticket,
            "id",
            "Id"
        );

        if (ticketId == null) {
            return;
        }

        if (!window.GameCef) {
            return;
        }

        GameCef.sendJson(TicketEvents.Message, {
            TicketId: Number(ticketId),
            Message: message
        });

        input.value = "";
        input.focus();
    },

    CloseTicket: function() {
        if (!this.ticket) {
            return;
        }

        const ticketId = this.GetValue(
            this.ticket,
            "id",
            "Id"
        );

        if (ticketId == null) {
            return;
        }

        if (!window.GameCef) {
            return;
        }

        GameCef.sendJson(TicketEvents.Close, {
            TicketId: Number(ticketId)
        });
    },

    CloseUi: function() {
        this.Hide();

        if (!window.GameCef) {
            return;
        }

        GameCef.send(TicketEvents.CloseUi);
    },

    OpenCreateModal: function() {
        const modal = document.getElementById("tickets-create-modal");

        if (!modal) {
            return;
        }

        modal.classList.remove("hidden");

        const input = document.getElementById("tickets-new-message");

        if (input) {
            input.value = "";

            setTimeout(function() {
                input.focus();
            }, 0);
        }
    },

    CloseCreateModal: function() {
        const modal = document.getElementById("tickets-create-modal");

        if (!modal) {
            return;
        }

        modal.classList.add("hidden");
    },

    IsClosed: function(status) {
        if (status == null) {
            return false;
        }

        if (typeof status === "number") {
            return status === 1;
        }

        return String(status).toLowerCase() === "closed";
    },

    GetValue: function(object, camelCase, pascalCase) {
        if (!object) {
            return null;
        }

        if (Object.prototype.hasOwnProperty.call(object, camelCase)) {
            return object[camelCase];
        }

        if (Object.prototype.hasOwnProperty.call(object, pascalCase)) {
            return object[pascalCase];
        }

        return null;
    },

    FormatDate: function(value) {
        if (!value) {
            return "";
        }

        const text = String(value);

        if (/^\d{1,2}:\d{2}$/.test(text)) {
            return text;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return text;
        }

        return date.toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }
};

function parseTicketPayload(data) {
    if (data && typeof data === "object") {
        return data;
    }

    if (typeof data !== "string" || !data.trim()) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

window.addEventListener("DOMContentLoaded", function() {
    Tickets.Init();
});

if (window.GameCef) {
    GameCef.on(TicketEvents.Show, function(data) {
        const payload = parseTicketPayload(data);

        Tickets.Show(payload);
    });

    GameCef.on(TicketEvents.Hide, function() {
        Tickets.Hide();
    });

    GameCef.on(TicketEvents.Update, function(data) {
        const payload = parseTicketPayload(data);

        if (!payload) {
            return;
        }

        Tickets.Update(payload);
    });
}