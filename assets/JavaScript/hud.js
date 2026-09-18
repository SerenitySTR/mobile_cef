const pcHudFrame = document.getElementById("pc-hud-frame");

function isMobileHudPlatform() {
    const userAgent = navigator.userAgent || "";
    const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    const touchDevice = (navigator.maxTouchPoints || 0) > 1;
    const screenShortSide = Math.min(screen.width || innerWidth, screen.height || innerHeight);
    return mobileUserAgent || (touchDevice && screenShortSide <= 900);
}

const hudMobilePlatform = isMobileHudPlatform();
document.body.classList.add(hudMobilePlatform ? "hud-platform-mobile" : "hud-platform-pc");

function sendPcHud(type, data = null) {
    if (hudMobilePlatform || !pcHudFrame || !pcHudFrame.contentWindow) return;
    pcHudFrame.contentWindow.postMessage({ source: "antares-hud", type, data }, "*");
}

const hud = document.getElementById("hud");

const HUD_REFERENCE_WIDTH = 1280;
const HUD_REFERENCE_HEIGHT = 720;


function updateHudMobileScale() {
    const width = Math.max(1, window.innerWidth || document.documentElement.clientWidth);
    const height = Math.max(1, window.innerHeight || document.documentElement.clientHeight);
    const shortSide = Math.min(width, height);
    const isPhone = width <= 1400 || height <= 800 || shortSide <= 720;

    const fit = Math.min(width / HUD_REFERENCE_WIDTH, height / HUD_REFERENCE_HEIGHT);
    let scale = fit * (isPhone ? 0.56 : 0.82) * 1.05;
    scale = Math.max(isPhone ? 0.38 : 0.62, Math.min(isPhone ? 0.58 : 0.90, scale));

    hud.style.setProperty("--hud-scale", scale.toFixed(4), "important");

    const corner = document.getElementById("hud-corner-info");
    if (corner) {
        const cornerScale = Math.max(0.399, Math.min(0.567, scale * 0.90));
        corner.style.setProperty("transform", `scale(${cornerScale.toFixed(4)})`, "important");
        corner.style.setProperty("transform-origin", "bottom left", "important");
    }

    hud.classList.toggle("hud-compact", isPhone);
}

updateHudMobileScale();
window.addEventListener("resize", updateHudMobileScale, { passive: true });
window.addEventListener("orientationchange", () => setTimeout(updateHudMobileScale, 120));

const HUD_RING_LENGTH = 2 * Math.PI * 49;

const hudStats = {
    health: {
        ring: document.getElementById("hud-health-ring-perimeter") || document.getElementById("hud-health-ring"),
        value: document.getElementById("hud-health-value")
    },
    armour: {
        ring: document.getElementById("hud-armour-ring-perimeter") || document.getElementById("hud-armour-ring"),
        value: document.getElementById("hud-armour-value")
    },
    hunger: {
        ring: document.getElementById("hud-hunger-ring-perimeter") || document.getElementById("hud-hunger-ring"),
        value: document.getElementById("hud-hunger-value")
    }
};

const hudMoneyValue = document.getElementById("hud-money-value");
const hudIdValue = document.getElementById("hud-id-value");
const hudPlayerName = document.getElementById("hud-player-name");
const hudTimeValue = document.getElementById("hud-time-value");
const hudDateValue = document.getElementById("hud-date-value");
const hudAmmoClip = document.getElementById("hud-ammo-clip");
const hudAmmoTotal = document.getElementById("hud-ammo-total");
const hudWeaponImage = document.getElementById("hud-weapon-image");
const hudWanted = document.getElementById("hud-wanted");

const HUD_WEAPON_IMAGES = {
    0: "fist.webp",
    1: "brassknuckle.webp",
    2: "golfclub.webp",
    3: "nightstick.webp",
    4: "knife.webp",
    5: "bat.webp",
    6: "shovel.webp",
    7: "poolcue.webp",
    8: "katana.webp",
    9: "chainsaw.webp",
    10: "dildo1.webp",
    11: "dildo2.webp",
    12: "vibrator1.webp",
    13: "vibrator2.webp",
    14: "flowers.webp",
    15: "cane.webp",
    16: "grenade.webp",
    17: "teargas.webp",
    18: "molotov.webp",
    22: "colt45.webp",
    23: "silenced.webp",
    24: "deagle.webp",
    25: "shotgun.webp",
    26: "sawnoff.webp",
    27: "spas12.webp",
    28: "uzi.webp",
    29: "mp5.webp",
    30: "ak47.webp",
    31: "m4.webp",
    32: "tec9.webp",
    33: "rifle.webp",
    34: "sniper.webp",
    35: "rocketlauncher.webp",
    36: "heatseeker.webp",
    37: "flamethrower.webp",
    38: "minigun.webp",
    39: "satchel.webp",
    40: "detonator.webp",
    41: "spraycan.webp",
    42: "extinguisher.webp",
    43: "camera.webp",
    44: "nightvision.webp",
    45: "infrared.webp",
    46: "parachute.webp"
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function createWantedStars() {
    if (!hudWanted) {
        return;
    }

    hudWanted.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        star.setAttribute("viewBox", "0 0 24 24");
        star.classList.add("hud-wanted-star");
        star.innerHTML = '<path d="m12 2.2 3.02 6.12 6.76.98-4.89 4.77 1.15 6.73L12 17.62 5.96 20.8l1.15-6.73L2.22 9.3l6.76-.98L12 2.2Z"></path>';
        hudWanted.appendChild(star);
    }
}

