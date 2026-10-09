var Mailbox = {
    screen: null,
    messages: [],
    selectedId: null,
    Init: function () {
        this.screen = document.getElementById("mailbox");
        if (!this.screen)
            return;
        this.Bind();
    },
    Bind: function () {
        if (!this.screen || this.screen.getAttribute("data-bound") === "1")
            return;
        this.screen.setAttribute("data-bound", "1");
        var self = this;
        var close = document.getElementById("mailbox-close");
        var claim = document.getElementById("mailbox-claim");
        var remove = document.getElementById("mailbox-delete");
        if (close)
            close.onclick = function () { self.Hide(); GameCef.sendJson("mailbox:close", {}); };
        if (claim)
            claim.onclick = function () { self.Claim(); };
        if (remove)
            remove.onclick = function () { self.Delete(); };
        this.screen.addEventListener("click", function (event) {
            var entry = event.target.closest("[data-mailbox-id]");
            if (entry)
                self.Select(entry.getAttribute("data-mailbox-id"));
        });
        document.addEventListener("keydown", function (event) {
            if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat || event.key !== "Escape")
                return;
            if (!self.screen || !self.screen.classList.contains("active"))
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (close)
                close.click();
        });
    },
    Show: function (data) {
        this.Init();
        if (!this.screen)
            return;
        if (data !== undefined && data !== null && data !== "")
            this.SetData(data);
        this.screen.classList.add("active");
        this.screen.setAttribute("aria-hidden", "false");
        if (typeof Loading !== "undefined" && Loading.Hide)
            Loading.Hide();
    },
    Hide: function () {
        this.Init();
        if (!this.screen)
            return;
        this.screen.classList.remove("active");
        this.screen.setAttribute("aria-hidden", "true");
    },
    SetData: function (data) {
        data = this.Parse(data);
        if (!data)
            return;
        var messages = this.Get(data, "Messages", "messages");
        if (Array.isArray(messages))
            this.messages = messages;
        else if (Array.isArray(data))
            this.messages = data;
        if (!this.Find(this.selectedId))
            this.selectedId = this.messages.length ? this.Get(this.messages[0], "Id", "id") : null;
        this.Render();
    },
    SetMessages: function (data) {
        data = this.Parse(data);
        if (data && Array.isArray(data.Messages || data.messages))
            this.messages = data.Messages || data.messages;
        else if (Array.isArray(data))
            this.messages = data;
        if (!this.Find(this.selectedId))
            this.selectedId = this.messages.length ? this.Get(this.messages[0], "Id", "id") : null;
        this.Render();
    },
    Render: function () {
        this.RenderUnread();
        this.RenderList();
        this.RenderDetails(this.Find(this.selectedId));
    },
    RenderUnread: function () {
        var unread = 0;
        for (var i = 0; i < this.messages.length; i++) {
            if (!this.Get(this.messages[i], "IsRead", "isRead"))
                unread++;
        }
        this.SetText("mailbox-unread", unread + " " + this.Plural(unread, "непрочитане", "непрочитаних"));
    },
    RenderList: function () {
        var root = document.getElementById("mailbox-list");
        var empty = document.getElementById("mailbox-list-empty");
        if (!root)
            return;
        root.innerHTML = "";
        for (var i = 0; i < this.messages.length; i++) {
            var message = this.messages[i];
            var id = this.Get(message, "Id", "id");
            var title = this.Get(message, "Title", "title") || "Повідомлення";
            var preview = this.Get(message, "Preview", "preview") || this.Get(message, "Text", "text") || "";
            var created = this.Get(message, "CreatedAt", "createdAt") || "";
            var read = !!this.Get(message, "IsRead", "isRead");
            var button = document.createElement("button");
            button.type = "button";
            button.className = "mailbox-entry" + (read ? "" : " unread") + (String(id) === String(this.selectedId) ? " active" : "");
            button.setAttribute("data-mailbox-id", id);
            button.innerHTML =
                '<span class="mailbox-entry-icon">' + this.Icon(this.Get(message, "Icon", "icon")) + '</span>' +
                    '<span class="mailbox-entry-copy"><strong class="mailbox-entry-title">' + this.Escape(title) + '</strong><span class="mailbox-entry-preview">' + this.Escape(preview) + '</span></span>' +
                    '<span class="mailbox-entry-time">' + this.Escape(created) + '</span>';
            root.appendChild(button);
        }
        root.style.display = this.messages.length ? "block" : "none";
        if (empty)
            empty.classList.toggle("active", !this.messages.length);
    },
    RenderDetails: function (message) {
        var empty = document.getElementById("mailbox-details-empty");
        var body = document.getElementById("mailbox-details-body");
        if (!message) {
            if (empty)
                empty.classList.add("active");
            if (body)
                body.classList.remove("active");
            return;
        }
        if (empty)
            empty.classList.remove("active");
        if (body)
            body.classList.add("active");
        this.SetText("mailbox-message-title", this.Get(message, "Title", "title") || "Повідомлення");
        this.SetText("mailbox-message-sender", this.Get(message, "Sender", "sender") || "Система");
        this.SetText("mailbox-message-date", this.Get(message, "Date", "date") || this.Get(message, "CreatedAt", "createdAt") || "");
        this.SetText("mailbox-message-text", this.Get(message, "Text", "text") || "");
        var icon = document.getElementById("mailbox-message-icon");
        if (icon)
            icon.innerHTML = this.Icon(this.Get(message, "Icon", "icon"));
        var attachments = this.Get(message, "Attachments", "attachments") || [];
        this.SetText("mailbox-attachments-count", "(" + attachments.length + ")");
        this.RenderAttachments(attachments);
        var claim = document.getElementById("mailbox-claim");
        if (claim)
            claim.disabled = !attachments.length;
    },
    RenderAttachments: function (attachments) {
        var root = document.getElementById("mailbox-attachments");
        if (!root)
            return;
        root.innerHTML = "";
        var totalWeight = 0;
        for (var i = 0; i < attachments.length; i++) {
            var item = attachments[i];
            var title = this.Get(item, "Title", "title") || "Предмет";
            var image = this.Get(item, "Image", "image") || "";
            var count = Math.max(1, Number(this.Get(item, "Count", "count")) || 1);
            var weight = Number(this.Get(item, "Weight", "weight"));
            if (!isNaN(weight))
                totalWeight += weight * count;
            var card = document.createElement("article");
            card.className = "mailbox-attachment";
            card.innerHTML =
                '<span class="mailbox-attachment-count">x' + this.Escape(count) + '</span>' +
                    '<div class="mailbox-attachment-image">' + this.Image(image, title) + '</div>' +
                    '<strong>' + this.Escape(title) + '</strong>' +
                    '<small>' + (isNaN(weight) ? "" : "Вага: " + this.FormatWeight(weight) + " кг") + '</small>';
            root.appendChild(card);
        }
        if (!attachments.length) {
            var empty = document.createElement("div");
            empty.className = "mailbox-no-attachments";
            empty.textContent = "У цьому повідомленні немає вкладень";
            root.appendChild(empty);
        }
        this.SetText("mailbox-total-weight", attachments.length ? "Загальна вага вкладень: " + this.FormatWeight(totalWeight) + " кг" : "");
    },
    Select: function (id) {
        var message = this.Find(id);
        if (!message)
            return;
        this.selectedId = this.Get(message, "Id", "id");
        if (!this.Get(message, "IsRead", "isRead")) {
            if (message.IsRead !== undefined)
                message.IsRead = true;
            else
                message.isRead = true;
            GameCef.sendJson("mailbox:read", { MessageId: this.selectedId });
        }
        this.Render();
    },
    Claim: function () {
        if (this.selectedId === null)
            return;
        GameCef.sendJson("mailbox:claim", { MessageId: this.selectedId });
    },
    Delete: function () {
        if (this.selectedId === null)
            return;
        GameCef.sendJson("mailbox:delete", { MessageId: this.selectedId });
    },
    Find: function (id) {
        if (id === null || id === undefined)
            return null;
        for (var i = 0; i < this.messages.length; i++)
            if (String(this.Get(this.messages[i], "Id", "id")) === String(id))
                return this.messages[i];
        return null;
    },
    Icon: function (name) {
        var key = String(name || "mail").toLowerCase();
        var icons = { reward: "🎁", system: "⚙", daily: "▣", event: "🎉", admin: "✉", mail: "✉" };
        return icons[key] || icons.mail;
    },
    ImagePath: function (image) {
        image = String(image || "").trim();
        if (!image)
            return "";
        if (image.indexOf("/") !== -1 || image.indexOf("data:") === 0)
            return image;
        return "./assets/CSS/Images/Inventory/" + image;
    },
    Image: function (image, title) {
        var path = this.ImagePath(image);
        return path ? '<img src="' + this.EscapeAttribute(path) + '" alt="' + this.EscapeAttribute(title) + '">' : '<span class="mailbox-attachment-fallback">□</span>';
    },
    Get: function (object, pascal, camel) { if (!object)
        return undefined; if (object[pascal] !== undefined)
        return object[pascal]; return object[camel]; },
    Parse: function (data) { if (typeof data !== "string")
        return data; try {
        var parsed = JSON.parse(data);
        if (typeof parsed === "string")
            parsed = JSON.parse(parsed);
        return parsed;
    }
    catch (_) {
        return null;
    } },
    SetText: function (id, value) { var element = document.getElementById(id); if (element)
        element.textContent = value === undefined || value === null ? "" : String(value); },
    Escape: function (value) { var div = document.createElement("div"); div.textContent = value === undefined || value === null ? "" : String(value); return div.innerHTML; },
    EscapeAttribute: function (value) { return this.Escape(value).replace(/`/g, "&#96;"); },
    FormatWeight: function (value) { var number = Number(value) || 0; return number.toFixed(number < 1 ? 2 : number % 1 ? 1 : 0).replace(/0+$/, " ").trim().replace(/\.$/, ""); },
    Plural: function (value, one, many) { return Number(value) === 1 ? one : many; }
};
var mailboxBuffer = "";
GameCef.on("mailbox:show", function (data) { Mailbox.Show(data); });
GameCef.on("mailbox:hide", function () { Mailbox.Hide(); });
GameCef.on("mailbox:set", function (data) { Mailbox.SetData(data); });
GameCef.on("mailbox:set-begin", function () { mailboxBuffer = ""; });
GameCef.on("mailbox:set-chunk", function (data) { mailboxBuffer += data || ""; });
GameCef.on("mailbox:set-end", function () { Mailbox.SetData(mailboxBuffer); mailboxBuffer = ""; });
GameCef.on("mailbox:messages", function (data) { Mailbox.SetMessages(data); });
Mailbox.Init();
