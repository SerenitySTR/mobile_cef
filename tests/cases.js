(function () {
    "use strict";

    var Tests = window.CefVisualTests;
    if (!Tests) throw new Error("visual-test.js must be loaded before cases.js");

    function ensureGallery() {
        var section = document.getElementById("cef-visual-test-showcase");
        if (section) return section;

        section = document.createElement("section");
        section.id = "cef-visual-test-showcase";
        section.dataset.cefTestSurface = "gallery";
        section.innerHTML = `
            <div class="cef-test-card">
                <div class="cef-test-kicker">CEF LOCAL TEST</div>
                <h1>Новий стиль кнопок</h1>
                <p>Тестова папка <b>tests/</b> використовує реальні production CSS/JS. Тут можна перевіряти нові екрани без сервера.</p>
                <div class="cef-test-button-grid">
                    <button class="dialog-button dialog-button-primary" type="button">ПОЧАТИ ГРАТИ  ›</button>
                    <button class="dialog-button" type="button">ДІЗНАТИСЬ БІЛЬШЕ  ›</button>
                    <button class="dialog-button dialog-button-danger" type="button">НЕБЕЗПЕЧНА ДІЯ</button>
                    <button class="dialog-button" type="button">ТЕКСТОВА КНОПКА  ›</button>
                    <button class="dialog-button dialog-button-primary cef-test-wide" type="button">ПІДТВЕРДИТИ  ›</button>
                </div>
                <div class="cef-test-note">Для мобільної адаптації вистав viewport 1280×576 або 854×393. Новий тест додається одним <code>CefVisualTests.register(...)</code> у tests/cases.js.</div>
            </div>`;
        document.body.appendChild(section);
        return section;
    }

    function ticket(id, title, author, status, admin, messages) {
        return {
            Id: id,
            Title: title,
            PlayerName: author,
            CreatedAt: "22.09.2026 15:20",
            Status: status || "open",
            AdminName: admin || "",
            Messages: messages || []
        };
    }

    var originalHudMobilePlatform = document.body.classList.contains("hud-platform-mobile") || !!window.hudMobilePlatform;

    function hudTestData() {
        return {
            nickname: "Serenity_Walker",
            id: 12,
            time: "18:48",
            date: "22.09.2026",
            health: 92,
            armour: 68,
            hunger: 74,
            money: 128450,
            wanted: 2,
            weaponId: 31,
            ammoClip: 30,
            ammoTotal: 180
        };
    }

    function hideHudPreviews() {
        var mobileHud = document.getElementById("hud");
        var pcHud = document.getElementById("pc-hud");

        if (mobileHud) mobileHud.classList.remove("active");
        if (pcHud) {
            pcHud.classList.remove("active");
            pcHud.setAttribute("aria-hidden", "true");
        }
    }

    function forceHudPlatform(mobile) {
        document.body.classList.remove("hud-platform-pc", "hud-platform-mobile");
        document.body.classList.add(mobile ? "hud-platform-mobile" : "hud-platform-pc");
        window.hudMobilePlatform = !!mobile;
        hideHudPreviews();
    }

    function restoreHudPlatform() {
        hideHudPreviews();
        document.body.classList.remove("hud-platform-pc", "hud-platform-mobile");
        document.body.classList.add(originalHudMobilePlatform ? "hud-platform-mobile" : "hud-platform-pc");
        window.hudMobilePlatform = originalHudMobilePlatform;

        if (typeof updateHudMobileScale === "function")
            updateHudMobileScale();
    }

    window.CefVisualTestHud = {
        restore: restoreHudPlatform
    };

    Tests.register("gallery", "Кнопки", function () {
        ensureGallery().classList.remove("hidden");
    });

    Tests.register("authorization", "Login", function () {
        Tests.receive("authorization:show", "Test_Player");
    });

    Tests.register("registration1", "Reg 1", function () {
        Tests.receive("registration:show", "Test_Player");
    });

    Tests.register("registration2", "Reg 2", function () {
        Tests.receive("registration:show", "Test_Player");
        setTimeout(function () {
            var email = document.getElementById("email");
            var password = document.getElementById("password");
            var repeat = document.getElementById("password-repeat");
            if (email) email.value = "test@example.com";
            if (password) password.value = "123456";
            if (repeat) repeat.value = "123456";
            if (typeof showRegistrationStep === "function" && typeof step2 !== "undefined")
                showRegistrationStep(step2, false);
        }, 30);
    });

    Tests.register("spawn", "Spawn", function () {
        Tests.receive("spawn:show", { SelectedSpawn: 0 });
    });

    Tests.register("dialog", "Dialog", function () {
        Tests.receive("dialog:show", {
            DialogId: 9001,
            Type: "message",
            Icon: "i",
            Title: "Підтвердження дії",
            Text: "Перевірка стилю кнопок. Enter активує ліву кнопку, Escape — праву.",
            Buttons: [
                { Id: 1, Text: "Почати грати  ›", Type: "primary" },
                { Id: 0, Text: "Дізнатись більше  ›", Type: "default" }
            ]
        });
    });

    Tests.register("tickets", "Tickets", function () {
        var items = [
            ticket(1254, "Гравець застряг у текстурах", "Artem_Kovalenko", "open", "Admin_Name", [
                { Author: "Artem_Kovalenko", Text: "Добрий день, я застряг у текстурах, допоможіть будь ласка.", Time: "15:17", IsAdmin: false },
                { Author: "Admin_Name", Text: "Вітаю. Зараз допоможу, очікуйте.", Time: "15:18", IsAdmin: true }
            ]),
            ticket(1253, "Порушення правил чату", "Sanya_Petrov", "open", "", []),
            ticket(1252, "Питання щодо донату", "Diana_Lopez", "open", "", []),
            ticket(1251, "Баг з автомобілем", "Maksim_White", "closed", "Admin_Name", [])
        ];

        Tests.receive("ticket:show", { Tickets: items });
        setTimeout(function () {
            if (typeof Tickets !== "undefined") {
                Tickets.selectedId = 1254;
                Tickets.Render();
            }
        }, 20);
    });

    Tests.register("admin", "AdminPanel", function () {
        var data = {
            Profile: { Id: 101, PlayerId: 12, Name: "serenity", Role: "Адміністратор 4 рівня" },
            Admins: [
                { Id: 101, PlayerId: 12, Name: "serenity", Level: 4 },
                { Id: 102, PlayerId: 33, Name: "Alex_Rivera", Level: 3 },
                { Id: 103, PlayerId: 47, Name: "Diana_Lopez", Level: 2 }
            ],
            Tickets: [
                {
                    Id: 1254, PlayerId: 24, PlayerName: "Artem_Kovalenko", Subject: "Гравець застряг у текстурах",
                    Status: "open", AdminId: 101, AdminName: "serenity", WaitLabel: "2 хв",
                    Messages: [
                        { SenderName: "Artem_Kovalenko", Message: "Добрий день, я застряг у текстурах.", Time: "15:17", IsAdmin: false },
                        { SenderName: "serenity", Message: "Вітаю. Зараз допоможу.", Time: "15:18", IsAdmin: true }
                    ]
                },
                { Id: 1253, PlayerId: 35, PlayerName: "Sanya_Petrov", Subject: "Порушення правил чату", Status: "open", AdminId: null, WaitLabel: "5 хв", Messages: [] },
                { Id: 1252, PlayerId: 52, PlayerName: "Diana_Lopez", Subject: "Питання щодо донату", Status: "open", AdminId: 102, AdminName: "Alex_Rivera", WaitLabel: "12 хв", Messages: [] },
                { Id: 1251, PlayerId: 66, PlayerName: "Maksim_White", Subject: "Баг з автомобілем", Status: "closed", AdminId: 101, AdminName: "serenity", WaitLabel: "18 хв", Messages: [] }
            ],
            Stats: {
                Period: "Поточний тиждень",
                Days: [
                    { day: "Пн", onlineMinutes: 185, closed: 9 },
                    { day: "Вт", onlineMinutes: 240, closed: 14 },
                    { day: "Ср", onlineMinutes: 155, closed: 8 }
                ]
            },
            Commands: [
                { name: "/aheal", description: "Відновити здоров'я" },
                { name: "/mute", description: "Видати мут" },
                { name: "/fv", description: "Полагодити транспорт" }
            ],
            Punishments: [
                { rule: "DM", punishment: "WARN" },
                { rule: "Flood", punishment: "MUTE" }
            ],
            Locations: [
                { name: "Центр міста", command: "/tp ls" },
                { name: "Автосалон", command: "/tp autosalon" }
            ],
            Items: { Weapons: [], Vehicles: [], Skins: [], Organizations: [] }
        };

        if (typeof AdminPanel !== "undefined") {
            AdminPanel.Show(data);
            setTimeout(function () {
                AdminPanel.tab = "tickets";
                AdminPanel.filter = "mine";
                AdminPanel.selectedTicket = 1254;
                AdminPanel.chatOpen = true;
                AdminPanel.Render();
            }, 30);
        } else {
            Tests.receive("admin:show", data);
        }
    });

    Tests.register("inventory", "Inventory", function () {
        var burger = {
            Id: 1,
            Title: "Бургер",
            Category: "food",
            Icon: "food",
            Count: 3,
            Weight: 0.4,
            Description: "Ситний бургер. Відновлює голод персонажа.",
            Effects: [
                { Title: "Голод", Value: "+25" }
            ],
            CanUse: true
        };

        var water = {
            Id: 2,
            Title: "Вода",
            Category: "drink",
            Icon: "drink",
            Count: 5,
            Weight: 0.5,
            Description: "Пляшка чистої води.",
            Effects: [
                { Title: "Спрага", Value: "+30" }
            ],
            CanUse: true
        };

        var medkit = {
            Id: 3,
            Title: "Аптечка",
            Category: "medicine",
            Icon: "medicine",
            Count: 2,
            Weight: 0.8,
            Description: "Медичний набір для відновлення здоров'я.",
            Effects: [
                { Title: "Здоров'я", Value: "+50" }
            ],
            CanUse: true
        };

        var phone = {
            Id: 4,
            Title: "Телефон",
            Category: "other",
            Icon: "phone",
            Count: 1,
            Weight: 0.2,
            Description: "Особистий мобільний телефон.",
            CanUse: true
        };

        var materials = {
            Id: 5,
            Title: "Матеріали",
            Category: "materials",
            Icon: "tool",
            Count: 24,
            Weight: 2.4,
            Description: "Набір матеріалів для робіт та крафту.",
            CanUse: false
        };

        Tests.receive("inventory:show", {
            Items: [burger, water, medkit, phone, materials],
            Equipment: {
                backpack: { Title: "Міський рюкзак", Icon: "backpack" },
                body: { Title: "Одяг", Icon: "clothes" },
                feet: { Title: "Кросівки", Icon: "shoes" }
            },
            QuickSlots: [burger, water, medkit, null, phone],
            Weight: 12.7,
            MaxWeight: 50
        });

        setTimeout(function () {
            if (typeof Inventory !== "undefined") Inventory.SelectItem(1);
        }, 20);
    });

    Tests.register("statistics", "Statistics", function () {
        Tests.receive("statistics:show", {
            Profile: {
                Name: "Serenity_Walker",
                Id: 10482,
                Level: 17,
                Online: true,
                Items: [
                    { Icon: "family", Title: "Сім'я", Value: "ANTARES" },
                    { Icon: "faction", Title: "Організація", Value: "LSPD" },
                    { Icon: "job", Title: "Робота", Value: "Механік" }
                ]
            },
            Status: [
                { Id: "health", Title: "Здоров'я", Value: 92, Max: 100 },
                { Id: "armor", Title: "Броня", Value: 54, Max: 100 },
                { Id: "hunger", Title: "Голод", Value: 68, Max: 100 },
                { Id: "stamina", Title: "Витривалість", Value: 76, Max: 100 }
            ],
            Statistics: [
                { Icon: "clock", Title: "Час у грі", Value: "148 год." },
                { Icon: "money", Title: "Готівка", Value: "$128 450" },
                { Icon: "reputation", Title: "Репутація", Value: "356" },
                { Icon: "wanted", Title: "Розшук", Value: "0" },
                { Icon: "vip", Title: "VIP", Value: "Gold" },
                { Icon: "phone", Title: "Телефон", Value: "555-0198" }
            ],
            Skills: [
                { Icon: "skill", Title: "Водіння", Value: 82, Max: 100 },
                { Icon: "skill", Title: "Стрільба", Value: 61, Max: 100 },
                { Icon: "skill", Title: "Витривалість", Value: 74, Max: 100 }
            ]
        });
    });

    Tests.register("mainmenu", "Main Menu", function () {
        Tests.receive("main-menu:show", {
            Profile: {
                Name: "Serenity_Walker",
                Id: 12,
                Level: 17
            }
        });
    });

    Tests.register("hud-pc", "HUD PC", function () {
        var data = hudTestData();
        forceHudPlatform(false);

        if (window.AntaresHUD) {
            AntaresHUD.update(data);
            AntaresHUD.show();
        }
    });

    Tests.register("hud-mobile", "HUD Mobile", function () {
        var data = hudTestData();
        forceHudPlatform(true);

        if (window.AntaresHUD)
            AntaresHUD.hide();

        if (typeof updateHud === "function")
            updateHud(data);

        var mobileHud = document.getElementById("hud");
        if (mobileHud) mobileHud.classList.add("active");

        if (typeof updateHudMobileScale === "function")
            updateHudMobileScale();
    });

    Tests.register("notifications", "Notify", function () {
        if (typeof Notifications === "undefined") return;
        Notifications.Toast({ Id: "test-success", Type: "Success", Title: "Успіх", Text: "Дію успішно виконано.", Duration: 15000 });
        Notifications.Toast({ Id: "test-info", Type: "Info", Title: "Інформація", Text: "Перевірка інформаційного повідомлення.", Duration: 15000 });
        Notifications.Toast({ Id: "test-warning", Type: "Warning", Title: "Попередження", Text: "Зверніть увагу на цю дію.", Duration: 15000 });
        Notifications.Toast({ Id: "test-error", Type: "Error", Title: "Помилка", Text: "Приклад повідомлення про помилку.", Duration: 15000 });
        Notifications.Banner({ Id: "test-banner", Type: "Info", Title: "Серверне повідомлення", Text: "Banner знаходиться по центру зверху.", Duration: 15000 });
    });

    Tests.register("reward", "Reward", function () {
        if (typeof Notifications !== "undefined")
            Notifications.Reward({ Id: "test-reward", Title: "Нагорода отримана", Text: "$25 000 + 500 XP", Subtext: "Щоденна нагорода", Duration: 15000 });
    });

    Tests.register("achievement", "Achievement", function () {
        if (typeof Notifications !== "undefined")
            Notifications.Achievement({ Id: "test-achievement", Title: "Досягнення відкрито", Text: "Перші кроки", Subtext: "+250 XP", Duration: 15000 });
    });

    Tests.register("bottom", "Bottom", function () {
        if (typeof Notifications !== "undefined")
            Notifications.Bottom({ Id: "test-bottom", Title: "Інформація", Text: "Нижнє інформаційне повідомлення.", Subtext: "SYSTEM", Duration: 15000 });
    });
})();