function parseHudWanted(value) {
    if (value && typeof value === "object") {
        value = value.wanted ?? value.Wanted ?? value.wantedLevel ?? value.WantedLevel ?? value.level ?? value.Level;
    } else if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            try {
                return parseHudWanted(JSON.parse(trimmed));
            } catch {}
        }
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? clamp(Math.trunc(numeric), 0, 6) : null;
}

function updateHudWanted(value) {
    sendPcHud("update", { wanted: value });
    if (!hudWanted) {
        return;
    }

    const wanted = parseHudWanted(value);
    if (wanted === null) {
        return;
    }

    const stars = hudWanted.querySelectorAll(".hud-wanted-star");

    stars.forEach((star, index) => {
        star.classList.toggle("active", index < wanted);
    });
}

createWantedStars();

function updateHudWeapon(data) {
    if (data) sendPcHud("update", data);
    if (!data) {
        return;
    }

    const weaponId = Math.max(0, Math.trunc(Number(data.WeaponId !== undefined ? data.WeaponId : data.weaponId) || 0));
    const ammoClip = Math.max(0, Math.trunc(Number(data.AmmoClip !== undefined ? data.AmmoClip : data.ammoClip) || 0));
    const ammoTotalValue = data.AmmoTotal ?? data.ammoTotal ?? data.maxAmmo ?? data.MaxAmmo ?? data.max_ammo ?? data.totalAmmo ?? data.TotalAmmo ?? data.ammo_total;
    const ammoTotal = Math.max(0, Math.trunc(Number(ammoTotalValue) || 0));
    const weaponFile = HUD_WEAPON_IMAGES[weaponId] || HUD_WEAPON_IMAGES[0];

    if (hudWeaponImage) {
        hudWeaponImage.src = "./assets/CSS/Images/Hud/Weapons/" + weaponFile;
    }

    const hudAmmo = hudAmmoClip?.closest(".hud-ammo");

    if (hudAmmo) {
        hudAmmo.style.display = weaponId === 0 ? "none" : "";
    }

    hudAmmoClip.textContent = ammoClip;
    hudAmmoTotal.textContent = "/" + ammoTotal;
}

function showHud() {
    if (!hudMobilePlatform) {
        sendPcHud("show");
        return;
    }

    Loading.Transition(hud, () => {
        hud.classList.add("active");
    });
}

function hideHud() {
    if (!hudMobilePlatform) {
        sendPcHud("hide");
        return;
    }

    hud.classList.remove("active");
}

function setHudStat(name, value) {
    if (name === "health") sendPcHud("update", { health: value });
    if (name === "armour") sendPcHud("update", { armour: value });
    if (name === "hunger") sendPcHud("update", { hunger: value });
    const stat = hudStats[name];

    if (!stat) {
        return;
    }

    value = clamp(Number(value) || 0, 0, 100);

    stat.ring.style.strokeDasharray = "100 100";
    stat.ring.style.strokeDashoffset = String(100 - value);
    stat.ring.closest(".hud-stat")?.style.setProperty("--progress", value);
    stat.value.textContent = Math.round(value);
}

function updateHudHealth(health, maxHealth) {
    sendPcHud("update", { health, maxHealth });
    const stat = hudStats.health;

    if (!stat) {
        return;
    }

    health = Math.max(0, Number(health) || 0);
    maxHealth = Math.max(1, Number(maxHealth) || 100);

    const percent = clamp(health / maxHealth * 100, 0, 100);

    stat.ring.style.strokeDasharray = "100 100";
    stat.ring.style.strokeDashoffset = String(100 - percent);
    stat.ring.closest(".hud-stat")?.style.setProperty("--progress", percent);
    stat.value.textContent = Math.round(health);
}

function updateHudArmour(armour) {
    sendPcHud("update", { armour });
    const stat = hudStats.armour;

    if (!stat) {
        return;
    }

    armour = clamp(Number(armour) || 0, 0, 100);

    stat.ring.style.strokeDasharray = "100 100";
    stat.ring.style.strokeDashoffset = String(100 - armour);
    stat.ring.closest(".hud-stat")?.style.setProperty("--progress", armour);
    stat.value.textContent = Math.round(armour);
}

