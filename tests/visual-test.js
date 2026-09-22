(function () {
    "use strict";

    var views = [];
    var controls = null;
    var menu = null;
    var menuList = null;
    var initialized = false;
    var currentView = "";

    function receive(name, data) {
        if (!window.GameCef || typeof GameCef.receive !== "function") return;
        GameCef.receive(name, typeof data === "string" ? data : JSON.stringify(data));
    }

    function hideById(id, activeClass) {
        var element = document.getElementById(id);
        if (!element) return;
        element.classList.remove(activeClass || "active", "opened", "closing");
        if (element.hasAttribute("aria-hidden")) element.setAttribute("aria-hidden", "true");
    }

    function hideEverything() {
        if (window.CefVisualTestHud && typeof window.CefVisualTestHud.restore === "function")
            window.CefVisualTestHud.restore();

        if (typeof Loading !== "undefined" && Loading.Hide) Loading.Hide();
        if (typeof Dialog !== "undefined" && Dialog.screen)
            Dialog.screen.classList.remove("active", "opened", "closing");
        if (typeof Tickets !== "undefined" && Tickets.Hide) Tickets.Hide();
        if (typeof AdminPanel !== "undefined" && AdminPanel.Hide) AdminPanel.Hide();
        if (typeof Notifications !== "undefined" && Notifications.Clear) Notifications.Clear();

        [
            "authorization", "registration", "spawn-selection", "error-screen",
            "statistics", "inventory", "main-menu", "tickets", "admin-panel"
        ].forEach(function (id) { hideById(id); });

        document.querySelectorAll("[data-cef-test-surface]").forEach(function (element) {
            element.classList.add("hidden");
        });
    }

    function register(id, label, show) {
        if (!id || typeof show !== "function")
            throw new Error("CefVisualTests.register requires id, label and show function");

        var existing = views.find(function (view) { return view.id === id; });
        if (existing) {
            existing.label = label || id;
            existing.show = show;
        } else {
            views.push({ id: id, label: label || id, show: show });
        }

        renderMenuItems();
    }

    function setActiveButton(id) {
        currentView = id || "";
        if (!menuList) return;
        menuList.querySelectorAll("button[data-view]").forEach(function (button) {
            button.classList.toggle("active", button.dataset.view === currentView);
        });
    }

    function show(id) {
        var view = views.find(function (item) { return item.id === id; });
        if (!view) return false;

        hideEverything();
        setActiveButton(id);
        setMenuOpen(false);
        view.show(api);
        return true;
    }

    function setControlsVisible(visible) {
        if (!controls && visible) createControls();
        if (controls) controls.style.display = visible ? "flex" : "none";
        if (!visible) setMenuOpen(false);
    }

    function setMenuOpen(open) {
        if (!menu && open) createControls();
        if (!menu) return;
        menu.classList.toggle("active", !!open);
        menu.setAttribute("aria-hidden", open ? "false" : "true");
        document.body.classList.toggle("cef-test-menu-open", !!open);
    }

    function toggleMenu() {
        setMenuOpen(!(menu && menu.classList.contains("active")));
    }

    function close(hideControls) {
        hideEverything();
        setActiveButton("");
        setMenuOpen(false);
        if (hideControls) setControlsVisible(false);
    }

    function open(id) {
        init(false);
        setControlsVisible(true);

        var target = id || "gallery";
        var shown = show(target);
        if (!shown && views.length) shown = show(views[0].id);

        // The general /uitest entry point opens the selector immediately.
        if (!id || target === "gallery" || target === "menu")
            setMenuOpen(true);

        return shown;
    }

    function renderMenuItems() {
        if (!menuList) return;
        menuList.innerHTML = "";

        views.forEach(function (view) {
            var button = document.createElement("button");
            button.type = "button";
            button.dataset.view = view.id;
            button.className = "cef-test-menu-item";

            var label = document.createElement("span");
            label.className = "cef-test-menu-label";
            label.textContent = view.label;

            var id = document.createElement("small");
            id.textContent = view.id;

            var arrow = document.createElement("b");
            arrow.textContent = "›";

            button.append(label, id, arrow);
            button.classList.toggle("active", view.id === currentView);
            menuList.appendChild(button);
        });
    }

    function createControls() {
        var wasHidden = controls && controls.style.display === "none";
        if (controls) controls.remove();
        if (menu) menu.remove();

        controls = document.createElement("div");
        controls.id = "cef-visual-test-controls";
        if (wasHidden) controls.style.display = "none";

        var menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className = "cef-test-menu-toggle";
        menuButton.innerHTML = '<span class="cef-test-menu-icon">☰</span><span>UI MENU</span>';
        menuButton.addEventListener("click", toggleMenu);

        var current = document.createElement("div");
        current.className = "cef-test-current";
        current.innerHTML = '<span>TEST MODE</span><small>PC / MOBILE</small>';

        var closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "cef-test-close";
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Закрити тест");
        closeButton.addEventListener("click", function () {
            if (window.CefInGameTests && window.CefInGameTests.active && typeof window.CefInGameTests.closeFromUi === "function") {
                window.CefInGameTests.closeFromUi();
                return;
            }
            close(false);
        });

        controls.append(menuButton, current, closeButton);
        document.body.appendChild(controls);

        menu = document.createElement("aside");
        menu.id = "cef-visual-test-menu";
        menu.setAttribute("aria-hidden", "true");
        menu.innerHTML = `
            <div class="cef-test-menu-head">
                <div>
                    <span>CEF TEST MODE</span>
                    <strong>Вибір інтерфейсу</strong>
                </div>
                <button class="cef-test-menu-x" type="button" aria-label="Закрити меню">×</button>
            </div>
            <div class="cef-test-menu-hint">Оберіть UI для перевірки. Список можна прокручувати колесом або свайпом.</div>
            <div class="cef-test-menu-list"></div>
            <div class="cef-test-menu-foot">Реальні серверні дії під час тесту заблоковані.</div>`;

        menu.querySelector(".cef-test-menu-x").addEventListener("click", function () {
            setMenuOpen(false);
        });

        menuList = menu.querySelector(".cef-test-menu-list");
        menuList.addEventListener("click", function (event) {
            var button = event.target.closest("button[data-view]");
            if (button) show(button.dataset.view);
        });

        document.body.appendChild(menu);
        renderMenuItems();
    }

    function init(autoShowGallery) {
        initialized = true;
        createControls();

        if (autoShowGallery !== false) {
            setTimeout(function () {
                if (views.some(function (view) { return view.id === "gallery"; })) {
                    show("gallery");
                    setMenuOpen(true);
                }
            }, 20);
        }
    }

    var api = {
        register: register,
        show: show,
        open: open,
        close: close,
        init: init,
        receive: receive,
        hideEverything: hideEverything,
        hideById: hideById,
        setToolbarVisible: setControlsVisible, // backwards compatibility
        setControlsVisible: setControlsVisible,
        setMenuOpen: setMenuOpen,
        toggleMenu: toggleMenu,
        get views() { return views.slice(); },
        get currentView() { return currentView; }
    };

    window.CefVisualTests = api;

    function autoInit() {
        if (window.__CEF_IN_GAME_TEST_BOOTSTRAP__) return;
        init(true);
    }

    if (document.readyState === "loading")
        window.addEventListener("DOMContentLoaded", autoInit);
    else
        autoInit();
})();
