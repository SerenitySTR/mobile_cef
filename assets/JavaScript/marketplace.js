var Marketplace = {
    screen: null,
    listings: [],
    inventory: [],
    Init: function () {
        this.screen = document.getElementById("marketplace");
        if (!this.screen)
            return;
        this.Bind();
    },
    Bind: function () {
        if (!this.screen || this.screen.getAttribute("data-bound") === "1")
            return;
        this.screen.setAttribute("data-bound", "1");
        var self = this;
        var close = document.getElementById("marketplace-close");
        var refresh = document.getElementById("marketplace-refresh");
        var search = document.getElementById("marketplace-search");
        var sort = document.getElementById("marketplace-sort");
        var itemSelect = document.getElementById("marketplace-sell-item");
        var count = document.getElementById("marketplace-sell-count");
        var price = document.getElementById("marketplace-sell-price");
        var minus = document.getElementById("marketplace-count-minus");
        var plus = document.getElementById("marketplace-count-plus");
        var create = document.getElementById("marketplace-create");
        if (close)
            close.onclick = function () { self.Hide(); GameCef.sendJson("marketplace:close", {}); };
        if (refresh)
            refresh.onclick = function () { GameCef.sendJson("marketplace:refresh", {}); };
        if (search)
            search.oninput = function () { self.RenderListings(); };
        if (sort)
            sort.onchange = function () { self.RenderListings(); };
        if (itemSelect)
            itemSelect.onchange = function () { self.RenderSell(); };
        if (count)
            count.oninput = function () { self.NormalizeCount(); self.RenderSellSummary(); };
        if (price)
            price.oninput = function () { self.RenderSellSummary(); };
        if (minus)
            minus.onclick = function () { self.ChangeCount(-1); };
        if (plus)
            plus.onclick = function () { self.ChangeCount(1); };
        if (create)
            create.onclick = function () { self.CreateListing(); };
        this.screen.addEventListener("click", function (event) {
            var buy = event.target.closest("[data-marketplace-buy]");
            if (buy) {
                GameCef.sendJson("marketplace:buy", { ListingId: Number(buy.getAttribute("data-marketplace-buy")) || buy.getAttribute("data-marketplace-buy") });
            }
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
        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Focus(this.screen);
        if (typeof Loading !== "undefined" && Loading.Hide)
            Loading.Hide();
    },
    Hide: function () {
        this.Init();
        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Release(this.screen);
        if (this.screen) {
            this.screen.classList.remove("active");
            this.screen.setAttribute("aria-hidden", "true");
        }
    },
    SetData: function (data) {
        this.Init();
        data = this.Parse(data);
        if (!data)
            return;
        var listings = this.Get(data, "Listings", "listings");
        var inventory = this.Get(data, "Inventory", "inventory");
        if (Array.isArray(listings))
            this.listings = listings;
        if (Array.isArray(inventory))
            this.inventory = inventory;
        this.Render();
    },
    SetListings: function (data) {
        data = this.Parse(data);
        if (data && Array.isArray(data.Listings || data.listings))
            this.listings = data.Listings || data.listings;
        else if (Array.isArray(data))
            this.listings = data;
        this.RenderListings();
    },
    SetInventory: function (data) {
        data = this.Parse(data);
        if (data && Array.isArray(data.Inventory || data.inventory))
            this.inventory = data.Inventory || data.inventory;
        else if (Array.isArray(data))
            this.inventory = data;
        this.RenderInventoryOptions();
        this.RenderSell();
    },
    Render: function () {
        this.RenderListings();
        this.RenderInventoryOptions();
        this.RenderSell();
    },
    RenderListings: function () {
        var root = document.getElementById("marketplace-listings");
        var empty = document.getElementById("marketplace-empty");
        if (!root)
            return;
        var search = document.getElementById("marketplace-search");
        var sort = document.getElementById("marketplace-sort");
        var query = search ? String(search.value || "").toLowerCase().trim() : "";
        var order = sort ? sort.value : "newest";
        var self = this;
        var visible = this.listings.filter(function (item) {
            var title = String(self.Get(item, "Title", "title") || "").toLowerCase();
            return !query || title.indexOf(query) !== -1;
        });
        visible.sort(function (a, b) {
            var pa = Number(self.Get(a, "Price", "price")) || 0;
            var pb = Number(self.Get(b, "Price", "price")) || 0;
            if (order === "price-asc")
                return pa - pb;
            if (order === "price-desc")
                return pb - pa;
            return (Number(self.Get(b, "Id", "id")) || 0) - (Number(self.Get(a, "Id", "id")) || 0);
        });
        root.innerHTML = "";
        for (var i = 0; i < visible.length; i++)
            root.appendChild(this.CreateCard(visible[i]));
        root.style.display = visible.length ? "grid" : "none";
        if (empty)
            empty.classList.toggle("active", !visible.length);
        this.SetText("marketplace-listings-count", String(visible.length));
    },
    CreateCard: function (item) {
        var id = this.Get(item, "Id", "id");
        var title = this.Get(item, "Title", "title") || "Предмет";
        var image = this.Get(item, "Image", "image") || "";
        var count = Number(this.Get(item, "Count", "count")) || 1;
        var price = Number(this.Get(item, "Price", "price")) || 0;
        var seller = this.Get(item, "SellerName", "sellerName") || "Гравець";
        var created = this.Get(item, "CreatedAt", "createdAt") || "";
        var card = document.createElement("article");
        card.className = "marketplace-card";
        card.innerHTML =
            '<div class="marketplace-card-image">' + this.Image(image, title) + '</div>' +
                '<strong class="marketplace-card-name">' + this.Escape(title) + '</strong>' +
                '<div class="marketplace-card-meta"><span>x' + this.Escape(count) + '</span><span>' + this.Escape(created) + '</span></div>' +
                '<div class="marketplace-card-price">' + this.Money(price) + '</div>' +
                '<div class="marketplace-card-bottom"><span class="marketplace-card-seller">' + this.Escape(seller) + '</span><button class="marketplace-buy" type="button" data-marketplace-buy="' + this.EscapeAttribute(id) + '">Купити</button></div>';
        return card;
    },
    RenderInventoryOptions: function () {
        var select = document.getElementById("marketplace-sell-item");
        if (!select)
            return;
        var current = select.value;
        select.innerHTML = "";
        if (!this.inventory.length) {
            var empty = document.createElement("option");
            empty.value = "";
            empty.textContent = "Немає предметів";
            select.appendChild(empty);
            return;
        }
        for (var i = 0; i < this.inventory.length; i++) {
            var item = this.inventory[i];
            var option = document.createElement("option");
            option.value = String(i);
            option.textContent = (this.Get(item, "Title", "title") || "Предмет") + " ×" + (Number(this.Get(item, "Count", "count")) || 1);
            select.appendChild(option);
        }
        if (current !== "" && Number(current) < this.inventory.length)
            select.value = current;
    },
    SelectedInventoryItem: function () {
        var select = document.getElementById("marketplace-sell-item");
        if (!select || select.value === "")
            return null;
        var index = Number(select.value);
        return this.inventory[index] || null;
    },
    RenderSell: function () {
        var item = this.SelectedInventoryItem();
        var image = document.getElementById("marketplace-sell-image");
        var fallback = document.getElementById("marketplace-sell-fallback");
        var count = document.getElementById("marketplace-sell-count");
        var create = document.getElementById("marketplace-create");
        if (!item) {
            this.SetText("marketplace-sell-title", "Оберіть предмет");
            this.SetText("marketplace-sell-weight", "");
            this.SetText("marketplace-sell-available", "Доступно: 0");
            if (image) {
                image.removeAttribute("src");
                image.style.display = "none";
            }
            if (fallback)
                fallback.style.display = "block";
            if (count) {
                count.value = 1;
                count.max = 1;
            }
            if (create)
                create.disabled = true;
            this.RenderSellSummary();
            return;
        }
        var title = this.Get(item, "Title", "title") || "Предмет";
        var path = this.ImagePath(this.Get(item, "Image", "image") || "");
        var available = Math.max(1, Number(this.Get(item, "Count", "count")) || 1);
        var weight = Number(this.Get(item, "Weight", "weight"));
        this.SetText("marketplace-sell-title", title);
        this.SetText("marketplace-sell-weight", isNaN(weight) ? "" : ("Вага: " + this.FormatWeight(weight) + " кг"));
        this.SetText("marketplace-sell-available", "Доступно: " + available);
        if (count) {
            count.max = available;
            if ((Number(count.value) || 1) > available)
                count.value = available;
        }
        if (image) {
            if (path) {
                image.src = path;
                image.style.display = "block";
                image.onerror = function () { this.style.display = "none"; if (fallback)
                    fallback.style.display = "block"; };
            }
            else {
                image.removeAttribute("src");
                image.style.display = "none";
            }
        }
        if (fallback)
            fallback.style.display = path ? "none" : "block";
        if (create)
            create.disabled = false;
        this.RenderSellSummary();
    },
    NormalizeCount: function () {
        var input = document.getElementById("marketplace-sell-count");
        var item = this.SelectedInventoryItem();
        if (!input || !item)
            return;
        var max = Math.max(1, Number(this.Get(item, "Count", "count")) || 1);
        var value = Math.max(1, Math.min(max, Number(input.value) || 1));
        input.value = value;
    },
    ChangeCount: function (delta) {
        var input = document.getElementById("marketplace-sell-count");
        if (!input)
            return;
        input.value = (Number(input.value) || 1) + delta;
        this.NormalizeCount();
        this.RenderSellSummary();
    },
    RenderSellSummary: function () {
        var count = document.getElementById("marketplace-sell-count");
        var price = document.getElementById("marketplace-sell-price");
        var create = document.getElementById("marketplace-create");
        var total = Math.max(0, Number(count && count.value) || 0) * Math.max(0, Number(price && price.value) || 0);
        this.SetText("marketplace-sell-total", this.Money(total));
        if (create)
            create.disabled = !this.SelectedInventoryItem() || !(Number(price && price.value) > 0) || !(Number(count && count.value) > 0);
    },
    CreateListing: function () {
        var item = this.SelectedInventoryItem();
        if (!item)
            return;
        var select = document.getElementById("marketplace-sell-item");
        var count = document.getElementById("marketplace-sell-count");
        var price = document.getElementById("marketplace-sell-price");
        var amount = Math.max(1, Number(count && count.value) || 1);
        var value = Math.max(0, Number(price && price.value) || 0);
        if (!value)
            return;
        GameCef.sendJson("marketplace:create", {
            Index: Number(select.value),
            ItemId: this.Get(item, "ItemId", "itemId"),
            Count: amount,
            Price: value
        });
    },
    Get: function (object, pascal, camel) {
        if (!object)
            return undefined;
        if (object[pascal] !== undefined)
            return object[pascal];
        return object[camel];
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
        catch (_) {
            return null;
        }
    },
    SetText: function (id, value) { var element = document.getElementById(id); if (element)
        element.textContent = value; },
    Money: function (value) { return "$" + (Number(value) || 0).toLocaleString("en-US").replace(/,/g, " "); },
    FormatWeight: function (value) { var number = Number(value) || 0; return number.toFixed(number < 1 ? 2 : number % 1 ? 1 : 0).replace(/0+$/, " ").trim().replace(/\.$/, ""); },
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
        return path ? '<img src="' + this.EscapeAttribute(path) + '" alt="' + this.EscapeAttribute(title) + '">' : '<span class="marketplace-card-fallback">□</span>';
    },
    Escape: function (value) { var div = document.createElement("div"); div.textContent = value === undefined || value === null ? "" : String(value); return div.innerHTML; },
    EscapeAttribute: function (value) { return this.Escape(value).replace(/`/g, "&#96;"); }
};
GameCef.on("marketplace:show", function (data) { Marketplace.Show(data); });
GameCef.on("marketplace:hide", function () { Marketplace.Hide(); });
GameCef.on("marketplace:set", function (data) { Marketplace.SetData(data); });
GameCef.on("marketplace:listings", function (data) { Marketplace.SetListings(data); });
GameCef.on("marketplace:inventory", function (data) { Marketplace.SetInventory(data); });
Marketplace.Init();
