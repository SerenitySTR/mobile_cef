var Bank = {
    screen: null,
    cash: 0,
    balance: 0,
    page: "home",
    Init: function () {
        this.screen = document.getElementById("bank");
        if (!this.screen)
            return;
        this.Bind();
    },
    Bind: function () {
        if (!this.screen || this.screen.getAttribute("data-bound") === "1")
            return;
        this.screen.setAttribute("data-bound", "1");
        var self = this;
        var close = document.getElementById("bank-close");
        var refresh = document.getElementById("bank-refresh");
        var deposit = document.getElementById("bank-deposit-submit");
        var withdraw = document.getElementById("bank-withdraw-submit");
        var transfer = document.getElementById("bank-transfer-submit");
        if (close)
            close.onclick = function () { self.Close(); };
        if (refresh)
            refresh.onclick = function () { GameCef.sendJson("bank:refresh", {}); };
        if (deposit)
            deposit.onclick = function () { self.Deposit(); };
        if (withdraw)
            withdraw.onclick = function () { self.Withdraw(); };
        if (transfer)
            transfer.onclick = function () { self.Transfer(); };

        this.screen.addEventListener("click", function (event) {
            var pageButton = event.target.closest("[data-bank-page]");
            if (pageButton) {
                self.OpenPage(pageButton.getAttribute("data-bank-page"));
                return;
            }
            var amountButton = event.target.closest("[data-bank-amount-target] button[data-amount]");
            if (amountButton) {
                var wrap = amountButton.closest("[data-bank-amount-target]");
                self.ApplyQuickAmount(wrap, amountButton.getAttribute("data-amount"));
                return;
            }
        });

        ["bank-deposit-amount", "bank-withdraw-amount", "bank-transfer-player", "bank-transfer-amount"].forEach(function (id) {
            var input = document.getElementById(id);
            if (input)
                input.oninput = function () {
                    if (Number(input.value) < 0)
                        input.value = "0";
                    self.ClearErrors();
                };
        });

        document.addEventListener("keydown", function (event) {
            if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
                return;
            if (!self.screen || !self.screen.classList.contains("active"))
                return;
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (self.page !== "home") {
                    self.OpenPage("home");
                    return;
                }
                self.Close();
                return;
            }
            if (event.key !== "Enter")
                return;
            if (self.page === "deposit") self.Deposit();
            else if (self.page === "withdraw") self.Withdraw();
            else if (self.page === "transfer") self.Transfer();
        });
    },
    Show: function (data) {
        this.Init();
        if (!this.screen)
            return;
        if (data !== undefined && data !== null && data !== "")
            this.SetData(data);
        this.OpenPage("home");
        this.screen.classList.add("active");
        this.screen.setAttribute("aria-hidden", "false");
        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Focus(this.screen);
        if (typeof Loading !== "undefined" && Loading.Hide)
            Loading.Hide();
    },
    Hide: function () {
        this.Init();
        if (!this.screen)
            return;
        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Release(this.screen);
        this.screen.classList.remove("active");
        this.screen.setAttribute("aria-hidden", "true");
    },
    Close: function () {
        this.Hide();
        GameCef.sendJson("bank:close", {});
    },
    SetData: function (data) {
        this.Init();
        data = this.Parse(data);
        if (!data)
            return;
        var cash = this.Get(data, "Cash", "cash");
        var balance = this.Get(data, "Balance", "balance");
        if (cash !== undefined && cash !== null)
            this.cash = this.SafeMoney(cash);
        if (balance !== undefined && balance !== null)
            this.balance = this.SafeMoney(balance);
        this.Render();
    },
    OpenPage: function (page) {
        var allowed = { home: 1, deposit: 1, withdraw: 1, transfer: 1 };
        this.page = allowed[page] ? page : "home";
        page = this.page;
        this.ClearErrors();
        var pages = document.querySelectorAll("[data-bank-page-view]");
        pages.forEach(function (node) { node.classList.toggle("active", node.getAttribute("data-bank-page-view") === page); });
        var nav = document.querySelectorAll("#bank .bank-nav-item[data-bank-page]");
        nav.forEach(function (node) { node.classList.toggle("active", node.getAttribute("data-bank-page") === page); });
        var content = document.querySelector("#bank .bank-content");
        if (content)
            content.scrollTop = 0;
    },
    Render: function () {
        this.SetText("bank-cash", this.Money(this.cash));
        this.SetText("bank-balance", this.Money(this.balance));
        this.SetText("bank-deposit-cash", this.Money(this.cash));
        this.SetText("bank-deposit-balance", this.Money(this.balance));
        this.SetText("bank-withdraw-cash", this.Money(this.cash));
        this.SetText("bank-withdraw-balance", this.Money(this.balance));
        this.SetText("bank-transfer-balance", this.Money(this.balance));
    },
    Deposit: function () {
        var amount = this.ReadAmount("bank-deposit-amount");
        if (!this.ValidateAmount(amount, this.cash, "bank-deposit-error", "Недостатньо готівки"))
            return;
        GameCef.sendJson("bank:deposit", { Amount: amount });
    },
    Withdraw: function () {
        var amount = this.ReadAmount("bank-withdraw-amount");
        if (!this.ValidateAmount(amount, this.balance, "bank-withdraw-error", "Недостатньо коштів на рахунку"))
            return;
        GameCef.sendJson("bank:withdraw", { Amount: amount });
    },
    Transfer: function () {
        var nickname = String((document.getElementById("bank-transfer-player") || {}).value || "").trim();
        var amount = this.ReadAmount("bank-transfer-amount");
        if (!nickname || nickname.length < 3 || nickname.length > 24 || /\s/.test(nickname)) {
            this.ShowError("bank-transfer-error", "Вкажіть коректний нікнейм гравця");
            return;
        }
        if (!this.ValidateAmount(amount, this.balance, "bank-transfer-error", "Недостатньо коштів на рахунку"))
            return;
        GameCef.sendJson("bank:transfer", { Nickname: nickname, Amount: amount });
    },
    ValidateAmount: function (amount, max, errorId, insufficient) {
        if (!Number.isFinite(amount) || amount <= 0) {
            this.ShowError(errorId, "Сума повинна бути більшою за 0");
            return false;
        }
        if (amount > max) {
            this.ShowError(errorId, insufficient);
            return false;
        }
        this.ShowError(errorId, "");
        return true;
    },
    ApplyQuickAmount: function (wrap, amount) {
        if (!wrap)
            return;
        var input = document.getElementById(wrap.getAttribute("data-bank-amount-target"));
        if (!input)
            return;
        var maxType = wrap.getAttribute("data-bank-max");
        var max = maxType === "cash" ? this.cash : this.balance;
        var value = amount === "max" ? max : Number(amount);
        input.value = String(Math.max(0, Math.min(Number(value) || 0, max)));
        this.ClearErrors();
    },
    ReadAmount: function (id) {
        var input = document.getElementById(id);
        return input ? Math.trunc(Number(input.value)) : 0;
    },
    ClearErrors: function () {
        this.ShowError("bank-deposit-error", "");
        this.ShowError("bank-withdraw-error", "");
        this.ShowError("bank-transfer-error", "");
    },
    ShowError: function (id, text) {
        var node = document.getElementById(id);
        if (!node)
            return;
        node.textContent = text || "";
        node.classList.toggle("active", !!text);
    },
    Money: function (value) {
        value = this.SafeMoney(value);
        var sign = value < 0 ? "-$" : "$";
        return sign + Math.abs(value).toLocaleString("uk-UA");
    },
    SafeMoney: function (value) {
        var number = Number(value);
        if (!Number.isFinite(number))
            return 0;
        return Math.trunc(number);
    },
    Parse: function (data) {
        if (data === undefined || data === null || data === "")
            return {};
        if (typeof data === "object")
            return data;
        try { return JSON.parse(data); } catch (_) { return null; }
    },
    Get: function (object, first, second) {
        if (!object)
            return undefined;
        if (object[first] !== undefined)
            return object[first];
        return object[second];
    },
    SetText: function (id, text) {
        var node = document.getElementById(id);
        if (node)
            node.textContent = text === undefined || text === null ? "" : String(text);
    },
    Escape: function (value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
    }
};

GameCef.on("bank:show", function (data) { Bank.Show(data); });
GameCef.on("bank:hide", function () { Bank.Hide(); });
GameCef.on("bank:set", function (data) { Bank.SetData(data); });
