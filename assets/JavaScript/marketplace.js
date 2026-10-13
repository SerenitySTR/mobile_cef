var Marketplace = {
    screen: null,
    listings: [],
    myListings: [],
    myListingsCount: 0,
    inventory: [],
    page: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 12,
    filterTimer: null,
    buyListing: null,
    pendingCreate: null,
    commissionPercent: 0,
    commissionFixed: 0,
    listingDurationHours: 24,
    chunkEvent: "",
    chunkBuffer: "",

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
        var managerOpen = document.getElementById("marketplace-my-button");
        var managerClose = document.getElementById("marketplace-manager-close");
        var refresh = document.getElementById("marketplace-refresh");
        var myRefresh = document.getElementById("marketplace-my-refresh");
        var search = document.getElementById("marketplace-search");
        var sort = document.getElementById("marketplace-sort");
        var prev = document.getElementById("marketplace-page-prev");
        var next = document.getElementById("marketplace-page-next");
        var itemSelect = document.getElementById("marketplace-sell-item");
        var count = document.getElementById("marketplace-sell-count");
        var price = document.getElementById("marketplace-sell-price");
        var minus = document.getElementById("marketplace-count-minus");
        var plus = document.getElementById("marketplace-count-plus");
        var create = document.getElementById("marketplace-create");
        var createConfirmClose = document.getElementById("marketplace-create-confirm-close");
        var createConfirmCancel = document.getElementById("marketplace-create-confirm-cancel");
        var createConfirmSubmit = document.getElementById("marketplace-create-confirm-submit");
        var buyClose = document.getElementById("marketplace-buy-close");
        var buyCancel = document.getElementById("marketplace-buy-cancel");
        var buyConfirm = document.getElementById("marketplace-buy-confirm");
        var buyCount = document.getElementById("marketplace-buy-count");
        var buyMinus = document.getElementById("marketplace-buy-minus");
        var buyPlus = document.getElementById("marketplace-buy-plus");

        if (close)
            close.onclick = function () {
                self.Hide();
                GameCef.sendJson("marketplace:close", {});
            };

        if (managerOpen)
            managerOpen.onclick = function () { self.OpenManager(true); };

        if (managerClose)
            managerClose.onclick = function () { self.CloseManager(); };

        if (refresh)
            refresh.onclick = function () {
                GameCef.sendJson("marketplace:refresh", self.PageRequest(self.page));
            };

        if (myRefresh)
            myRefresh.onclick = function () {
                GameCef.sendJson("marketplace:manage", {});
            };

        if (search) {
            search.oninput = function () {
                self.RenderListings();
                self.SchedulePageRequest();
            };

            search.onkeydown = function (event) {
                if (event.key !== "Enter")
                    return;

                event.preventDefault();
                self.RequestPage(1);
            };
        }

        if (sort)
            sort.onchange = function () {
                self.RenderListings();
                self.RequestPage(1);
            };

        if (prev)
            prev.onclick = function () { self.RequestPage(self.page - 1); };

        if (next)
            next.onclick = function () { self.RequestPage(self.page + 1); };

        if (itemSelect)
            itemSelect.onchange = function () { self.RenderSell(); };

        if (count)
            count.oninput = function () {
                self.NormalizeCount();
                self.RenderSellSummary();
            };

        if (price)
            price.oninput = function () { self.RenderSellSummary(); };

        if (minus)
            minus.onclick = function () { self.ChangeCount(-1); };

        if (plus)
            plus.onclick = function () { self.ChangeCount(1); };

        if (create)
            create.onclick = function () { self.CreateListing(); };

        if (createConfirmClose)
            createConfirmClose.onclick = function () { self.CloseCreateConfirm(); };

        if (createConfirmCancel)
            createConfirmCancel.onclick = function () { self.CloseCreateConfirm(); };

        if (createConfirmSubmit)
            createConfirmSubmit.onclick = function () { self.ConfirmCreateListing(); };

        if (buyClose)
            buyClose.onclick = function () { self.CloseBuy(); };

        if (buyCancel)
            buyCancel.onclick = function () { self.CloseBuy(); };

        if (buyConfirm)
            buyConfirm.onclick = function () { self.ConfirmBuy(); };

        if (buyCount)
            buyCount.oninput = function () {
                self.NormalizeBuyCount();
                self.RenderBuyTotal();
            };

        if (buyMinus)
            buyMinus.onclick = function () { self.ChangeBuyCount(-1); };

        if (buyPlus)
            buyPlus.onclick = function () { self.ChangeBuyCount(1); };

        this.screen.addEventListener("click", function (event) {
            var buy = event.target.closest("[data-marketplace-buy]");
            if (buy && !buy.disabled) {
                self.OpenBuy(Number(buy.getAttribute("data-marketplace-buy")) || 0);
                return;
            }

            var remove = event.target.closest("[data-marketplace-remove]");
            if (remove) {
                var removeRequest = self.PageRequest(self.page);
                removeRequest.ListingId = Number(remove.getAttribute("data-marketplace-remove")) || 0;
                GameCef.sendJson("marketplace:remove", removeRequest);
                return;
            }

            var pageButton = event.target.closest("[data-marketplace-page]");
            if (pageButton) {
                self.RequestPage(Number(pageButton.getAttribute("data-marketplace-page")) || 1);
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat || event.key !== "Escape")
                return;

            if (!self.screen || !self.screen.classList.contains("active"))
                return;

            var createConfirmModal = document.getElementById("marketplace-create-confirm-modal");
            if (createConfirmModal && createConfirmModal.classList.contains("active")) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.CloseCreateConfirm();
                return;
            }

            var buyModal = document.getElementById("marketplace-buy-modal");
            if (buyModal && buyModal.classList.contains("active")) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.CloseBuy();
                return;
            }

            var manager = document.getElementById("marketplace-manager");
            if (manager && manager.classList.contains("active")) {
                event.preventDefault();
                event.stopImmediatePropagation();
                self.CloseManager();
                return;
            }

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
        this.CloseCreateConfirm();
        this.CloseBuy();
        this.CloseManager();

        if (typeof UiKeyboard !== "undefined")
            UiKeyboard.Release(this.screen);

        if (this.screen) {
            this.screen.classList.remove("active");
            this.screen.setAttribute("aria-hidden", "true");
        }
    },

    OpenManager: function (emit) {
        this.Init();

        var manager = document.getElementById("marketplace-manager");
        if (!manager)
            return;

        this.RenderManager();
        manager.classList.add("active");
        manager.setAttribute("aria-hidden", "false");

        if (emit !== false)
            GameCef.sendJson("marketplace:manage", {});
    },

    CloseManager: function () {
        var manager = document.getElementById("marketplace-manager");
        if (!manager)
            return;

        manager.classList.remove("active");
        manager.setAttribute("aria-hidden", "true");
    },

    SetData: function (data) {
        this.Init();
        data = this.Parse(data);
        if (!data)
            return;

        this.ApplySettings(data);

        var listings = this.Get(data, "Listings", "listings");
        var myListings = this.Get(data, "MyListings", "myListings");
        var inventory = this.Get(data, "Inventory", "inventory");
        var myListingsCount = Number(this.Get(data, "MyListingsCount", "myListingsCount"));

        if (Array.isArray(listings))
            this.listings = listings.slice(0, this.pageSize);

        if (Array.isArray(myListings))
            this.myListings = myListings;

        if (Array.isArray(inventory))
            this.inventory = inventory;

        if (myListingsCount >= 0 && !Number.isNaN(myListingsCount))
            this.myListingsCount = myListingsCount;

        this.ApplyPageMeta(data);
        this.Render();
    },

    SetListings: function (data) {
        data = this.Parse(data);
        if (!data)
            return;

        this.ApplySettings(data);

        var listings = this.Get(data, "Listings", "listings");
        var myListingsCount = Number(this.Get(data, "MyListingsCount", "myListingsCount"));

        if (myListingsCount >= 0 && !Number.isNaN(myListingsCount))
            this.myListingsCount = myListingsCount;

        if (Array.isArray(listings))
            this.listings = listings.slice(0, this.pageSize);
        else if (Array.isArray(data))
            this.listings = data.slice(0, this.pageSize);

        this.ApplyPageMeta(data);
        this.RenderListings();
        this.RenderPagination();
        this.RenderHeaderBadge();
    },

    SetMyListings: function (data) {
        data = this.Parse(data);
        if (!data)
            return;

        this.ApplySettings(data);

        var listings = this.Get(data, "MyListings", "myListings");

        if (Array.isArray(listings))
            this.myListings = listings;
        else if (Array.isArray(data))
            this.myListings = data;

        this.myListingsCount = this.myListings.length;

        this.RenderManager();
        this.RenderHeaderBadge();
    },

    SetInventory: function (data) {
        data = this.Parse(data);
        if (!data)
            return;

        this.ApplySettings(data);

        var inventory = this.Get(data, "Inventory", "inventory");

        if (Array.isArray(inventory))
            this.inventory = inventory;
        else if (Array.isArray(data))
            this.inventory = data;

        this.RenderInventoryOptions();
        this.RenderSell();
    },

    ApplyPageMeta: function (data) {
        if (!data || Array.isArray(data))
            return;

        var page = Number(this.Get(data, "Page", "page"));
        var totalPages = Number(this.Get(data, "TotalPages", "totalPages"));
        var totalCount = Number(this.Get(data, "TotalCount", "totalCount"));

        if (page > 0)
            this.page = page;

        if (totalPages > 0)
            this.totalPages = totalPages;
        else
            this.totalPages = Math.max(1, Math.ceil((totalCount || this.listings.length) / this.pageSize));

        if (totalCount >= 0 && !Number.isNaN(totalCount))
            this.totalCount = totalCount;
        else
            this.totalCount = this.listings.length;

        if (this.page > this.totalPages)
            this.page = this.totalPages;
    },

    Render: function () {
        this.RenderListings();
        this.RenderPagination();
        this.RenderHeaderBadge();
        this.RenderManager();
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
            if (!query)
                return true;

            var title = String(self.Get(item, "Title", "title") || "").toLowerCase();
            var seller = String(self.Get(item, "SellerName", "sellerName") || "").toLowerCase();

            return title.indexOf(query) !== -1 || seller.indexOf(query) !== -1;
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

        this.SetText("marketplace-listings-count", String(this.totalCount || visible.length));
    },

    CreateCard: function (item) {
        var id = Number(this.Get(item, "Id", "id")) || 0;
        var title = this.Get(item, "Title", "title") || "Предмет";
        var image = this.Get(item, "Image", "image") || "";
        var count = Number(this.Get(item, "Count", "count")) || 1;
        var price = Number(this.Get(item, "Price", "price")) || 0;
        var seller = this.Get(item, "SellerName", "sellerName") || "Гравець";
        var created = this.Get(item, "CreatedAt", "createdAt") || "";
        var isOwn = !!this.Get(item, "IsOwn", "isOwn");
        var params = this.ParamsText(item, 2);
        var sellerText = "Продавець: " + seller;
        var card = document.createElement("article");

        card.className = "marketplace-card";
        card.innerHTML =
            '<div class="marketplace-card-image">' +
                this.Image(image, title) +
                '<span class="marketplace-card-count">×' + this.Escape(count) + '</span>' +
            '</div>' +
            '<strong class="marketplace-card-name">' + this.Escape(title) + '</strong>' +
            '<span class="marketplace-card-params">' + this.Escape(params) + '</span>' +
            '<div class="marketplace-card-seller">' + this.Escape(sellerText) + '</div>' +
            '<div class="marketplace-card-footer">' +
                '<div><strong>' + this.Money(price) + ' / шт.</strong><span>' + this.Escape(created) + '</span></div>' +
                '<button class="marketplace-buy" type="button" data-marketplace-buy="' + this.EscapeAttribute(id) + '"' + (isOwn ? ' disabled' : '') + '>' + (isOwn ? 'Ваше' : 'Купити') + '</button>' +
            '</div>';

        return card;
    },

    RenderPagination: function () {
        var pages = document.getElementById("marketplace-pages");
        var prev = document.getElementById("marketplace-page-prev");
        var next = document.getElementById("marketplace-page-next");
        if (!pages)
            return;

        var total = Math.max(1, this.totalPages || 1);
        var current = Math.min(Math.max(1, this.page || 1), total);
        var start = Math.max(1, current - 2);
        var end = Math.min(total, start + 4);

        start = Math.max(1, end - 4);
        pages.innerHTML = "";

        for (var page = start; page <= end; page++) {
            var button = document.createElement("button");
            button.type = "button";
            button.setAttribute("data-marketplace-page", String(page));
            button.textContent = String(page);
            button.classList.toggle("active", page === current);
            pages.appendChild(button);
        }

        if (prev)
            prev.disabled = current <= 1;

        if (next)
            next.disabled = current >= total;

        this.SetText("marketplace-page-info", "Сторінка " + current + " з " + total);
    },

    RequestPage: function (page) {
        page = Math.max(1, Math.min(Number(page) || 1, Math.max(1, this.totalPages || 1)));
        GameCef.sendJson("marketplace:page", this.PageRequest(page));
    },

    PageRequest: function (page) {
        var search = document.getElementById("marketplace-search");
        var sort = document.getElementById("marketplace-sort");

        return {
            Page: Number(page) || 1,
            Search: search ? String(search.value || "").trim() : "",
            Sort: sort ? String(sort.value || "newest") : "newest"
        };
    },

    SchedulePageRequest: function () {
        var self = this;

        if (this.filterTimer)
            clearTimeout(this.filterTimer);

        this.filterTimer = setTimeout(function () {
            self.filterTimer = null;
            self.RequestPage(1);
        }, 350);
    },

    RenderHeaderBadge: function () {
        this.SetText("marketplace-my-badge", this.myListingsCount);
    },

    RenderManager: function () {
        this.RenderOwnListings();
        this.RenderInventoryOptions();
        this.RenderSell();

        this.SetText("marketplace-manager-count", this.myListingsCount);
        this.SetText("marketplace-limit-text", "Без обмеження кількості оголошень.");
    },

    RenderOwnListings: function () {
        var root = document.getElementById("marketplace-own-list");
        var empty = document.getElementById("marketplace-own-empty");
        if (!root)
            return;

        root.innerHTML = "";

        for (var i = 0; i < this.myListings.length; i++)
            root.appendChild(this.CreateOwnCard(this.myListings[i]));

        root.style.display = this.myListings.length ? "grid" : "none";

        if (empty)
            empty.classList.toggle("active", !this.myListings.length);
    },

    CreateOwnCard: function (item) {
        var id = Number(this.Get(item, "Id", "id")) || 0;
        var title = this.Get(item, "Title", "title") || "Предмет";
        var image = this.Get(item, "Image", "image") || "";
        var count = Number(this.Get(item, "Count", "count")) || 1;
        var price = Number(this.Get(item, "Price", "price")) || 0;
        var created = this.Get(item, "CreatedAt", "createdAt") || "";
        var remaining = this.RemainingText(item);
        var params = this.ParamsText(item, 3);
        var card = document.createElement("article");

        card.className = "marketplace-own-card";
        card.innerHTML =
            '<div class="marketplace-own-image">' + this.Image(image, title) + '</div>' +
            '<div class="marketplace-own-info">' +
                '<div class="marketplace-own-title"><strong>' + this.Escape(title) + '</strong><span>×' + this.Escape(count) + '</span></div>' +
                '<span class="marketplace-own-params">' + this.Escape(params) + '</span>' +
                '<small class="marketplace-own-date">Виставлено: ' + this.Escape(created) + '</small>' +
                '<small class="marketplace-own-remaining' + (remaining.expired ? ' expired' : '') + '">' + this.Escape(remaining.text) + '</small>' +
            '</div>' +
            '<div class="marketplace-own-actions">' +
                '<strong>' + this.Money(price) + ' / шт.</strong>' +
                '<button type="button" data-marketplace-remove="' + this.EscapeAttribute(id) + '">Зняти</button>' +
            '</div>';

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
            this.SetText("marketplace-sell-params", "Без параметрів");
            this.SetText("marketplace-sell-available", "Доступно: 0");

            if (image) {
                image.removeAttribute("src");
                image.style.display = "none";
            }

            if (fallback)
                fallback.style.display = "flex";

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
        var itemImage = this.Get(item, "Image", "image") || "";
        var available = Math.max(1, Number(this.Get(item, "Count", "count")) || 1);
        var path = this.ImagePath(itemImage);

        this.SetText("marketplace-sell-title", title);
        this.SetText("marketplace-sell-params", this.ParamsText(item, 3));
        this.SetText("marketplace-sell-available", "Доступно: " + available);

        if (image) {
            if (path) {
                image.src = path;
                image.style.display = "block";
            }
            else {
                image.removeAttribute("src");
                image.style.display = "none";
            }
        }

        if (fallback)
            fallback.style.display = path ? "none" : "flex";

        if (count) {
            count.max = available;
            this.NormalizeCount();
        }

        if (create)
            create.disabled = false;

        this.RenderSellSummary();
    },

    NormalizeCount: function () {
        var item = this.SelectedInventoryItem();
        var input = document.getElementById("marketplace-sell-count");
        if (!input)
            return;

        var max = item ? Math.max(1, Number(this.Get(item, "Count", "count")) || 1) : 1;
        var value = Math.floor(Number(input.value) || 1);

        input.max = max;
        input.value = Math.max(1, Math.min(max, value));
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
        var item = this.SelectedInventoryItem();
        var price = document.getElementById("marketplace-sell-price");
        var create = document.getElementById("marketplace-create");
        var value = Math.max(0, Math.floor(Number(price ? price.value : 0) || 0));
        var countInput = document.getElementById("marketplace-sell-count");
        var itemCount = item ? Math.max(1, Number(this.Get(item, "Count", "count")) || 1) : 1;
        var selectedCount = Math.max(1, Math.min(itemCount, Math.floor(Number(countInput ? countInput.value : 1) || 1)));
        var canCreate = !!item && value > 0;

        this.SetText("marketplace-sell-total", this.Money(value * selectedCount));

        if (create)
            create.disabled = !canCreate;
    },

    CreateListing: function () {
        var item = this.SelectedInventoryItem();
        var count = document.getElementById("marketplace-sell-count");
        var price = document.getElementById("marketplace-sell-price");

        if (!item)
            return;

        var itemCount = Math.max(1, Number(this.Get(item, "Count", "count")) || 1);
        var valueCount = Math.max(1, Math.min(itemCount, Math.floor(Number(count ? count.value : 1) || 1)));
        var valuePrice = Math.floor(Number(price ? price.value : 0) || 0);

        if (valuePrice <= 0)
            return;

        var request = this.PageRequest(this.page);
        request.Index = Number(this.Get(item, "Index", "index")) || 0;
        request.ItemId = Number(this.Get(item, "ItemId", "itemId")) || 0;
        request.Count = valueCount;
        request.Price = valuePrice;

        this.OpenCreateConfirm(item, request);
    },

    OpenCreateConfirm: function (item, request) {
        if (!item || !request)
            return;

        this.pendingCreate = request;

        var title = this.Get(item, "Title", "title") || "Предмет";
        var image = this.Get(item, "Image", "image") || "";
        var path = this.ImagePath(image);
        var total = Math.max(0, request.Price * request.Count);
        var commission = this.Commission(total);
        var imageElement = document.getElementById("marketplace-create-confirm-image");
        var fallback = document.getElementById("marketplace-create-confirm-fallback");
        var modal = document.getElementById("marketplace-create-confirm-modal");

        this.SetText("marketplace-create-confirm-title", title);
        this.SetText("marketplace-create-confirm-params", this.ParamsText(item, 4));
        this.SetText("marketplace-create-confirm-count", "Кількість: " + request.Count);
        this.SetText("marketplace-create-confirm-price", this.Money(request.Price));
        this.SetText("marketplace-create-confirm-total", this.Money(total));
        this.SetText("marketplace-create-confirm-fee", this.Money(commission));
        this.SetText(
            "marketplace-create-confirm-fee-label",
            this.commissionPercent > 0 ? "Комісія " + this.TrimNumber(this.commissionPercent) + "%" : "Комісія"
        );
        this.SetText("marketplace-create-confirm-duration", this.listingDurationHours + " " + this.HoursWord(this.listingDurationHours));

        var note = document.querySelector(".marketplace-create-confirm-note");
        if (note)
            note.textContent = "Комісія списується одразу після виставлення предмета. Якщо предмет не буде продано, оголошення завершиться через " + this.listingDurationHours + " " + this.HoursWord(this.listingDurationHours) + ".";

        if (imageElement) {
            if (path) {
                imageElement.src = path;
                imageElement.style.display = "block";
            }
            else {
                imageElement.removeAttribute("src");
                imageElement.style.display = "none";
            }
        }

        if (fallback)
            fallback.style.display = path ? "none" : "flex";

        if (modal) {
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
        }
    },

    CloseCreateConfirm: function () {
        var modal = document.getElementById("marketplace-create-confirm-modal");

        if (modal) {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
        }

        this.pendingCreate = null;
    },

    ConfirmCreateListing: function () {
        if (!this.pendingCreate)
            return;

        var request = this.pendingCreate;
        this.pendingCreate = null;

        var modal = document.getElementById("marketplace-create-confirm-modal");
        if (modal) {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
        }

        GameCef.sendJson("marketplace:create", request);
    },

    OpenBuy: function (listingId) {
        var listing = null;

        for (var i = 0; i < this.listings.length; i++) {
            if ((Number(this.Get(this.listings[i], "Id", "id")) || 0) === listingId) {
                listing = this.listings[i];
                break;
            }
        }

        if (!listing || this.Get(listing, "IsOwn", "isOwn"))
            return;

        this.buyListing = listing;

        var title = this.Get(listing, "Title", "title") || "Предмет";
        var image = this.Get(listing, "Image", "image") || "";
        var seller = this.Get(listing, "SellerName", "sellerName") || "Гравець";
        var created = this.Get(listing, "CreatedAt", "createdAt") || "";
        var count = Math.max(1, Number(this.Get(listing, "Count", "count")) || 1);
        var path = this.ImagePath(image);
        var imageElement = document.getElementById("marketplace-buy-image");
        var fallback = document.getElementById("marketplace-buy-fallback");
        var countInput = document.getElementById("marketplace-buy-count");
        var modal = document.getElementById("marketplace-buy-modal");

        this.SetText("marketplace-buy-title", title);
        this.SetText("marketplace-buy-params", this.ParamsText(listing, 4));
        this.SetText("marketplace-buy-seller", "Продавець: " + seller);
        this.SetText("marketplace-buy-date", created);
        this.SetText("marketplace-buy-available", "Доступно: " + count);
        this.SetText("marketplace-buy-unit-price", this.Money(Number(this.Get(listing, "Price", "price")) || 0));

        if (imageElement) {
            if (path) {
                imageElement.src = path;
                imageElement.style.display = "block";
            }
            else {
                imageElement.removeAttribute("src");
                imageElement.style.display = "none";
            }
        }

        if (fallback)
            fallback.style.display = path ? "none" : "flex";

        if (countInput) {
            countInput.max = count;
            countInput.value = 1;
        }

        this.RenderBuyTotal();

        if (modal) {
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
        }
    },

    CloseBuy: function () {
        var modal = document.getElementById("marketplace-buy-modal");

        if (modal) {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
        }

        this.buyListing = null;
    },

    NormalizeBuyCount: function () {
        var input = document.getElementById("marketplace-buy-count");
        if (!input || !this.buyListing)
            return;

        var max = Math.max(1, Number(this.Get(this.buyListing, "Count", "count")) || 1);
        var value = Math.floor(Number(input.value) || 1);

        input.max = max;
        input.value = Math.max(1, Math.min(max, value));
    },

    ChangeBuyCount: function (delta) {
        var input = document.getElementById("marketplace-buy-count");
        if (!input || !this.buyListing)
            return;

        input.value = (Number(input.value) || 1) + delta;
        this.NormalizeBuyCount();
        this.RenderBuyTotal();
    },

    RenderBuyTotal: function () {
        if (!this.buyListing)
            return;

        this.NormalizeBuyCount();

        var input = document.getElementById("marketplace-buy-count");
        var count = Math.max(1, Math.floor(Number(input ? input.value : 1) || 1));
        var price = Math.max(0, Number(this.Get(this.buyListing, "Price", "price")) || 0);

        this.SetText("marketplace-buy-total", this.Money(price * count));
    },

    ConfirmBuy: function () {
        if (!this.buyListing)
            return;

        var input = document.getElementById("marketplace-buy-count");
        this.NormalizeBuyCount();

        var request = this.PageRequest(this.page);
        request.ListingId = Number(this.Get(this.buyListing, "Id", "id")) || 0;
        request.Count = Math.max(1, Math.floor(Number(input ? input.value : 1) || 1));

        GameCef.sendJson("marketplace:buy", request);
        this.CloseBuy();
    },

    ApplySettings: function (data) {
        if (!data || Array.isArray(data))
            return;

        var percentValue = this.Get(data, "CommissionPercent", "commissionPercent");
        if (percentValue === undefined || percentValue === null)
            percentValue = this.Get(data, "ListingCommissionPercent", "listingCommissionPercent");

        var fixedValue = this.Get(data, "CommissionFixed", "commissionFixed");
        if (fixedValue === undefined || fixedValue === null)
            fixedValue = this.Get(data, "ListingCommissionFixed", "listingCommissionFixed");

        var durationValue = this.Get(data, "ListingDurationHours", "listingDurationHours");
        if (durationValue === undefined || durationValue === null)
            durationValue = this.Get(data, "DurationHours", "durationHours");

        var percent = Number(percentValue);
        var fixed = Number(fixedValue);
        var duration = Number(durationValue);

        if (Number.isFinite(percent) && percent >= 0)
            this.commissionPercent = percent;

        if (Number.isFinite(fixed) && fixed >= 0)
            this.commissionFixed = fixed;

        if (Number.isFinite(duration) && duration > 0)
            this.listingDurationHours = duration;
    },

    Commission: function (total) {
        total = Math.max(0, Number(total) || 0);
        return Math.max(0, Math.ceil(total * this.commissionPercent / 100) + Math.floor(this.commissionFixed));
    },

    RemainingText: function (item) {
        var remaining = Number(this.Get(item, "RemainingHours", "remainingHours"));

        if (!Number.isFinite(remaining))
            remaining = Number(this.Get(item, "Time", "time"));

        if (!Number.isFinite(remaining))
            return { text: "", expired: false };

        remaining = Math.max(0, Math.floor(remaining));

        if (remaining <= 0)
            return { text: "Термін оголошення завершено", expired: true };

        return { text: "Залишилось: " + remaining + " год.", expired: false };
    },

    TrimNumber: function (value) {
        value = Number(value) || 0;
        return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
    },

    HoursWord: function (value) {
        value = Math.abs(Number(value) || 0);
        var mod10 = value % 10;
        var mod100 = value % 100;

        if (mod10 === 1 && mod100 !== 11)
            return "година";

        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
            return "години";

        return "годин";
    },

    ParamsText: function (item, limit) {
        var params = this.Get(item, "Params", "params") || this.Get(item, "ItemParams", "itemParams") || [];
        if (!Array.isArray(params) || !params.length)
            return "Без параметрів";

        var result = [];

        for (var i = 0; i < params.length; i++) {
            var text = this.ParamText(params[i]);
            if (text)
                result.push(text);
        }

        if (!result.length)
            return "Без параметрів";

        if (limit && result.length > limit)
            return result.slice(0, limit).join(" • ") + " • +" + (result.length - limit);

        return result.join(" • ");
    },

    ParamText: function (param) {
        if (!param)
            return "";

        var title = this.Get(param, "Title", "title");
        var value = Number(this.Get(param, "Value", "value")) || 0;

        if (title !== undefined && title !== null && title !== "")
            return String(title) + " " + this.Signed(value);

        var recovery = this.Get(param, "Recovery", "recovery");
        var buff = this.Get(param, "Buff", "buff");

        if (recovery !== undefined && recovery !== null) {
            var recoveryNames = {
                0: "Здоров'я",
                1: "Броня",
                2: "Голод",
                Health: "Здоров'я",
                Armor: "Броня",
                Hunger: "Голод"
            };

            return (recoveryNames[recovery] || "Параметр") + " " + this.Signed(value);
        }

        if (buff !== undefined && buff !== null) {
            var buffNames = {
                0: "Витривалість",
                Stamina: "Витривалість"
            };

            return (buffNames[buff] || "Ефект") + " " + this.Signed(value);
        }

        return "";
    },

    Signed: function (value) {
        value = Number(value) || 0;
        return (value > 0 ? "+" : "") + value;
    },

    SlotsWord: function (value) {
        value = Math.abs(Number(value) || 0);

        if (value === 1)
            return "місце";

        if (value >= 2 && value <= 4)
            return "місця";

        return "місць";
    },

    Parse: function (data) {
        if (data === undefined || data === null || data === "")
            return null;

        if (typeof data === "string") {
            try {
                return JSON.parse(data);
            }
            catch (error) {
                return null;
            }
        }

        return data;
    },

    Get: function (object, first, second) {
        if (!object)
            return undefined;

        if (Object.prototype.hasOwnProperty.call(object, first))
            return object[first];

        return object[second];
    },

    SetText: function (id, value) {
        var element = document.getElementById(id);
        if (element)
            element.textContent = value;
    },

    Money: function (value) {
        return "$" + (Number(value) || 0).toLocaleString("en-US").replace(/,/g, " ");
    },

    ImagePath: function (image) {
        image = String(image || "").trim();

        if (!image)
            return "";

        if (image.indexOf("/") !== -1 || image.indexOf("data:") === 0 || image.indexOf("http://") === 0 || image.indexOf("https://") === 0)
            return image;

        return "./assets/CSS/Images/Inventory/" + image;
    },

    Image: function (image, title) {
        var path = this.ImagePath(image);

        return path
            ? '<img src="' + this.EscapeAttribute(path) + '" alt="' + this.EscapeAttribute(title) + '">'
            : '<span class="marketplace-card-fallback">□</span>';
    },

    Escape: function (value) {
        var div = document.createElement("div");
        div.textContent = value === undefined || value === null ? "" : String(value);
        return div.innerHTML;
    },

    EscapeAttribute: function (value) {
        return this.Escape(value).replace(/`/g, "&#96;");
    }
};

GameCef.on("marketplace:show", function (data) { Marketplace.Show(data); });
GameCef.on("marketplace:hide", function () { Marketplace.Hide(); });
GameCef.on("marketplace:set", function (data) { Marketplace.SetData(data); });
GameCef.on("marketplace:listings", function (data) { Marketplace.SetListings(data); });
GameCef.on("marketplace:my-listings", function (data) { Marketplace.SetMyListings(data); });
GameCef.on("marketplace:inventory", function (data) { Marketplace.SetInventory(data); });
GameCef.on("marketplace:chunk-begin", function (eventName) {
    Marketplace.chunkEvent = String(eventName || "");
    Marketplace.chunkBuffer = "";
});
GameCef.on("marketplace:chunk", function (data) {
    Marketplace.chunkBuffer += String(data || "");
});
GameCef.on("marketplace:chunk-end", function () {
    var eventName = Marketplace.chunkEvent;
    var data = Marketplace.chunkBuffer;

    Marketplace.chunkEvent = "";
    Marketplace.chunkBuffer = "";

    if (eventName)
        GameCef.receive(eventName, data);
});

Marketplace.Init();
