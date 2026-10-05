(function () {
    "use strict";

    var Tests = window.CefVisualTests;
    if (!Tests) throw new Error("visual-test.js must be loaded before cases.js");

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

    Tests.register("quick-menu", "Quick Menu / Vehicle", function () {
        Tests.receive("quick-menu:show", {
            MenuId: "vehicle",
            CloseOnSelect: false,
            Items: [
                { Id: 1, Text: "Двигун", Icon: "engine", Status: "Увімкнено", Active: true },
                { Id: 2, Text: "Фари", Icon: "lights", Status: "Увімкнено", Active: true },
                { Id: 3, Text: "Багажник", Icon: "trunk", Status: "Закрито", Active: false },
                { Id: 4, Text: "Двері", Icon: "doors", Status: "Закрито", Active: false }
            ]
        });
    });

    Tests.register("quick-menu-many", "Quick Menu / Many", function () {
        var items = [];
        var icons = ["engine", "lights", "trunk", "doors", "lock", "key", "car", "repair", "fuel", "settings"];

        for (var i = 1; i <= 20; i++) {
            items.push({
                Id: i,
                Text: "Тестова дія " + i,
                Icon: icons[(i - 1) % icons.length],
                Status: i % 3 === 0 ? "Активно" : "",
                Active: i % 3 === 0,
                Visible: i <= 12
            });
        }

        Tests.receive("quick-menu:show", {
            MenuId: "test-many",
            CloseOnSelect: false,
            Items: items
        });
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
                Period: "Останні 14 днів",
                Days: [
                    { day: "25.09", onlineMinutes: 185, closed: 9 },
                    { day: "24.09", onlineMinutes: 240, closed: 14 },
                    { day: "23.09", onlineMinutes: 155, closed: 8 },
                    { day: "22.09", onlineMinutes: 210, closed: 11 },
                    { day: "21.09", onlineMinutes: 175, closed: 6 },
                    { day: "20.09", onlineMinutes: 260, closed: 13 },
                    { day: "19.09", onlineMinutes: 90, closed: 4 },
                    { day: "18.09", onlineMinutes: 195, closed: 10 },
                    { day: "17.09", onlineMinutes: 225, closed: 12 },
                    { day: "16.09", onlineMinutes: 145, closed: 7 },
                    { day: "15.09", onlineMinutes: 205, closed: 9 },
                    { day: "14.09", onlineMinutes: 180, closed: 8 },
                    { day: "13.09", onlineMinutes: 235, closed: 15 },
                    { day: "12.09", onlineMinutes: 160, closed: 5 }
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

    function inventoryEquipmentTestData(equipped) {
        var armor = {
            ItemId: 2,
            Title: "Бронежилет",
            Count: 1,
            Image: "armor.webp",
            Type: "Equipment",
            Slot: "Body",
            Description: "Захисний бронежилет. Підвищує витривалість персонажа.",
            Params: [
                { Buff: "Stamina", Value: 5 }
            ]
        };

        return {
            CharacterImage: "./assets/CSS/Images/Inventory/equipment-character-default-transparent.webp",
            Items: [
                {
                    Index: 0,
                    ItemId: 1,
                    Title: "Яблуко",
                    Count: 5,
                    Image: "apple.webp",
                    Type: "Consumable",
                    Description: "Свіже яблуко. Трохи втамовує голод.",
                    Params: [
                        { Recovery: "Hunger", Value: 10 }
                    ]
                }
            ].concat(equipped ? [] : [Object.assign({ Index: 1 }, armor)]),
            Equipment: equipped
                ? [{ Slot: "Body", Item: armor }]
                : []
        };
    }

    Tests.register("inventory", "Inventory", function () {
        var inventoryData = inventoryEquipmentTestData(false);

        Tests.receive("inventory:set", inventoryData);
        Tests.receive("inventory:show", {});

        setTimeout(function () {
            if (typeof Inventory === "undefined" || (Inventory.items && Inventory.items.length))
                return;

            Inventory.SetData(inventoryData);
            Inventory.Show();
        }, 0);
    });

    Tests.register("inventory-equipped", "Inventory / Equipment", function () {
        var inventoryData = inventoryEquipmentTestData(true);

        Tests.receive("inventory:set", inventoryData);
        Tests.receive("inventory:show", {});

        setTimeout(function () {
            if (typeof Inventory === "undefined")
                return;

            Inventory.SetData(inventoryData);
            Inventory.SelectEquipment("Body");
            Inventory.Show();
        }, 0);
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
        forceHudPlatform(false);
        Tests.receive("hud:update", hudTestData());
        Tests.receive("hud:show", "");
    });

    Tests.register("hud-mobile", "HUD Mobile", function () {
        forceHudPlatform(true);
        Tests.receive("hud:update", hudTestData());
        Tests.receive("hud:show", "");
    });

    Tests.register("speedometer", "Speedometer", function () {
        if (window.Speedometer) {
            Speedometer.Show({
                speed: 97,
                gear: 3,
                fuel: 65,
                fuelMax: 80,
                lights: true,
                doors: true,
                engine: false
            });
        }
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