function formatHudMoney(value) {
    value = Math.trunc(Number(value) || 0);
    return value.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
}

function setHudText(element, value) {
    if (!element || value === undefined || value === null) return;
    element.textContent = String(value);
}

function updateHudServerIdentity(data) {
    if (!data || typeof data !== "object") return;
    sendPcHud("update", data);

    const nickname = data.nickname ?? data.nick ?? data.name ?? data.playerName ?? data.PlayerName ?? data.Nickname;
    const id = data.id ?? data.playerId ?? data.PlayerId ?? data.ID;
    const time = data.time ?? data.serverTime ?? data.ServerTime;
    const date = data.date ?? data.serverDate ?? data.ServerDate;

    if (nickname !== undefined) setHudText(hudPlayerName, nickname);
    if (id !== undefined) setHudText(hudIdValue, Math.max(0, Math.trunc(Number(id) || 0)));
    if (time !== undefined) setHudText(hudTimeValue, time);
    if (date !== undefined) setHudText(hudDateValue, date);
}

function parseHudPayload(data) {
    if (data && typeof data === "object") return data;
    if (typeof data === "string") {
        try { return JSON.parse(data); } catch {}
    }
    return null;
}

function updateHud(data) {
    if (!data || typeof data !== "object") return;
    sendPcHud("update", data);
    updateHudServerIdentity(data);
    if (data.health !== undefined) {
        setHudStat("health", data.health);
    }

    if (data.armour !== undefined) {
        setHudStat("armour", data.armour);
    }

    if (data.hunger !== undefined) {
        setHudStat("hunger", data.hunger);
    }

    if (data.money !== undefined) {
        hudMoneyValue.textContent = formatHudMoney(data.money);
    }

    if (data.id !== undefined) {
        hudIdValue.textContent = Math.max(0, Math.trunc(Number(data.id) || 0));
    }

    if (data.ammoClip !== undefined) {
        hudAmmoClip.textContent = Math.max(0, Math.trunc(Number(data.ammoClip) || 0));
    }

    if (data.ammoTotal !== undefined) {
        hudAmmoTotal.textContent = `/${Math.max(0, Math.trunc(Number(data.ammoTotal) || 0))}`;
    }

    const wanted = data.wanted ?? data.wantedLevel ?? data.Wanted ?? data.WantedLevel;
    if (wanted !== undefined) updateHudWanted(wanted);

    const weaponId = data.weaponId ?? data.WeaponId ?? data.weapon ?? data.Weapon;
    if (weaponId !== undefined) {
        updateHudWeapon({
            WeaponId: weaponId,
            AmmoClip: data.ammoClip ?? data.AmmoClip ?? data.ammo ?? data.Ammo ?? 0,
            AmmoTotal: data.ammoTotal ?? data.AmmoTotal ?? data.maxAmmo ?? data.MaxAmmo ?? 0
        });
    }
}

if (window.GameCef) {
    GameCef.on("hud:show", showHud);
    GameCef.on("hud:hide", hideHud);

    GameCef.on("hud:update", data => {
        const payload = parseHudPayload(data);
        if (payload) updateHud(payload);
    });
    GameCef.on("hud:player", data => {
        const payload = parseHudPayload(data);
        if (payload) updateHudServerIdentity(payload);
    });
    GameCef.on("hud:nickname", data => { setHudText(hudPlayerName, data); sendPcHud("update", { nickname: data }); });
    GameCef.on("hud:time", data => { setHudText(hudTimeValue, data); sendPcHud("update", { time: data }); });
    GameCef.on("hud:date", data => { setHudText(hudDateValue, data); sendPcHud("update", { date: data }); });

    GameCef.on("hud:health", data => setHudStat("health", data));
    GameCef.on("hud:armour", data => setHudStat("armour", data));
    GameCef.on("hud:hunger", data => setHudStat("hunger", data));
    GameCef.on("hud:money", data => updateHud({ money: data }));
    GameCef.on("hud:id", data => updateHud({ id: data }));
    GameCef.on("hud:wanted", data => updateHudWanted(data));
    GameCef.on("hud:wantedLevel", data => updateHudWanted(data));

    GameCef.on("hud:weapon", data => {
        try {
            updateHudWeapon(typeof data === "string" ? JSON.parse(data) : data);
        } catch {}
    });

    GameCef.on("hud:ammo", data => {
        try {
            updateHud(JSON.parse(data));
        } catch {}
    });
}

let hudPcStatsInitialized = false;

