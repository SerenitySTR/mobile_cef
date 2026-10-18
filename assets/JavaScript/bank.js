var Bank = {
    screen: null,
    cash: 0,
    balance: 0,
    page: "home",
    pendingOperation: null,
    withdrawCommissionPercent: 2,
    transferCommissionPercent: 5,

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
        var confirmCancel = document.getElementById("bank-confirm-cancel");
        var confirmSubmit = document.getElementById("bank-confirm-submit");
        var confirm = document.getElementById("bank-confirm");

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
        if (confirmCancel)
            confirmCancel.onclick = function () { self.CloseConfirm(); };
        if (confirmSubmit)
            confirmSubmit.onclick = function () { self.ConfirmPending(); };
        if (confirm)
            confirm.onclick = function (event) {
                if (event.target === confirm)
                    self.CloseConfirm();
            };

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
            if (!input)
                return;

            input.oninput = function () {
                if (input.type === "number" && Number(input.value) < 0)
                    input.value = "0";
                self.ClearErrors();
                self.UpdateCommissionPreview();
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

                if (self.ConfirmOpen()) {
                    self.CloseConfirm();
                    return;
                }

                if (self.page !== "home") {
                    self.OpenPage("home");
                    return;
                }

                self.Close();
                return;
            }

            if (event.key !== "Enter")
                return;

            if (self.ConfirmOpen()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.ConfirmPending();
                return;
            }

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
        this.CloseConfirm();
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
        this.CloseConfirm();
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
        var withdrawPercent = this.Get(data, "WithdrawCommissionPercent", "withdrawCommissionPercent");
        var transferPercent = this.Get(data, "TransferCommissionPercent", "transferCommissionPercent");
        if (cash !== undefined && cash !== null)
            this.cash = this.SafeMoney(cash);
        if (balance !== undefined && balance !== null)
            this.balance = this.SafeMoney(balance);
        if (withdrawPercent !== undefined && withdrawPercent !== null)
            this.withdrawCommissionPercent = this.SafePercent(withdrawPercent, this.withdrawCommissionPercent);
        if (transferPercent !== undefined && transferPercent !== null)
            this.transferCommissionPercent = this.SafePercent(transferPercent, this.transferCommissionPercent);
        this.Render();
    },

    OpenPage: function (page) {
        var allowed = { home: 1, deposit: 1, withdraw: 1, transfer: 1 };
        this.CloseConfirm();
        this.page = allowed[page] ? page : "home";
        page = this.page;
        this.ClearErrors();

        var pages = document.querySelectorAll("[data-bank-page-view]");
        pages.forEach(function (node) {
            node.classList.toggle("active", node.getAttribute("data-bank-page-view") === page);
        });

        var nav = document.querySelectorAll("#bank .bank-nav-item[data-bank-page]");
        nav.forEach(function (node) {
            node.classList.toggle("active", node.getAttribute("data-bank-page") === page);
        });

        var content = document.querySelector("#bank .bank-content");
        if (content)
            content.scrollTop = 0;

        this.UpdateCommissionPreview();
    },

    Render: function () {
        this.SetText("bank-cash", this.Money(this.cash));
        this.SetText("bank-balance", this.Money(this.balance));
        this.SetText("bank-deposit-cash", this.Money(this.cash));
        this.SetText("bank-deposit-balance", this.Money(this.balance));
        this.SetText("bank-withdraw-cash", this.Money(this.cash));
        this.SetText("bank-withdraw-balance", this.Money(this.balance));
        this.SetText("bank-transfer-balance", this.Money(this.balance));
        this.UpdateCommissionLabels();
        this.UpdateCommissionPreview();
    },

    Deposit: function () {
        var amount = this.ReadAmount("bank-deposit-amount");
        if (!this.ValidateAmount(amount, this.cash, "bank-deposit-error", "Недостатньо готівки"))
            return;

        this.OpenConfirm({
            Type: "deposit",
            Amount: amount,
            Fee: 0,
            Total: amount
        });
    },

    Withdraw: function () {
        var amount = this.ReadAmount("bank-withdraw-amount");
        var fee = this.Commission(amount, this.withdrawCommissionPercent);
        var total = amount + fee;

        if (!this.ValidateCommissionAmount(
            amount,
            total,
            this.balance,
            "bank-withdraw-error",
            "Недостатньо коштів на рахунку з урахуванням комісії " + this.withdrawCommissionPercent + "%"
        ))
            return;

        this.OpenConfirm({
            Type: "withdraw",
            Amount: amount,
            Fee: fee,
            Total: total
        });
    },

    Transfer: function () {
        var nickname = String((document.getElementById("bank-transfer-player") || {}).value || "").trim();
        var amount = this.ReadAmount("bank-transfer-amount");
        var fee = this.Commission(amount, this.transferCommissionPercent);
        var total = amount + fee;

        if (!nickname || nickname.length < 3 || nickname.length > 24 || /\s/.test(nickname)) {
            this.ShowError("bank-transfer-error", "Вкажіть коректний нікнейм гравця");
            return;
        }

        if (!this.ValidateCommissionAmount(
            amount,
            total,
            this.balance,
            "bank-transfer-error",
            "Недостатньо коштів на рахунку з урахуванням комісії " + this.transferCommissionPercent + "%"
        ))
            return;

        this.OpenConfirm({
            Type: "transfer",
            Nickname: nickname,
            Amount: amount,
            Fee: fee,
            Total: total
        });
    },

    OpenConfirm: function (operation) {
        var confirm = document.getElementById("bank-confirm");
        if (!confirm || !operation)
            return;

        this.pendingOperation = operation;
        var feeRow = document.getElementById("bank-confirm-fee-row");
        var icon = document.getElementById("bank-confirm-icon");
        var title = "Підтвердити операцію?";
        var description = "";
        var totalLabel = "Буде списано";
        var amountLabel = "Сума";

        if (operation.Type === "deposit") {
            title = "Підтвердити поповнення?";
            description = "Кошти будуть перенесені з гаманця на банківський рахунок.";
            totalLabel = "Буде зараховано";
            amountLabel = "Сума поповнення";
            if (icon) icon.textContent = "+";
        }
        else if (operation.Type === "withdraw") {
            title = "Підтвердити зняття?";
            description = "Ви отримаєте " + this.Money(operation.Amount) + " готівкою. Комісія банку — " + this.withdrawCommissionPercent + "%.";
            amountLabel = "Сума зняття";
            if (icon) icon.textContent = "−";
        }
        else if (operation.Type === "transfer") {
            title = "Підтвердити переказ?";
            description = "Отримувач: " + operation.Nickname + ". Комісія банку — " + this.transferCommissionPercent + "%.";
            amountLabel = "Сума переказу";
            if (icon) icon.textContent = "↗";
        }

        this.SetText("bank-confirm-title", title);
        this.SetText("bank-confirm-description", description);
        this.SetText("bank-confirm-amount-label", amountLabel);
        this.SetText("bank-confirm-amount", this.Money(operation.Amount));
        this.SetText("bank-confirm-fee", this.Money(operation.Fee || 0));
        this.SetText("bank-confirm-total-label", totalLabel);
        this.SetText("bank-confirm-total", this.Money(operation.Total));

        if (feeRow)
            feeRow.style.display = operation.Fee > 0 ? "flex" : "none";

        confirm.classList.add("active");
        confirm.setAttribute("aria-hidden", "false");
    },

    CloseConfirm: function () {
        var confirm = document.getElementById("bank-confirm");
        if (confirm) {
            confirm.classList.remove("active");
            confirm.setAttribute("aria-hidden", "true");
        }
        this.pendingOperation = null;
    },

    ConfirmOpen: function () {
        var confirm = document.getElementById("bank-confirm");
        return !!(confirm && confirm.classList.contains("active"));
    },

    ConfirmPending: function () {
        var operation = this.pendingOperation;
        if (!operation)
            return;

        this.CloseConfirm();

        if (operation.Type === "deposit") {
            GameCef.sendJson("bank:deposit", { Amount: operation.Amount });
            return;
        }

        if (operation.Type === "withdraw") {
            GameCef.sendJson("bank:withdraw", { Amount: operation.Amount });
            return;
        }

        if (operation.Type === "transfer")
            GameCef.sendJson("bank:transfer", { Nickname: operation.Nickname, Amount: operation.Amount });
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

    ValidateCommissionAmount: function (amount, total, max, errorId, insufficient) {
        if (!Number.isFinite(amount) || amount <= 0) {
            this.ShowError(errorId, "Сума повинна бути більшою за 0");
            return false;
        }
        if (total > max) {
            this.ShowError(errorId, insufficient);
            return false;
        }
        this.ShowError(errorId, "");
        return true;
    },

    UpdateCommissionLabels: function () {
        this.SetText("bank-withdraw-description", "Отримайте готівку з банківського рахунку · комісія " + this.withdrawCommissionPercent + "%");
        this.SetText("bank-withdraw-fee-label", "Комісія (" + this.withdrawCommissionPercent + "%)");
        this.SetText("bank-transfer-description", "Надішліть гроші іншому гравцю · комісія " + this.transferCommissionPercent + "%");
        this.SetText("bank-transfer-fee-label", "Комісія (" + this.transferCommissionPercent + "%)");
    },

    UpdateCommissionPreview: function () {
        var withdrawAmount = this.ReadAmount("bank-withdraw-amount");
        var withdrawFee = this.Commission(withdrawAmount, this.withdrawCommissionPercent);
        this.SetText("bank-withdraw-fee", this.Money(withdrawFee));
        this.SetText("bank-withdraw-total", this.Money(Math.max(0, withdrawAmount) + withdrawFee));

        var transferAmount = this.ReadAmount("bank-transfer-amount");
        var transferFee = this.Commission(transferAmount, this.transferCommissionPercent);
        this.SetText("bank-transfer-fee", this.Money(transferFee));
        this.SetText("bank-transfer-total", this.Money(Math.max(0, transferAmount) + transferFee));
    },

    Commission: function (amount, percent) {
        amount = Math.max(0, Math.trunc(Number(amount) || 0));
        percent = Math.max(0, Math.trunc(Number(percent) || 0));
        return Math.floor(amount * percent / 100);
    },

    MaxAmountForBalance: function (balance, percent) {
        balance = Math.max(0, Math.trunc(Number(balance) || 0));
        percent = Math.max(0, Math.trunc(Number(percent) || 0));
        if (percent <= 0)
            return balance;

        var amount = Math.floor(balance * 100 / (100 + percent));
        while (amount < balance) {
            var next = amount + 1;
            if (next + this.Commission(next, percent) > balance)
                break;
            amount = next;
        }
        return amount;
    },

    CommissionPercentForInput: function (id) {
        if (id === "bank-withdraw-amount")
            return this.withdrawCommissionPercent;
        if (id === "bank-transfer-amount")
            return this.transferCommissionPercent;
        return 0;
    },

    ApplyQuickAmount: function (wrap, amount) {
        if (!wrap)
            return;

        var inputId = wrap.getAttribute("data-bank-amount-target");
        var input = document.getElementById(inputId);
        if (!input)
            return;

        var maxType = wrap.getAttribute("data-bank-max");
        var available = maxType === "cash" ? this.cash : this.balance;
        var percent = this.CommissionPercentForInput(inputId);
        var max = percent > 0 ? this.MaxAmountForBalance(available, percent) : available;
        var value = amount === "max" ? max : Number(amount);

        input.value = String(Math.max(0, Math.min(Number(value) || 0, max)));
        this.ClearErrors();
        this.UpdateCommissionPreview();
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

    SafePercent: function (value, fallback) {
        var number = Number(value);
        if (!Number.isFinite(number))
            return fallback;
        return Math.max(0, Math.min(100, Math.trunc(number)));
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
