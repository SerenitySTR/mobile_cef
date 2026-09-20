var AdminPanel = {
    root: null,
    tab: "stats",
    filter: "mine",
    selectedTicket: null,
    query: "",
    chatOpen: false,
    ticketFocus: false,
    itemCategory: "weapons",
    quickOpen: false,
    transferOpen: false,
    transferAdminId: null,
    searchTimer: null,
    composingSearch: false,
    ticketLimit: 150,
    messageLimit: 200,

    state: {
        profile: { id: null, name: "", role: "" },
        stats: { days: [], period: "" },
        admins: [],
        tickets: [],
        commands: [],
        punishments: [],
        items: { weapons: [], vehicles: [], skins: [], organizations: [] },
        locations: []
    },

    quickReplies: [
        { label: "Слідкую", text: "Вітаю! Слідкую за ситуацією, будь ласка, очікуйте." },
        { label: "Зараз допоможу", text: "Вітаю! Зараз допоможу Вам, будь ласка, очікуйте." },
        { label: "РП шляхом", text: "Вітаю! Цю ситуацію необхідно вирішити самостійно в межах ігрового процесу, без втручання адміністрації." },
        { label: "Не офтопте", text: "Будь ласка, не використовуйте звернення не за призначенням. Для спілкування використовуйте ігровий чат." },
        { label: "Передано далі", text: "Вітаю! Ваше звернення передано відповідальному адміністратору, будь ласка, очікуйте." },
        { label: "Приємної гри", text: "Дякуємо за звернення! Приємної гри на Antares RP!" }
    ],

    Init: function() {
        this.root = document.getElementById("admin-panel");
        if (!this.root || this.root.dataset.ready) return;

        this.root.dataset.ready = "1";
        var self = this;

        this.Q("#admin-close").onclick = function() { self.Close(); };
        this.Q("#admin-zone").onclick = function() { self.Send("admin:zone"); };
        this.root.addEventListener("click", function(e) { self.Click(e); });
        this.root.addEventListener("input", function(e) { self.Input(e); });
        this.root.addEventListener("compositionstart", function(e) {
            if (e.target.matches && e.target.matches("[data-admin-search]")) self.composingSearch = true;
        });
        this.root.addEventListener("compositionend", function(e) {
            if (!e.target.matches || !e.target.matches("[data-admin-search]")) return;
            self.composingSearch = false;
            self.Input(e);
        });

        document.addEventListener("keydown", function(e) {
            if (e.defaultPrevented || e.isComposing || e.repeat || !self.root.classList.contains("active")) return;
            if (document.getElementById("error-screen")?.classList.contains("active")) return;
            if (document.getElementById("dialog-screen")?.classList.contains("active")) return;

            if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();

                if (self.transferOpen || self.quickOpen) {
                    self.transferOpen = false;
                    self.quickOpen = false;
                    self.Render();
                    return;
                }

                self.Close();
                return;
            }

            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && e.target.matches?.("[data-admin-draft]")) {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.Action("send");
            }
        });

        window.addEventListener("resize", function() { self.Scale(); });
        this.Scale();
    },

    Q: function(selector) {
        return this.root.querySelector(selector);
    },

    Escape: function(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
    },

    Send: function(eventName, data) {
        if (!window.GameCef) return false;
        return data === undefined ? GameCef.send(eventName) : GameCef.sendJson(eventName, data);
    },

    Show: function(data) {
        this.Init();
        this.SetData(data);
        this.root.classList.add("active");
        this.root.setAttribute("aria-hidden", "false");
        this.Render();
    },

    Hide: function() {
        this.Init();
        this.root.classList.remove("active");
        this.root.setAttribute("aria-hidden", "true");
    },

    Close: function() {
        this.Hide();
        this.Send("admin:close");
    },

    SetData: function(data) {
        if (!data) return;

        if (data.profile) this.state.profile = data.profile;
        if (data.stats) Object.assign(this.state.stats, data.stats);
        if (data.items) Object.assign(this.state.items, data.items);
        if (Array.isArray(data.admins)) this.state.admins = data.admins;
        if (Array.isArray(data.tickets)) this.state.tickets = data.tickets;
        if (Array.isArray(data.commands)) this.state.commands = data.commands;
        if (Array.isArray(data.punishments)) this.state.punishments = data.punishments;
        if (Array.isArray(data.locations)) this.state.locations = data.locations;
    },

    ApplyPatch: function(data) {
        if (!data) return;

        if (!data.patch) {
            this.SetData(data);
            this.Render();
            return;
        }

        if (data.patch === "reset") {
            this.state.admins = [];
            this.state.tickets = [];
            return;
        }

        if (data.patch === "admins") {
            this.state.admins.push.apply(this.state.admins, data.items || []);
            return;
        }

        if (data.patch === "tickets") {
            var tickets = data.items || [];
            for (var i = 0; i < tickets.length; i++) {
                tickets[i].messages = [];
                this.state.tickets.push(tickets[i]);
            }
            return;
        }

        if (data.patch === "ready") {
            this.state.tickets.sort(function(a, b) { return Number(b.id) - Number(a.id); });
            this.Render();
            return;
        }

        if (data.patch === "ticket") {
            this.UpsertTicket(data.ticket);
            this.Render();
            return;
        }

        var ticket = this.FindTicket(data.ticketId);
        if (!ticket) return;

        if (data.patch === "messages-reset") {
            ticket.messages = [];
            return;
        }

        if (data.patch === "messages") {
            ticket.messages.push.apply(ticket.messages, data.items || []);
            return;
        }

        if (data.patch === "messages-ready") {
            if (String(this.selectedTicket) === String(ticket.id)) this.Render();
            return;
        }

        if (data.patch === "message") {
            ticket.messages.push(data.message);
            if (String(this.selectedTicket) === String(ticket.id)) this.Render();
        }
    },

    UpsertTicket: function(ticket) {
        if (!ticket) return;

        var current = this.FindTicket(ticket.id);
        ticket.messages = current ? current.messages : [];

        if (current) {
            this.state.tickets[this.state.tickets.indexOf(current)] = ticket;
        } else {
            this.state.tickets.unshift(ticket);
        }

        if (String(this.selectedTicket) === String(ticket.id) && this.Mine(ticket)) {
            this.filter = "mine";
            this.chatOpen = true;
        }
    },

    FindTicket: function(ticketId) {
        return this.state.tickets.find(function(ticket) {
            return String(ticket.id) === String(ticketId);
        });
    },

    Ticket: function() {
        return this.FindTicket(this.selectedTicket);
    },

    Mine: function(ticket) {
        return this.state.profile.id != null && ticket.status !== "closed" && String(ticket.adminId) === String(this.state.profile.id);
    },

    ResetTicketView: function() {
        this.selectedTicket = null;
        this.chatOpen = false;
        this.ticketFocus = false;
        this.quickOpen = false;
        this.transferOpen = false;
        this.transferAdminId = null;
        this.ticketLimit = 150;
        this.messageLimit = 200;
    },

    Minutes: function(value) {
        value = Math.max(0, Math.floor(Number(value) || 0));
        return value >= 60 ? Math.floor(value / 60) + " год " + value % 60 + " хв" : value + " хв";
    },

    IsMobileLandscape: function() {
        return window.innerWidth > window.innerHeight && window.innerHeight <= 600;
    },

    Scale: function() {
        if (!this.root) return;

        var width = window.innerWidth;
        var height = window.innerHeight;
        var mobile = this.IsMobileLandscape();
        var baseWidth = mobile ? 1280 : 1440;
        var baseHeight = mobile ? (height <= 390 ? 590 : 620) : 810;
        var scale = Math.min(width * (mobile ? 0.88 : 0.92) / baseWidth, height * (mobile ? 0.84 : 0.88) / baseHeight, 1);

        this.root.classList.toggle("admin-mobile-landscape", mobile);
        this.root.style.setProperty("--admin-panel-scale", scale);
    },

    Toast: function(text) {
        var toast = this.Q("#admin-toast");
        toast.textContent = text;
        toast.style.display = "block";
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(function() { toast.style.display = "none"; }, 3500);
    },

    Table: function(headers, rows, foot) {
        var head = headers.map(this.Escape).map(function(value) { return "<th>" + value + "</th>"; }).join("");
        var body = rows || '<tr><td colspan="' + headers.length + '" class="admin-empty">Немає даних</td></tr>';
        return '<table class="admin-table"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody>" + (foot || "") + "</table>";
    },

    Render: function() {
        if (!this.root) return;

        var labels = {
            stats: "Статистика",
            tickets: "Звернення",
            commands: "Адмін-команди",
            punishments: "Гайд покарань",
            items: "Довідник ID",
            spawns: "Швидкі спавни"
        };
        var nav = [["stats", "▥"], ["tickets", "♧"], ["commands", "›_"], ["punishments", "▤"], ["items", "◇"], ["spawns", "⌖"]];
        var self = this;

        this.Q("#admin-nav").innerHTML = nav.map(function(item) {
            var badge = item[0] === "tickets" ? '<span class="admin-badge">' + self.state.tickets.filter(function(ticket) { return ticket.status !== "closed"; }).length + "</span>" : "";
            return '<button type="button" data-admin-tab="' + item[0] + '" class="' + (self.tab === item[0] ? "active" : "") + '"><span class="admin-icon">' + item[1] + "</span><span>" + labels[item[0]] + "</span>" + badge + "</button>";
        }).join("");

        this.Q("#admin-title").textContent = labels[this.tab];
        this.Q("#admin-content").innerHTML = ({
            stats: this.Stats,
            tickets: this.Tickets,
            commands: this.Commands,
            punishments: this.Punishments,
            items: this.Items,
            spawns: this.Spawns
        }[this.tab]).call(this);

        var messages = this.Q(".admin-messages");
        if (messages) messages.scrollTop = messages.scrollHeight;

        var mobileLayer = this.root.querySelector(".admin-transfer-mobile-layer");
        if (mobileLayer) mobileLayer.remove();

        if (!this.transferOpen) return;
        if (this.IsMobileLandscape()) this.RenderMobileTransfer();
        else requestAnimationFrame(function() { self.PositionTransferMenu(); });
    },

    RenderMobileTransfer: function() {
        var self = this;
        var admins = this.state.admins.filter(function(admin) { return String(admin.id) !== String(self.state.profile.id); });
        var layer = document.createElement("div");

        layer.className = "admin-transfer-mobile-layer";
        layer.innerHTML = '<button type="button" class="admin-transfer-mobile-backdrop" data-admin-transfer-close aria-label="Закрити"></button>'
            + '<div class="admin-transfer-mobile-sheet" role="dialog" aria-modal="true" aria-label="Передати звернення">'
            + '<div class="admin-transfer-mobile-head"><div><strong>Передати звернення</strong><small>Оберіть адміністратора</small></div><button type="button" class="admin-transfer-mobile-close" data-admin-transfer-close>×</button></div>'
            + '<div class="admin-transfer-mobile-list">'
            + (admins.length ? admins.map(function(admin) {
                return '<button type="button" class="admin-transfer-mobile-option' + (String(self.transferAdminId) === String(admin.id) ? " active" : "") + '" data-admin-transfer-option="' + self.Escape(admin.id) + '"><span>' + self.Escape(admin.name) + "</span><small>ID: " + self.Escape(admin.id) + "</small></button>";
            }).join("") : '<div class="admin-transfer-mobile-empty">Немає адміністраторів онлайн</div>')
            + "</div></div>";

        this.root.appendChild(layer);
    },

    PositionTransferMenu: function() {
        var menu = this.Q(".admin-transfer-menu");
        var toggle = this.Q(".admin-transfer-toggle");
        if (!menu || !toggle) return;

        var toggleRect = toggle.getBoundingClientRect();
        var rootRect = this.root.getBoundingClientRect();
        var scale = this.root.offsetWidth ? rootRect.width / this.root.offsetWidth : 1;
        var top = Math.max(0, toggleRect.top - Math.max(8, rootRect.top + 8) - 6);
        var bottom = Math.max(0, Math.min(window.innerHeight - 8, rootRect.bottom - 8) - toggleRect.bottom - 6);
        var down = bottom > top;

        menu.classList.toggle("admin-transfer-menu-down", down);
        menu.style.maxHeight = Math.min(220, Math.max(72, Math.floor((down ? bottom : top) / (scale || 1)))) + "px";
    },

    Stats: function() {
        var self = this;
        var days = this.state.stats.days || [];
        var total = days.reduce(function(result, day) {
            result.online += Number(day.onlineMinutes) || 0;
            result.closed += Number(day.closed) || 0;
            return result;
        }, { online: 0, closed: 0 });

        return '<div class="admin-row admin-between"><div class="admin-row"><h2>' + this.Escape(this.state.profile.name || "Адміністратор") + '</h2><span class="admin-badge">' + this.Escape(this.state.profile.role) + "</span></div><small>" + this.Escape(this.state.stats.period || "Поточний тиждень") + "</small></div>"
            + '<div class="admin-cards">'
            + [["♧", "Мої активні звернення", this.state.tickets.filter(function(ticket) { return self.Mine(ticket); }).length], ["◷", "Онлайн за тиждень", this.Minutes(total.online)], ["✓", "Закрито звернень за тиждень", total.closed]].map(function(card) {
                return '<div class="admin-card"><span class="admin-icon">' + card[0] + "</span><div><small>" + card[1] + '</small><div class="admin-value">' + card[2] + "</div></div></div>";
            }).join("")
            + "</div>"
            + '<div class="admin-stats"><div class="admin-box admin-scroll"><h2>Активність за днями</h2>'
            + this.Table(["День", "Онлайн", "Закрито звернень"], days.map(function(day) {
                return "<tr><td>" + self.Escape(day.day) + "</td><td>" + self.Minutes(day.onlineMinutes) + "</td><td>" + self.Escape(day.closed) + "</td></tr>";
            }).join(""), "<tfoot><tr><td>Разом</td><td>" + this.Minutes(total.online) + "</td><td>" + total.closed + "</td></tr></tfoot>")
            + '</div><div class="admin-box admin-scroll"><h2>Адміни онлайн <span class="admin-badge">' + this.state.admins.length + "</span></h2>"
            + this.Table(["ID", "Нікнейм"], this.state.admins.map(function(admin) {
                return "<tr><td>" + self.Escape(admin.id) + "</td><td>" + self.Escape(admin.name) + "</td></tr>";
            }).join("")) + "</div></div>";
    },

    FilteredTickets: function() {
        var self = this;
        var query = this.query.toLowerCase();

        return this.state.tickets.filter(function(ticket) {
            var visible = self.filter === "closed"
                ? ticket.status === "closed"
                : self.filter === "free"
                    ? ticket.status !== "closed" && ticket.adminId == null
                    : self.Mine(ticket);

            if (!visible) return false;
            return [ticket.id, ticket.playerName, ticket.playerId, ticket.subject].join(" ").toLowerCase().includes(query);
        });
    },

    Tickets: function() {
        var self = this;
        var filtered = this.FilteredTickets();

        if (!filtered.some(function(ticket) { return String(ticket.id) === String(self.selectedTicket); }))
            this.selectedTicket = filtered.length ? filtered[0].id : null;

        var rows = filtered.slice(0, this.ticketLimit);
        var ticket = this.Ticket();
        var counts = {
            free: this.state.tickets.filter(function(item) { return item.status !== "closed" && item.adminId == null; }).length,
            mine: this.state.tickets.filter(function(item) { return self.Mine(item); }).length,
            closed: this.state.tickets.filter(function(item) { return item.status === "closed"; }).length
        };

        var more = filtered.length > rows.length
            ? '<button type="button" class="admin-ticket admin-ticket-more" data-admin-more-tickets>Показати ще · ' + (filtered.length - rows.length) + "</button>"
            : "";

        var list = rows.map(function(item) {
            return '<button type="button" class="admin-ticket ' + (String(item.id) === String(self.selectedTicket) ? "active" : "") + '" data-admin-ticket="' + self.Escape(item.id) + '"><span>#' + self.Escape(item.id) + " · " + self.Escape(item.waitLabel) + "</span><strong>" + self.Escape(item.playerName) + " [" + self.Escape(item.playerId) + "]</strong><small>" + self.Escape(item.subject) + "</small></button>";
        }).join("") || '<div class="admin-empty">Звернень немає</div>';

        return '<div class="admin-tabs">'
            + [["free", "Вільні"], ["mine", "Мої"], ["closed", "Закриті"]].map(function(item) {
                return '<button type="button" data-admin-filter="' + item[0] + '" class="' + (self.filter === item[0] ? "active" : "") + '">' + item[1] + " · " + counts[item[0]] + "</button>";
            }).join("")
            + '</div><div class="admin-ticket-layout ' + (this.chatOpen ? "admin-chat-open " : "") + (this.ticketFocus ? "admin-ticket-focus" : "") + '">'
            + '<div class="admin-tickets"><input class="admin-search" data-admin-search value="' + this.Escape(this.query) + '" placeholder="Пошук за назвою, ID або описом">' + list + more + "</div>"
            + '<div class="admin-chat">' + (ticket ? this.Chat(ticket) : '<div class="admin-empty">Оберіть звернення</div>') + "</div></div>";
    },

    Chat: function(ticket) {
        var self = this;
        var mine = this.Mine(ticket);
        var closed = ticket.status === "closed";
        var admins = this.state.admins.filter(function(admin) { return String(admin.id) !== String(self.state.profile.id); });
        var messages = ticket.messages || [];
        var start = Math.max(0, messages.length - this.messageLimit);
        var visible = messages.slice(start);

        var history = start > 0
            ? '<button type="button" class="admin-select admin-message-more" data-admin-more-messages>Показати попередні · ' + start + "</button>"
            : "";

        history += visible.map(function(message) {
            return '<div class="admin-message ' + (message.isAdmin ? "admin-own" : "admin-player") + '"><small>' + self.Escape(message.senderName) + " · " + self.Escape(message.date) + '</small><div class="admin-bubble">' + self.Escape(message.message) + "</div></div>";
        }).join("");

        var controls;
        if (mine) controls = this.Composer(admins);
        else if (!closed && ticket.adminId == null) controls = '<div class="admin-composer"><button type="button" class="admin-primary admin-claim-ticket" data-admin-action="claim">Взяти звернення</button></div>';
        else controls = '<div class="admin-composer admin-muted">Перегляд історії листування</div>';

        return '<div class="admin-chat-head"><div class="admin-chat-title-row"><div><h2>#' + this.Escape(ticket.id) + " · " + this.Escape(ticket.subject || "Звернення") + "</h2><small>" + this.Escape(ticket.playerName) + " [ID: " + this.Escape(ticket.playerId) + "] · " + (closed ? "Закрито" : ticket.adminId == null ? "Вільний" : "В роботі") + '</small></div><button type="button" class="admin-ticket-focus-toggle" data-admin-ticket-focus>' + (this.ticketFocus ? "Показати звернення" : "Сховати звернення") + '</button></div></div><div class="admin-messages">' + history + "</div>" + controls;
    },

    Composer: function(admins) {
        var self = this;
        var quickMenu = this.quickOpen
            ? '<div class="admin-quick-menu">' + this.quickReplies.map(function(reply, index) {
                return '<button type="button" data-admin-quick="' + index + '">' + self.Escape(reply.label) + "</button>";
            }).join("") + "</div>"
            : "";

        var transferMenu = this.transferOpen && !this.IsMobileLandscape()
            ? '<div class="admin-transfer-menu">' + (admins.length ? admins.map(function(admin) {
                return '<button type="button" class="admin-transfer-option ' + (String(self.transferAdminId) === String(admin.id) ? "active" : "") + '" data-admin-transfer-option="' + self.Escape(admin.id) + '">' + self.Escape(admin.name) + " [" + self.Escape(admin.id) + "]</button>";
            }).join("") : '<div class="admin-transfer-empty">Немає адміністраторів онлайн</div>') + "</div>"
            : "";

        return '<div class="admin-composer"><div class="admin-ticket-controls">'
            + '<div class="admin-quick-wrap"><button type="button" class="admin-quick-toggle" data-admin-quick-toggle>Швидкі відповіді ' + (this.quickOpen ? "▴" : "▾") + "</button>" + quickMenu + "</div>"
            + '<div class="admin-transfer-row"><div class="admin-transfer-select"><button type="button" class="admin-select admin-transfer-toggle" data-admin-transfer-toggle>' + this.TransferAdminLabel(admins) + "</button>" + transferMenu + '</div><button type="button" data-admin-action="transfer">Передати</button><button type="button" data-admin-action="release">Звільнити</button></div>'
            + '</div><div class="admin-send-row"><textarea class="admin-textarea" data-admin-draft placeholder="Напишіть повідомлення…"></textarea><button type="button" class="admin-send admin-primary" data-admin-action="send">Надіслати</button></div>'
            + '<button type="button" class="admin-close-ticket" data-admin-action="resolve">Закрити тікет</button></div>';
    },

    TransferAdminLabel: function(admins) {
        var self = this;
        var admin = admins.find(function(item) { return String(item.id) === String(self.transferAdminId); });
        return admin ? this.Escape(admin.name) + " [" + this.Escape(admin.id) + "] ▾" : "Передати адміну… ▾";
    },

    Search: function() {
        return '<input class="admin-search" data-admin-search value="' + this.Escape(this.query) + '" placeholder="Пошук за назвою, ID або описом">';
    },

    Commands: function() {
        return this.Search() + '<div class="admin-box admin-scroll"><h2>Адмін-команди</h2>' + this.Table(["Команда", "Опис", "Мін. рівень"], this.state.commands.filter(this.Match.bind(this)).map(this.CommandRow.bind(this)).join("")) + "</div>";
    },

    CommandRow: function(item) {
        return "<tr><td><code>" + this.Escape(item.name) + "</code></td><td>" + this.Escape(item.description) + "</td><td>" + this.Escape(item.minLevel) + "</td></tr>";
    },

    Punishments: function() {
        var self = this;
        return this.Search() + '<div class="admin-box admin-scroll"><h2>Гайд покарань</h2>' + this.Table(["Порушення", "Покарання", "Термін"], this.state.punishments.filter(this.Match.bind(this)).map(function(item) {
            return "<tr><td>" + self.Escape(item.violation) + "</td><td>" + self.Escape(item.type) + "</td><td>" + self.Escape(item.duration) + "</td></tr>";
        }).join("")) + "</div>";
    },

    Items: function() {
        var self = this;
        var labels = { weapons: "Зброя", vehicles: "Авто", skins: "Скіни", organizations: "Організації" };
        var items = this.state.items[this.itemCategory] || [];

        return '<div class="admin-tabs">' + Object.keys(labels).map(function(key) {
            return '<button type="button" data-admin-items="' + key + '" class="' + (self.itemCategory === key ? "active" : "") + '">' + labels[key] + "</button>";
        }).join("") + '</div><div class="admin-box admin-scroll"><h2>' + labels[this.itemCategory] + "</h2>" + this.Table(["ID", this.itemCategory === "organizations" ? "Назва організації" : "Назва"], items.filter(this.Match.bind(this)).map(function(item) {
            return "<tr><td>" + self.Escape(item.id) + "</td><td>" + self.Escape(item.name) + "</td></tr>";
        }).join("")) + "</div>";
    },

    Spawns: function() {
        var self = this;
        return this.Search() + '<small>Натисніть на локацію, щоб телепортуватися</small><div class="admin-spawns">' + this.state.locations.filter(this.Match.bind(this)).map(function(item) {
            return '<button type="button" class="admin-spawn" data-admin-spawn="' + self.Escape(item.id) + '"><span class="admin-icon">⌖</span>' + self.Escape(item.name) + "</button>";
        }).join("") + "</div>";
    },

    Match: function(item) {
        return JSON.stringify(item).toLowerCase().includes(this.query.toLowerCase());
    },

    Click: function(e) {
        var button = e.target.closest("button");
        if (!button) return;

        if (button.dataset.adminTab) {
            this.tab = button.dataset.adminTab;
            this.query = "";
            this.ResetTicketView();
            this.Render();
            return;
        }

        if (button.dataset.adminFilter) {
            this.filter = button.dataset.adminFilter;
            this.ResetTicketView();
            this.Render();
            return;
        }

        if (button.dataset.adminMoreTickets !== undefined) {
            this.ticketLimit += 150;
            this.Render();
            return;
        }

        if (button.dataset.adminMoreMessages !== undefined) {
            this.messageLimit += 200;
            this.Render();
            return;
        }

        if (button.dataset.adminTicket) {
            this.selectedTicket = Number(button.dataset.adminTicket);
            this.chatOpen = true;
            this.messageLimit = 200;
            this.transferOpen = false;
            this.transferAdminId = null;
            this.Render();
            this.Send("admin:ticket:open", { TicketId: this.selectedTicket });
            return;
        }

        if (button.dataset.adminItems) {
            this.itemCategory = button.dataset.adminItems;
            this.query = "";
            this.Render();
            return;
        }

        if (button.dataset.adminTicketFocus !== undefined) {
            this.ticketFocus = !this.ticketFocus;
            this.Render();
            return;
        }

        if (button.dataset.adminBack !== undefined) {
            this.chatOpen = false;
            this.quickOpen = false;
            this.Render();
            return;
        }

        if (button.dataset.adminQuickToggle !== undefined) {
            this.quickOpen = !this.quickOpen;
            this.Render();
            return;
        }

        if (button.dataset.adminQuick !== undefined) {
            var draft = this.Q("[data-admin-draft]");
            var reply = this.quickReplies[Number(button.dataset.adminQuick)];
            if (draft && reply) {
                draft.value = reply.text;
                this.quickOpen = false;
                draft.focus();
                var menu = this.Q(".admin-quick-menu");
                if (menu) menu.style.display = "none";
            }
            return;
        }

        if (button.dataset.adminTransferClose !== undefined) {
            this.transferOpen = false;
            this.Render();
            return;
        }

        if (button.dataset.adminTransferToggle !== undefined) {
            this.transferOpen = !this.transferOpen;
            this.Render();
            return;
        }

        if (button.dataset.adminTransferOption !== undefined) {
            this.transferAdminId = Number(button.dataset.adminTransferOption);
            this.transferOpen = false;
            this.Render();
            return;
        }

        if (button.dataset.adminSpawn !== undefined) {
            this.Send("admin:spawn", { LocationId: button.dataset.adminSpawn });
            return;
        }

        if (button.dataset.adminAction !== undefined)
            this.Action(button.dataset.adminAction);
    },

    Action: function(action) {
        if (this.selectedTicket == null) return;

        var data = { TicketId: Number(this.selectedTicket) };

        if (action === "claim") return this.Send("admin:ticket:claim", data);
        if (action === "release") return this.Send("admin:ticket:release", data);
        if (action === "resolve") return this.Send("admin:ticket:close", data);

        if (action === "send") {
            var draft = this.Q("[data-admin-draft]");
            var message = draft ? draft.value.trim() : "";

            if (!message) return this.Toast("Введіть повідомлення");
            if (message.length > 500) return this.Toast("Максимум 500 символів");

            data.Message = message;
            this.Send("admin:ticket:message", data);
            draft.value = "";
            return;
        }

        if (action === "transfer") {
            if (!this.transferAdminId) return this.Toast("Оберіть адміністратора");

            data.AdminId = Number(this.transferAdminId);
            this.Send("admin:ticket:transfer", data);
            this.transferOpen = false;
        }
    },

    Input: function(e) {
        var input = e.target;
        if (!input.matches || !input.matches("[data-admin-search]")) return;

        this.query = input.value;
        this.ticketLimit = 150;
        clearTimeout(this.searchTimer);

        var self = this;
        this.searchTimer = setTimeout(function() {
            if (self.composingSearch) return;

            self.Render();
            var search = self.Q("[data-admin-search]");
            if (!search) return;

            search.focus();
            try { search.setSelectionRange(search.value.length, search.value.length); } catch (_) {}
        }, 180);
    }
};

function parseAdminPayload(data) {
    if (data && typeof data === "object") return data;
    try { return JSON.parse(data); } catch (_) { return null; }
}

window.addEventListener("DOMContentLoaded", function() {
    AdminPanel.Init();
});

if (window.GameCef) {
    GameCef.on("admin:show", function(data) {
        AdminPanel.Show(parseAdminPayload(data));
    });

    GameCef.on("admin:hide", function() {
        AdminPanel.Hide();
    });

    GameCef.on("admin:update", function(data) {
        AdminPanel.ApplyPatch(parseAdminPayload(data));
    });
}