function initializeHudPcStats() {
    if (hudPcStatsInitialized) {
        return true;
    }

    if (!window.cef || typeof window.cef.on !== "function" || typeof window.cef.emit !== "function") {
        return false;
    }

    window.cef.on("game:data:wantedLevel", value => updateHudWanted(value));
    window.cef.on("game:data:hud", value => {
        const payload = parseHudPayload(value);
        if (payload) updateHud(payload);
    });
    window.cef.on("game:data:playerInfo", value => {
        const payload = parseHudPayload(value);
        if (payload) updateHudServerIdentity(payload);
    });

    window.cef.on("game:data:playerStats", (...args) => {
        let stats = null;

        if (args.length === 1) {
            const value = args[0];

            if (value && typeof value === "object") {
                stats = value;
            } else if (typeof value === "string") {
                try {
                    const parsed = JSON.parse(value);

                    if (parsed && typeof parsed === "object") {
                        stats = parsed;
                    }
                } catch {}
            }
        }

        if (stats) {
            const health = stats.health ?? stats.Health ?? stats.hp ?? stats.HP;
            const maxHealth = stats.maxHealth ?? stats.MaxHealth ?? stats.max_health ?? 100;
            const armour = stats.armour ?? stats.Armour ?? stats.armor ?? stats.Armor;
            const wanted = stats.wanted ?? stats.Wanted ?? stats.wantedLevel ?? stats.WantedLevel;
            const weapon = stats.weapon ?? stats.Weapon ?? stats.weaponId ?? stats.WeaponId;
            const ammo = stats.ammo ?? stats.Ammo ?? stats.ammoClip ?? stats.AmmoClip;
            const maxAmmo = stats.maxAmmo ?? stats.MaxAmmo ?? stats.max_ammo ?? stats.ammoTotal ?? stats.AmmoTotal ?? stats.totalAmmo ?? stats.TotalAmmo ?? stats.ammo_total;
            const hunger = stats.hunger ?? stats.Hunger;
            const money = stats.money ?? stats.Money;

            updateHudServerIdentity(stats);

            if (hunger !== undefined) setHudStat("hunger", hunger);
            if (money !== undefined && hudMoneyValue) hudMoneyValue.textContent = formatHudMoney(money);

            if (health !== undefined) {
                updateHudHealth(health, maxHealth);
            }

            if (armour !== undefined) {
                updateHudArmour(armour);
            }

            if (wanted !== undefined) {
                updateHudWanted(wanted);
            }

            if (weapon !== undefined || ammo !== undefined || maxAmmo !== undefined) {
                updateHudWeapon({
                    WeaponId: weapon ?? 0,
                    AmmoClip: ammo ?? 0,
                    AmmoTotal: maxAmmo ?? 0
                });
            }

            return;
        }

        const [health, maxHealth, armour, breath, wanted, weapon, ammo, maxAmmo] = args;

        if (health !== undefined) {
            updateHudHealth(health, maxHealth);
        }

        if (armour !== undefined) {
            updateHudArmour(armour);
        }

        if (wanted !== undefined) {
            updateHudWanted(wanted);
        }

        if (weapon !== undefined || ammo !== undefined || maxAmmo !== undefined) {
            updateHudWeapon({
                WeaponId: weapon ?? 0,
                AmmoClip: ammo ?? 0,
                AmmoTotal: maxAmmo ?? 0
            });
        }
    });

    window.cef.emit("game:data:pollPlayerStats", true, 50);
    hudPcStatsInitialized = true;
    return true;
}

function startHudPcStats() {
    if (initializeHudPcStats()) {
        return;
    }

    const timer = setInterval(() => {
        if (initializeHudPcStats()) {
            clearInterval(timer);
        }
    }, 250);

    setTimeout(() => {
        clearInterval(timer);
    }, 15000);
}

startHudPcStats();

window.addEventListener("load", () => {
    startHudPcStats();

    if (hudPcStatsInitialized && window.cef && typeof window.cef.emit === "function") {
        window.cef.emit("game:data:pollPlayerStats", true, 50);
    }
});

window.addEventListener("focus", () => {
    if (initializeHudPcStats() && window.cef && typeof window.cef.emit === "function") {
        window.cef.emit("game:data:pollPlayerStats", true, 50);
    }
});


(function enableHudBrowserPreview() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("hudtest") !== "1") return;
        hud.classList.add("active");
        setHudStat("health", 83);
        setHudStat("armour", 61);
        setHudStat("hunger", 74);
        updateHudWeapon({ WeaponId: 24, AmmoClip: 7, AmmoTotal: 42 });
        hudMoneyValue.textContent = formatHudMoney(125430);
        updateHudWanted(2);
        updateHudServerIdentity({ nickname: "Nastya Petrova", id: 15, time: "22:31", date: "14.09.2025" });
    } catch (_) {}
})();




