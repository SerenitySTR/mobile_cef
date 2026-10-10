var Inventory = {
    screen: null,
    grid: null,
    empty: null,
    character: null,
    items: [],
    defaultCharacterImage: "./assets/CSS/Images/Inventory/equipment-character-default-transparent.webp",
    equipment: [],
    currentWeight: 0,
    maxWeight: 0,
    selectedSource: "inventory",
    selectedIndex: null,
    selectedSlot: null,
    Init: function () {
        this.screen = document.getElementById("inventory");
        this.grid = document.getElementById("inventory-grid");
        this.empty = document.getElementById("inventory-empty");
        this.character = document.getElementById("equipment-character");
        if (!this.screen)
            return;
        this.EnsureDeleteUi();
        this.Bind();
    },
    Bind: function () {
        if (this.screen.getAttribute("data-bound") === "1")
            return;
        this.screen.setAttribute("data-bound", "1");
        var self = this;
        var close = document.getElementById("inventory-close");
        var use = document.getElementById("inventory-use");
        var sell = document.getElementById("inventory-sell");
        var split = document.getElementById("inventory-split");
        var remove = document.getElementById("inventory-delete");
        var equipment = document.querySelector(".inventory-equipment");
        if (close)
            close.onclick = function () {
                self.Hide();
                GameCef.sendJson("inventory:close", {});
            };
        if (use)
            use.onclick = function () {
                self.UseSelected();
            };
        if (sell)
            sell.onclick = function () {
                self.SellSelected();
            };
        if (split)
            split.onclick = function () {
                self.SplitSelected();
            };
        if (remove)
            remove.onclick = function () {
                self.DeleteSelected();
            };
        var sellCancel = document.getElementById("inventory-sell-cancel");
        var sellConfirm = document.getElementById("inventory-sell-confirm");
        var sellMinus = document.getElementById("inventory-sell-minus");
        var sellPlus = document.getElementById("inventory-sell-plus");
        var sellAmount = document.getElementById("inventory-sell-amount");
        var sellPlayer = document.getElementById("inventory-sell-player");
        var sellPrice = document.getElementById("inventory-sell-price");
        if (sellCancel)
            sellCancel.onclick = function () {
                self.CloseSellDialog();
            };
        if (sellConfirm)
            sellConfirm.onclick = function () {
                self.ConfirmSell();
            };
        if (sellMinus)
            sellMinus.onclick = function () {
                self.ChangeSellAmount(-1);
            };
        if (sellPlus)
            sellPlus.onclick = function () {
                self.ChangeSellAmount(1);
            };
        if (sellAmount) {
            sellAmount.oninput = function () {
                self.ClampSellAmount();
            };
            sellAmount.onblur = function () {
                self.ClampSellAmount();
            };
        }
        if (sellPlayer)
            sellPlayer.oninput = function () {
                if (Number(sellPlayer.value) < 0)
                    sellPlayer.value = "0";
            };
        if (sellPrice)
            sellPrice.oninput = function () {
                if (Number(sellPrice.value) < 1)
                    sellPrice.value = "1";
            };

        var splitCancel = document.getElementById("inventory-split-cancel");
        var splitConfirm = document.getElementById("inventory-split-confirm");
        var splitMinus = document.getElementById("inventory-split-minus");
        var splitPlus = document.getElementById("inventory-split-plus");
        var splitAmount = document.getElementById("inventory-split-amount");
        if (splitCancel)
            splitCancel.onclick = function () {
                self.CloseSplitDialog();
            };
        if (splitConfirm)
            splitConfirm.onclick = function () {
                self.ConfirmSplit();
            };
        if (splitMinus)
            splitMinus.onclick = function () {
                self.ChangeSplitAmount(-1);
            };
        if (splitPlus)
            splitPlus.onclick = function () {
                self.ChangeSplitAmount(1);
            };
        if (splitAmount) {
            splitAmount.oninput = function () {
                self.ClampSplitAmount();
            };
            splitAmount.onblur = function () {
                self.ClampSplitAmount();
            };
        }
        var deleteCancel = document.getElementById("inventory-delete-cancel");
        var deleteConfirm = document.getElementById("inventory-delete-confirm");
        var deleteMinus = document.getElementById("inventory-delete-minus");
        var deletePlus = document.getElementById("inventory-delete-plus");
        var deleteAmount = document.getElementById("inventory-delete-amount");
        if (deleteCancel)
            deleteCancel.onclick = function () {
                self.CloseDeleteDialog();
            };
        if (deleteConfirm)
            deleteConfirm.onclick = function () {
                self.ConfirmDelete();
            };
        if (deleteMinus)
            deleteMinus.onclick = function () {
                self.ChangeDeleteAmount(-1);
            };
        if (deletePlus)
            deletePlus.onclick = function () {
                self.ChangeDeleteAmount(1);
            };
        if (deleteAmount) {
            deleteAmount.oninput = function () {
                self.ClampDeleteAmount();
            };
            deleteAmount.onblur = function () {
                self.ClampDeleteAmount();
            };
        }
        if (equipment)
            equipment.onclick = function (event) {
                var button = event.target.closest("[data-equipment-slot]");
                if (button)
                    self.SelectEquipment(button.getAttribute("data-equipment-slot"));
            };
        document.addEventListener("keydown", function (event) {
            if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
                return;
            if (!self.screen || !self.screen.classList.contains("active"))
                return;
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (self.SellDialogOpen()) {
                    self.CloseSellDialog();
                    return;
                }
                if (self.SplitDialogOpen()) {
                    self.CloseSplitDialog();
                    return;
                }
                if (self.DeleteDialogOpen()) {
                    self.CloseDeleteDialog();
                    return;
                }
                if (close)
                    close.click();
                return;
            }
            if (event.key === "Enter" && self.SellDialogOpen()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.ConfirmSell();
                return;
            }
            if (event.key === "Enter" && self.SplitDialogOpen()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.ConfirmSplit();
                return;
            }
            if (event.key === "Enter" && self.DeleteDialogOpen()) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.ConfirmDelete();
                return;
            }
            if (event.key !== "Enter" || !self.SelectedItem())
                return;
            if (event.target && ("INPUT TEXTAREA BUTTON A".indexOf(event.target.tagName) !== -1))
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            self.UseSelected();
        });
    },
    Show: function (data) {
        this.Init();
        if (!this.screen)
            return;
        if (data !== undefined && data !== null && data !== "")
            this.SetData(data);
        this.screen.classList.add("active");
        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Focus(this.screen);
        if (typeof Loading !== "undefined" && Loading.Hide)
            Loading.Hide();
    },
    Hide: function () {
        this.Init();
        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Release(this.screen);
        if (this.screen)
            this.screen.classList.remove("active");
    },
    SetData: function (data) {
        this.Init();
        data = this.Parse(data);
        if (!data)
            return;
        var items = this.Get(data, "Items", "items");
        var equipment = this.Get(data, "Equipment", "equipment");
        var characterImage = this.Get(data, "CharacterImage", "characterImage");
        var currentWeight = this.Get(data, "CurrentWeight", "currentWeight");
        var maxWeight = this.Get(data, "MaxWeight", "maxWeight");
        this.items = Array.isArray(items) ? items : [];
        this.equipment = this.NormalizeEquipment(equipment);
        this.currentWeight = Number(currentWeight) || 0;
        this.maxWeight = Number(maxWeight) || 0;
        this.SetCharacterImage(characterImage || this.defaultCharacterImage);
        if (this.items.length) {
            this.selectedSource = "inventory";
            this.selectedIndex = 0;
            this.selectedSlot = null;
        }
        else if (this.equipment.length) {
            this.selectedSource = "equipment";
            this.selectedIndex = null;
            this.selectedSlot = this.equipment[0].Slot;
        }
        else {
            this.selectedSource = "inventory";
            this.selectedIndex = null;
            this.selectedSlot = null;
        }
        this.Render();
    },
    SetCharacterImage: function (image) {
        if (!this.character)
            return;
        this.character.src = this.ImagePath(image || this.defaultCharacterImage);
    },
    NormalizeEquipment: function (source) {
        var result = [];
        var self = this;
        if (Array.isArray(source)) {
            for (var i = 0; i < source.length; i++) {
                var entry = source[i];
                if (!entry)
                    continue;
                var item = self.Get(entry, "Item", "item") || entry;
                var slot = self.Get(entry, "Slot", "slot");
                if (slot === undefined || slot === null || slot === "")
                    slot = self.Get(item, "Slot", "slot");
                if (slot === undefined || slot === null || slot === "")
                    slot = self.SlotFromIndex(i);
                slot = self.SlotKey(slot);
                if (slot)
                    result.push({ Slot: slot, Item: item });
            }
            return result;
        }
        if (source && typeof source === "object")
            Object.keys(source).forEach(function (slot) {
                var item = source[slot];
                var key = self.SlotKey(slot);
                if (item && key)
                    result.push({ Slot: key, Item: item });
            });
        return result;
    },
    Render: function () {
        this.RenderEquipment();
        this.RenderItems();
        this.RenderDetails();
        this.RenderWeight();
        this.SetText("inventory-items-count", this.ItemsCountText(this.items.length));
    },
    RenderWeight: function () {
        var weight = document.getElementById("inventory-weight");
        var fill = document.getElementById("inventory-weight-fill");
        var percent = this.maxWeight > 0 ? (this.currentWeight / this.maxWeight) * 100 : 0;
        percent = Math.max(0, Math.min(percent, 100));
        if (weight)
            weight.textContent = this.FormatWeight(this.currentWeight) + " / " + this.FormatWeight(this.maxWeight) + " кг";
        if (fill) {
            fill.style.width = percent + "%";
            fill.classList.toggle("warning", percent >= 80 && percent < 100);
            fill.classList.toggle("full", percent >= 100);
        }
    },
    RenderEquipment: function () {
        var self = this;
        var slots = document.querySelectorAll("[data-equipment-slot]");
        slots.forEach(function (button) {
            var slot = self.SlotKey(button.getAttribute("data-equipment-slot"));
            var item = self.EquipmentItem(slot);
            var image = button.querySelector(".equipment-slot-image");
            var title = item
                ? self.Get(item, "Title", "title") || self.Get(item, "Name", "name") || self.SlotName(slot)
                : self.SlotName(slot) + " — порожньо";
            button.classList.toggle("occupied", !!item);
            button.classList.toggle("active", self.selectedSource === "equipment" && self.selectedSlot === slot);
            button.setAttribute("title", title);
            if (image) {
                if (item)
                    image.innerHTML = self.ImageHtml(self.ImagePath(self.Get(item, "Image", "image")));
                else
                    image.innerHTML = self.EmptySlotIcon();
            }
        });
    },
    RenderItems: function () {
        if (!this.grid)
            return;
        this.grid.innerHTML = "";
        if (this.empty)
            this.empty.style.display = this.items.length ? "none" : "flex";
        this.grid.style.display = this.items.length ? "grid" : "none";
        for (var i = 0; i < this.items.length; i++)
            this.grid.appendChild(this.CreateItem(this.items[i], i));
    },
    CreateItem: function (item, index) {
        var self = this;
        var title = this.Get(item, "Title", "title") || this.Get(item, "Name", "name") || "Предмет";
        var count = this.Get(item, "Count", "count");
        var weight = this.ItemWeight(item);
        var image = this.ImagePath(this.Get(item, "Image", "image"));
        var button = document.createElement("button");
        button.type = "button";
        button.className = "inventory-item";
        if (this.selectedSource === "inventory" && this.selectedIndex === index)
            button.classList.add("active");
        var countHtml = Number(count) > 1
            ? '<span class="inventory-item-count">x' + this.Escape(count) + '</span>'
            : '';
        var weightHtml = weight !== undefined && weight !== null && weight !== ""
            ? '<span class="inventory-item-weight">' + this.Escape(this.FormatWeight(weight)) + ' кг</span>'
            : '';
        button.innerHTML =
            countHtml +
                weightHtml +
                '<span class="inventory-item-image">' + this.ImageHtml(image) + '</span>' +
                '<strong class="inventory-item-name">' + this.Escape(title) + '</strong>';
        button.onclick = function () {
            self.SelectItem(index);
        };
        return button;
    },
    SelectItem: function (index) {
        if (index < 0 || index >= this.items.length)
            return;
        this.selectedSource = "inventory";
        this.selectedIndex = index;
        this.selectedSlot = null;
        this.RenderEquipment();
        this.RenderItems();
        this.RenderDetails();
    },
    SelectEquipment: function (slot) {
        slot = this.SlotKey(slot);
        if (!slot)
            return;
        this.selectedSource = "equipment";
        this.selectedIndex = null;
        this.selectedSlot = slot;
        this.RenderEquipment();
        this.RenderItems();
        this.RenderDetails();
    },
    SelectedItem: function () {
        if (this.selectedSource === "equipment")
            return this.EquipmentItem(this.selectedSlot);
        if (this.selectedIndex === null || this.selectedIndex < 0 || this.selectedIndex >= this.items.length)
            return null;
        return this.items[this.selectedIndex];
    },
    EquipmentItem: function (slot) {
        slot = this.SlotKey(slot);
        for (var i = 0; i < this.equipment.length; i++)
            if (this.equipment[i].Slot === slot)
                return this.equipment[i].Item;
        return null;
    },
    RenderDetails: function () {
        var item = this.SelectedItem();
        var image = document.getElementById("inventory-details-image");
        var params = document.getElementById("inventory-params");
        var countElement = document.getElementById("inventory-details-count");
        var detailsWeight = document.getElementById("inventory-details-weight");
        var use = document.getElementById("inventory-use");
        if (!item) {
            if (image) {
                image.removeAttribute("src");
                image.style.display = "none";
            }
            if (this.selectedSource === "equipment" && this.selectedSlot) {
                this.SetText("inventory-details-title", this.SlotName(this.selectedSlot));
                this.SetText("inventory-details-type", "Слот екіпірування");
                this.SetText("inventory-details-description", "Слот порожній. Одягніть сумісний предмет з інвентарю.");
            }
            else {
                this.SetText("inventory-details-title", "Оберіть предмет");
                this.SetText("inventory-details-type", "");
                this.SetText("inventory-details-description", "Оберіть предмет або слот екіпірування, щоб побачити детальну інформацію.");
            }
            if (countElement)
                countElement.style.display = "none";
            if (detailsWeight)
                detailsWeight.style.display = "none";
            if (params)
                params.innerHTML = '<div class="inventory-param-empty">Немає додаткових властивостей</div>';
            if (use) {
                use.disabled = true;
                use.style.display = "none";
            }
            this.RenderSellAction(null);
            this.RenderSplitAction(null);
            this.RenderDeleteAction(null);
            return;
        }
        var title = this.Get(item, "Title", "title") || this.Get(item, "Name", "name") || "Предмет";
        var description = this.Get(item, "Description", "description") || "Опис предмета відсутній.";
        var count = this.Get(item, "Count", "count");
        var itemWeight = this.ItemWeight(item);
        var imagePath = this.ImagePath(this.Get(item, "Image", "image"));
        if (image) {
            if (imagePath) {
                image.src = imagePath;
                image.style.display = "block";
            }
            else {
                image.removeAttribute("src");
                image.style.display = "none";
            }
        }
        this.SetText("inventory-details-title", title);
        this.SetText("inventory-details-type", this.ItemMetaText(item));
        this.SetText("inventory-details-description", description);
        if (detailsWeight) {
            if (this.HasWeight(itemWeight)) {
                detailsWeight.innerHTML = '<span>Вага предмета</span><strong>' + this.Escape(this.FormatWeight(itemWeight)) + ' кг</strong>';
                detailsWeight.style.display = "flex";
            }
            else {
                detailsWeight.innerHTML = "";
                detailsWeight.style.display = "none";
            }
        }
        if (countElement) {
            countElement.textContent = "x" + (count === undefined ? 1 : count);
            countElement.style.display = this.selectedSource === "inventory" && Number(count) > 1 ? "block" : "none";
        }
        this.RenderParams(item, params);
        this.RenderAction(item, use);
        this.RenderSellAction(item);
        this.RenderSplitAction(item);
        this.RenderDeleteAction(item);
    },
    RenderParams: function (item, target) {
        if (!target)
            return;
        target.innerHTML = "";
        var params = this.Get(item, "Params", "params") || this.Get(item, "ItemParams", "itemParams") || [];
        if (!Array.isArray(params) || !params.length) {
            target.innerHTML = '<div class="inventory-param-empty">Немає додаткових властивостей</div>';
            return;
        }
        for (var i = 0; i < params.length; i++) {
            var view = this.ParamView(params[i]);
            if (!view)
                continue;
            var row = document.createElement("div");
            row.className = "inventory-param";
            row.innerHTML =
                '<span class="inventory-param-main">' +
                    '<span class="inventory-param-icon inventory-param-icon-' + this.EscapeAttribute(view.Kind) + '">' + this.ParamIcon(view.Kind) + '</span>' +
                    '<span class="inventory-param-name">' + this.Escape(view.Title) + '</span>' +
                    '</span>' +
                    '<strong>' + this.Escape(view.Value) + '</strong>';
            target.appendChild(row);
        }
    },
    ParamView: function (param) {
        if (!param)
            return null;
        var directTitle = this.Get(param, "Title", "title");
        var directValue = this.Get(param, "Value", "value");
        if (directTitle !== undefined)
            return { Title: directTitle, Value: this.FormatValue(directValue), Kind: "default" };
        var recovery = this.Get(param, "Recovery", "recovery");
        var buff = this.Get(param, "Buff", "buff");
        var stat = this.Get(param, "Stat", "stat");
        var value = directValue;
        if (recovery !== undefined && recovery !== null)
            return { Title: this.RecoveryName(recovery), Value: this.FormatValue(value), Kind: this.RecoveryKey(recovery) };
        if (buff !== undefined && buff !== null) {
            if (typeof buff === "object") {
                stat = this.Get(buff, "Stat", "stat");
                value = this.Get(buff, "Value", "value");
            }
            var buffValue = stat === undefined ? buff : stat;
            return { Title: this.BuffName(buffValue), Value: this.FormatValue(value), Kind: this.BuffKey(buffValue) };
        }
        if (stat !== undefined && stat !== null)
            return { Title: this.BuffName(stat), Value: this.FormatValue(value), Kind: this.BuffKey(stat) };
        return null;
    },
    RenderAction: function (item, use) {
        if (!use)
            return;
        var action = this.ActionView(item);
        var text = document.getElementById("inventory-use-text");
        use.style.display = action.Visible ? "flex" : "none";
        use.disabled = !action.Enabled;
        if (text)
            text.textContent = action.Title;
    },
    ActionView: function (item) {
        if (this.selectedSource === "equipment")
            return { Title: "Зняти", Visible: true, Enabled: !!item };
        var type = this.Get(item, "Type", "type");
        if (type === undefined || type === null || type === "")
            return { Title: "Використати", Visible: true, Enabled: true };
        type = String(type).toLowerCase();
        if (type === "0" || type === "consumable")
            return { Title: "Використати", Visible: true, Enabled: true };
        if (type === "1" || type === "equipment")
            return { Title: "Одягнути", Visible: true, Enabled: true };
        return { Title: "", Visible: false, Enabled: false };
    },
    ItemMetaText: function (item) {
        var type = this.Get(item, "Type", "type");
        var params = this.Get(item, "Params", "params") || this.Get(item, "ItemParams", "itemParams") || [];
        var hasHunger = false;
        if (Array.isArray(params))
            for (var i = 0; i < params.length; i++) {
                var recovery = this.Get(params[i], "Recovery", "recovery");
                if (recovery === 2 || String(recovery).toLowerCase() === "hunger") {
                    hasHunger = true;
                    break;
                }
            }
        if (type === undefined || type === null || type === "")
            return hasHunger ? "Їжа • Витратний предмет" : "Витратний предмет";
        type = String(type).toLowerCase();
        if (type === "0" || type === "consumable")
            return hasHunger ? "Їжа • Витратний предмет" : "Витратний предмет";
        if (type === "1" || type === "equipment") {
            var slot = this.selectedSource === "equipment" ? this.selectedSlot : this.ItemSlot(item);
            return slot ? "Екіпірування • " + this.SlotName(slot) : "Екіпірування";
        }
        return "Інший предмет";
    },
    ItemSlot: function (item) {
        var slot = this.Get(item, "Slot", "slot");
        if (slot === undefined || slot === null || slot === "")
            slot = this.Get(item, "EquipmentSlot", "equipmentSlot");
        return this.SlotKey(slot);
    },
    SlotKey: function (value) {
        if (value === undefined || value === null || value === "")
            return null;
        var keys = {
            0: "Head",
            1: "Face",
            2: "Hand",
            3: "Back",
            4: "Body",
            5: "ShoulderMount",
            head: "Head",
            face: "Face",
            hand: "Hand",
            back: "Back",
            body: "Body",
            shoulder: "ShoulderMount",
            shouldermount: "ShoulderMount"
        };
        var key = typeof value === "number" ? value : String(value).toLowerCase();
        return keys[key] || null;
    },
    SlotFromIndex: function (index) {
        return ["Head", "Face", "Hand", "Back", "Body", "ShoulderMount"][index] || null;
    },
    SlotName: function (value) {
        var names = {
            Head: "Голова",
            Face: "Обличчя",
            Hand: "Рука",
            Back: "Спина",
            Body: "Тіло",
            ShoulderMount: "Плече"
        };
        return names[this.SlotKey(value)] || "Екіпірування";
    },
    RecoveryKey: function (value) {
        var keys = {
            0: "health",
            1: "armor",
            2: "hunger",
            Health: "health",
            Armor: "armor",
            Hunger: "hunger"
        };
        return keys[value] || "default";
    },
    BuffKey: function (value) {
        var keys = {
            0: "stamina",
            Stamina: "stamina"
        };
        return keys[value] || "default";
    },
    ParamIcon: function (kind) {
        var icons = {
            health: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"></path></svg>',
            armor: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z"></path></svg>',
            hunger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v7M4 3v4c0 2 1 3 3 3s3-1 3-3V3M7 10v11M16 3v18M16 3c3 2 4 5 4 8h-4"></path></svg>',
            stamina: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z"></path></svg>',
            weight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h8l3 12H5L8 8Z"></path><path d="M9 8a3 3 0 0 1 6 0"></path></svg>',
            default: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path></svg>'
        };
        return icons[kind] || icons.default;
    },
    EmptySlotIcon: function () {
        return '<svg class="equipment-slot-empty-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v10M7 12h10"></path></svg>';
    },
    EnsureDeleteUi: function () {
        var details = document.getElementById("inventory-details");
        var use = document.getElementById("inventory-use");
        if (details && use && !document.getElementById("inventory-delete")) {
            var actions = document.createElement("div");
            actions.className = "inventory-actions";
            use.parentNode.insertBefore(actions, use);
            actions.appendChild(use);

            var sell = document.createElement("button");
            sell.type = "button";
            sell.className = "inventory-sell";
            sell.id = "inventory-sell";
            sell.innerHTML =
                '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M4 7h16"></path>' +
                    '<path d="M7 12h10"></path>' +
                    '<path d="M9 17h6"></path>' +
                    '<path d="M12 4v16"></path>' +
                '</svg>' +
                '<span>Продати</span>';
            actions.appendChild(sell);

            var split = document.createElement("button");
            split.type = "button";
            split.className = "inventory-split";
            split.id = "inventory-split";
            split.innerHTML =
                '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M8 7h8"></path>' +
                    '<path d="M8 17h8"></path>' +
                    '<path d="m6 4-3 3 3 3"></path>' +
                    '<path d="m18 14 3 3-3 3"></path>' +
                '</svg>' +
                '<span>Розділити</span>';
            actions.appendChild(split);

            var remove = document.createElement("button");
            remove.type = "button";
            remove.className = "inventory-delete";
            remove.id = "inventory-delete";
            remove.innerHTML =
                '<svg viewBox="0 0 24 24" aria-hidden="true">' +
                    '<path d="M4 7h16"></path>' +
                    '<path d="M9 7V4h6v3"></path>' +
                    '<path d="M7 7l1 13h8l1-13"></path>' +
                    '<path d="M10 11v5M14 11v5"></path>' +
                '</svg>' +
                '<span>Видалити</span>';
            actions.appendChild(remove);
        }

        var panel = this.screen ? this.screen.querySelector(".inventory-panel") : null;
        if (!panel)
            return;

        if (!document.getElementById("inventory-sell-dialog")) {
            var sellDialog = document.createElement("div");
            sellDialog.className = "inventory-delete-dialog inventory-sell-dialog";
            sellDialog.id = "inventory-sell-dialog";
            sellDialog.innerHTML =
                '<div class="inventory-delete-card inventory-sell-card">' +
                    '<span class="inventory-delete-kicker inventory-sell-kicker">ПРОДАЖ ПРЕДМЕТА</span>' +
                    '<h3 id="inventory-sell-title">Продати предмет?</h3>' +
                    '<p>Вкажіть ID гравця, кількість та загальну ціну.</p>' +
                    '<div class="inventory-sell-fields">' +
                        '<label class="inventory-sell-field">' +
                            '<span>ID гравця</span>' +
                            '<input id="inventory-sell-player" type="number" min="0" value="0" inputmode="numeric">' +
                        '</label>' +
                        '<div class="inventory-delete-quantity" id="inventory-sell-quantity">' +
                            '<span>Кількість</span>' +
                            '<div class="inventory-delete-stepper">' +
                                '<button type="button" id="inventory-sell-minus">−</button>' +
                                '<input id="inventory-sell-amount" type="number" min="1" value="1" inputmode="numeric">' +
                                '<button type="button" id="inventory-sell-plus">+</button>' +
                            '</div>' +
                        '</div>' +
                        '<label class="inventory-sell-field">' +
                            '<span>Ціна</span>' +
                            '<input id="inventory-sell-price" type="number" min="1" value="1" inputmode="numeric">' +
                        '</label>' +
                    '</div>' +
                    '<div class="inventory-delete-dialog-actions">' +
                        '<button type="button" class="inventory-delete-cancel" id="inventory-sell-cancel">Скасувати</button>' +
                        '<button type="button" class="inventory-sell-confirm" id="inventory-sell-confirm">Надіслати</button>' +
                    '</div>' +
                '</div>';
            panel.appendChild(sellDialog);
        }

        if (!document.getElementById("inventory-split-dialog")) {
            var splitDialog = document.createElement("div");
            splitDialog.className = "inventory-delete-dialog inventory-split-dialog";
            splitDialog.id = "inventory-split-dialog";
            splitDialog.innerHTML =
                '<div class="inventory-delete-card inventory-split-card">' +
                    '<span class="inventory-delete-kicker inventory-split-kicker">РОЗДІЛЕННЯ СТАКУ</span>' +
                    '<h3 id="inventory-split-title">Розділити предмети?</h3>' +
                    '<p>Оберіть кількість предметів для нового стаку.</p>' +
                    '<div class="inventory-delete-quantity">' +
                        '<span>Кількість</span>' +
                        '<div class="inventory-delete-stepper">' +
                            '<button type="button" id="inventory-split-minus">−</button>' +
                            '<input id="inventory-split-amount" type="number" min="1" value="1" inputmode="numeric">' +
                            '<button type="button" id="inventory-split-plus">+</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="inventory-delete-dialog-actions">' +
                        '<button type="button" class="inventory-delete-cancel" id="inventory-split-cancel">Скасувати</button>' +
                        '<button type="button" class="inventory-split-confirm" id="inventory-split-confirm">Розділити</button>' +
                    '</div>' +
                '</div>';
            panel.appendChild(splitDialog);
        }

        if (!document.getElementById("inventory-delete-dialog")) {
            var dialog = document.createElement("div");
            dialog.className = "inventory-delete-dialog";
            dialog.id = "inventory-delete-dialog";
            dialog.innerHTML =
                '<div class="inventory-delete-card">' +
                    '<span class="inventory-delete-kicker">ВИДАЛЕННЯ ПРЕДМЕТА</span>' +
                    '<h3 id="inventory-delete-title">Видалити предмет?</h3>' +
                    '<p id="inventory-delete-description">Предмет буде видалено з інвентарю.</p>' +
                    '<div class="inventory-delete-quantity" id="inventory-delete-quantity">' +
                        '<span>Кількість</span>' +
                        '<div class="inventory-delete-stepper">' +
                            '<button type="button" id="inventory-delete-minus">−</button>' +
                            '<input id="inventory-delete-amount" type="number" min="1" value="1" inputmode="numeric">' +
                            '<button type="button" id="inventory-delete-plus">+</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="inventory-delete-dialog-actions">' +
                        '<button type="button" class="inventory-delete-cancel" id="inventory-delete-cancel">Скасувати</button>' +
                        '<button type="button" class="inventory-delete-confirm" id="inventory-delete-confirm">Видалити</button>' +
                    '</div>' +
                '</div>';
            panel.appendChild(dialog);
        }
    },
    RenderSellAction: function (item) {
        var sell = document.getElementById("inventory-sell");
        if (!sell)
            return;
        var visible = this.selectedSource === "inventory" && !!item;
        sell.style.display = visible ? "flex" : "none";
        sell.disabled = !visible;
    },
    SellSelected: function () {
        var item = this.SelectedItem();
        if (!item || this.selectedSource !== "inventory")
            return;
        if (this.selectedIndex === null || this.selectedIndex < 0 || this.selectedIndex >= this.items.length)
            return;

        var count = Number(this.Get(item, "Count", "count")) || 1;
        var dialog = document.getElementById("inventory-sell-dialog");
        var amount = document.getElementById("inventory-sell-amount");
        var quantity = document.getElementById("inventory-sell-quantity");
        var player = document.getElementById("inventory-sell-player");
        var price = document.getElementById("inventory-sell-price");
        if (!dialog || !amount || !player || !price)
            return;

        var title = this.Get(item, "Title", "title") || this.Get(item, "Name", "name") || "Предмет";
        this.SetText("inventory-sell-title", title);
        amount.min = "1";
        amount.max = String(count);
        amount.value = "1";
        if (quantity)
            quantity.style.display = count > 1 ? "flex" : "none";
        player.value = "0";
        price.value = "1";
        dialog.classList.add("active");
        player.focus();
        player.select();
    },
    CloseSellDialog: function () {
        var dialog = document.getElementById("inventory-sell-dialog");
        if (dialog)
            dialog.classList.remove("active");
    },
    SellDialogOpen: function () {
        var dialog = document.getElementById("inventory-sell-dialog");
        return !!(dialog && dialog.classList.contains("active"));
    },
    ChangeSellAmount: function (delta) {
        var input = document.getElementById("inventory-sell-amount");
        if (!input)
            return;
        var value = Number(input.value) || 1;
        input.value = String(value + delta);
        this.ClampSellAmount();
    },
    ClampSellAmount: function () {
        var input = document.getElementById("inventory-sell-amount");
        if (!input)
            return 1;
        var min = Number(input.min) || 1;
        var max = Number(input.max) || min;
        var value = Math.floor(Number(input.value) || min);
        value = Math.max(min, Math.min(max, value));
        input.value = String(value);
        return value;
    },
    ConfirmSell: function () {
        if (!this.SellDialogOpen())
            return;

        var playerInput = document.getElementById("inventory-sell-player");
        var priceInput = document.getElementById("inventory-sell-price");
        if (!playerInput || !priceInput)
            return;

        var playerId = Math.floor(Number(playerInput.value));
        var price = Math.floor(Number(priceInput.value));
        if (!Number.isFinite(playerId) || playerId < 0) {
            playerInput.focus();
            return;
        }
        if (!Number.isFinite(price) || price <= 0) {
            priceInput.focus();
            return;
        }

        this.SendSell(playerId, this.ClampSellAmount(), price);
    },
    SendSell: function (playerId, count, price) {
        var item = this.SelectedItem();
        if (!item || this.selectedSource !== "inventory")
            return;

        var itemId = this.Get(item, "ItemId", "itemId");
        if (itemId === undefined)
            itemId = this.Get(item, "Id", "id");

        GameCef.sendJson("inventory:sell", {
            Index: this.selectedIndex,
            ItemId: itemId,
            Count: count,
            Price: price,
            PlayerId: playerId
        });

        this.CloseSellDialog();
    },
    RenderSplitAction: function (item) {
        var split = document.getElementById("inventory-split");
        if (!split)
            return;
        var count = Number(item ? this.Get(item, "Count", "count") : 0) || 0;
        var visible = this.selectedSource === "inventory" && !!item && count > 1;
        split.style.display = visible ? "flex" : "none";
        split.disabled = !visible;
    },
    SplitSelected: function () {
        var item = this.SelectedItem();
        if (!item || this.selectedSource !== "inventory")
            return;
        if (this.selectedIndex === null || this.selectedIndex < 0 || this.selectedIndex >= this.items.length)
            return;

        var count = Number(this.Get(item, "Count", "count")) || 0;
        if (count <= 1)
            return;

        var input = document.getElementById("inventory-split-amount");
        var dialog = document.getElementById("inventory-split-dialog");
        if (!dialog || !input)
            return;

        var title = this.Get(item, "Title", "title") || this.Get(item, "Name", "name") || "Предмет";
        this.SetText("inventory-split-title", title);
        input.min = "1";
        input.max = String(count - 1);
        input.value = "1";
        dialog.classList.add("active");
        input.focus();
        input.select();
    },
    CloseSplitDialog: function () {
        var dialog = document.getElementById("inventory-split-dialog");
        if (dialog)
            dialog.classList.remove("active");
    },
    SplitDialogOpen: function () {
        var dialog = document.getElementById("inventory-split-dialog");
        return !!(dialog && dialog.classList.contains("active"));
    },
    ChangeSplitAmount: function (delta) {
        var input = document.getElementById("inventory-split-amount");
        if (!input)
            return;
        var value = Number(input.value) || 1;
        input.value = String(value + delta);
        this.ClampSplitAmount();
    },
    ClampSplitAmount: function () {
        var input = document.getElementById("inventory-split-amount");
        if (!input)
            return 1;
        var min = Number(input.min) || 1;
        var max = Number(input.max) || min;
        var value = Math.floor(Number(input.value) || min);
        value = Math.max(min, Math.min(max, value));
        input.value = String(value);
        return value;
    },
    ConfirmSplit: function () {
        if (!this.SplitDialogOpen())
            return;
        this.SendSplit(this.ClampSplitAmount());
    },
    SendSplit: function (count) {
        var item = this.SelectedItem();
        if (!item || this.selectedSource !== "inventory")
            return;

        GameCef.sendJson("inventory:split", {
            Index: this.selectedIndex,
            Count: count
        });

        this.CloseSplitDialog();
    },
    RenderDeleteAction: function (item) {
        var remove = document.getElementById("inventory-delete");
        if (!remove)
            return;
        var visible = this.selectedSource === "inventory" && !!item;
        remove.style.display = visible ? "flex" : "none";
        remove.disabled = !visible;
    },
    DeleteSelected: function () {
        var item = this.SelectedItem();
        if (!item || this.selectedSource !== "inventory")
            return;
        if (this.selectedIndex === null || this.selectedIndex < 0 || this.selectedIndex >= this.items.length)
            return;

        var count = Number(this.Get(item, "Count", "count"));
        if (!count || count < 1)
            count = 1;

        this.OpenDeleteDialog(item, count);
    },
    OpenDeleteDialog: function (item, maxCount) {
        var dialog = document.getElementById("inventory-delete-dialog");
        var input = document.getElementById("inventory-delete-amount");
        var quantity = document.getElementById("inventory-delete-quantity");
        if (!dialog || !input)
            return;

        var title = this.Get(item, "Title", "title") || this.Get(item, "Name", "name") || "Предмет";
        this.SetText("inventory-delete-title", title);
        this.SetText(
            "inventory-delete-description",
            maxCount > 1
                ? "Оберіть кількість, яку потрібно видалити."
                : "Предмет буде видалено з інвентарю."
        );

        input.min = "1";
        input.max = String(maxCount);
        input.value = "1";
        if (quantity)
            quantity.style.display = maxCount > 1 ? "flex" : "none";

        dialog.classList.add("active");
        input.focus();
        input.select();
    },
    CloseDeleteDialog: function () {
        var dialog = document.getElementById("inventory-delete-dialog");
        if (dialog)
            dialog.classList.remove("active");
    },
    DeleteDialogOpen: function () {
        var dialog = document.getElementById("inventory-delete-dialog");
        return !!(dialog && dialog.classList.contains("active"));
    },
    ChangeDeleteAmount: function (delta) {
        var input = document.getElementById("inventory-delete-amount");
        if (!input)
            return;
        var value = Number(input.value) || 1;
        input.value = String(value + delta);
        this.ClampDeleteAmount();
    },
    ClampDeleteAmount: function () {
        var input = document.getElementById("inventory-delete-amount");
        if (!input)
            return 1;
        var min = Number(input.min) || 1;
        var max = Number(input.max) || min;
        var value = Math.floor(Number(input.value) || min);
        value = Math.max(min, Math.min(max, value));
        input.value = String(value);
        return value;
    },
    ConfirmDelete: function () {
        if (!this.DeleteDialogOpen())
            return;
        this.SendDelete(this.ClampDeleteAmount());
    },
    SendDelete: function (count) {
        var item = this.SelectedItem();
        if (!item || this.selectedSource !== "inventory")
            return;

        var itemId = this.Get(item, "ItemId", "itemId");
        if (itemId === undefined)
            itemId = this.Get(item, "Id", "id");

        GameCef.sendJson("inventory:delete", {
            Index: this.selectedIndex,
            ItemId: itemId,
            Count: count
        });

        this.CloseDeleteDialog();
    },
    UseSelected: function () {
        var item = this.SelectedItem();
        if (!item)
            return;
        if (this.selectedSource === "equipment") {
            GameCef.sendJson("inventory:unequip", {
                Slot: this.selectedSlot
            });
            return;
        }
        if (this.selectedIndex === null || this.selectedIndex < 0 || this.selectedIndex >= this.items.length)
            return;
        var itemId = this.Get(item, "ItemId", "itemId");
        var type = this.Get(item, "Type", "type");
        if (itemId === undefined)
            itemId = this.Get(item, "Id", "id");
        type = String(type === undefined ? "" : type).toLowerCase();
        if (type === "1" || type === "equipment") {
            GameCef.sendJson("inventory:equip", {
                Index: this.selectedIndex,
                ItemId: itemId,
                Slot: this.ItemSlot(item)
            });
            return;
        }
        GameCef.sendJson("inventory:use", {
            Index: this.selectedIndex,
            ItemId: itemId
        });
    },
    ImagePath: function (value) {
        if (!value)
            return "";
        value = String(value);
        if (value.indexOf("/") !== -1 || value.indexOf("data:") === 0 || value.indexOf("http://") === 0 || value.indexOf("https://") === 0)
            return value;
        return "./assets/CSS/Images/Inventory/" + value;
    },
    ImageHtml: function (path) {
        if (!path)
            return "";
        return '<img src="' + this.EscapeAttribute(path) + '" alt="">';
    },
    RecoveryName: function (value) {
        var names = {
            0: "Здоров'я",
            1: "Броня",
            2: "Голод",
            Health: "Здоров'я",
            Armor: "Броня",
            Hunger: "Голод"
        };
        return names[value] || String(value);
    },
    BuffName: function (value) {
        var names = {
            0: "Витривалість",
            Stamina: "Витривалість"
        };
        return names[value] || String(value === undefined ? "Параметр" : value);
    },
    FormatValue: function (value) {
        if (value === undefined || value === null || value === "")
            return "";
        var number = Number(value);
        if (!isNaN(number))
            return (number > 0 ? "+" : "") + number;
        return String(value);
    },
    ItemWeight: function (item) {
        var weight = this.Get(item, "Weight", "weight");
        if (weight !== undefined && weight !== null && weight !== "")
            return weight;
        var config = this.Get(item, "Config", "config") || this.Get(item, "ItemData", "itemData") || this.Get(item, "Data", "data");
        if (config)
            weight = this.Get(config, "Weight", "weight");
        return weight;
    },
    HasWeight: function (value) {
        return value !== undefined && value !== null && value !== "" && !isNaN(Number(value));
    },
    FormatWeight: function (value) {
        var number = Number(value);
        if (isNaN(number))
            number = 0;
        return number.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    },
    ItemsCountText: function (count) {
        if (count === 1)
            return "1 предмет";
        if (count >= 2 && count <= 4)
            return count + " предмети";
        return count + " предметів";
    },
    SetText: function (id, value) {
        var element = document.getElementById(id);
        if (element)
            element.textContent = value;
    },
    Get: function (object, pascal, camel) {
        if (!object)
            return undefined;
        if (object[pascal] !== undefined)
            return object[pascal];
        return object[camel];
    },
    Escape: function (value) {
        var div = document.createElement("div");
        div.textContent = value === undefined || value === null ? "" : String(value);
        return div.innerHTML;
    },
    EscapeAttribute: function (value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    },
    Parse: function (data) {
        if (typeof data !== "string")
            return data;
        try {
            var parsed = JSON.parse(data);
            if (typeof parsed === "string")
                parsed = JSON.parse(parsed);
            return parsed;
        }
        catch (error) {
            return null;
        }
    }
};
var inventoryBuffer = "";

GameCef.on("inventory:show", function (data) {
    Inventory.Show(data);
});

GameCef.on("inventory:set", function (data) {
    Inventory.SetData(data);
});

GameCef.on("inventory:set-begin", function () {
    inventoryBuffer = "";
});

GameCef.on("inventory:set-chunk", function (data) {
    inventoryBuffer += data || "";
});

GameCef.on("inventory:set-end", function () {
    Inventory.SetData(inventoryBuffer);
    inventoryBuffer = "";
});

GameCef.on("inventory:hide", function () {
    Inventory.Hide();
});
