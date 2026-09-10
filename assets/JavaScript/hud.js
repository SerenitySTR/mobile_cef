const hud = document.getElementById("hud");

const HUD_REFERENCE_WIDTH = 1280;
const HUD_REFERENCE_HEIGHT = 720;
const HUD_MIN_SCALE = 0.46;
const HUD_MAX_SCALE = 0.92;

function updateHudMobileScale() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scaleByWidth = width / HUD_REFERENCE_WIDTH;
    const scaleByHeight = height / HUD_REFERENCE_HEIGHT;
    const isPhone = width <= 1000 || height <= 600;
    const sizeMultiplier = isPhone ? 0.85 : 0.92;

    let scale = Math.min(scaleByWidth, scaleByHeight) * sizeMultiplier;

    scale = Math.max(
        HUD_MIN_SCALE * sizeMultiplier,
        Math.min(HUD_MAX_SCALE * sizeMultiplier, scale)
    );

    hud.style.setProperty("--hud-scale", scale.toFixed(4));

    if (isPhone) {
        hud.classList.add("hud-compact");
    } else {
        hud.classList.remove("hud-compact");
    }
}

updateHudMobileScale();

window.addEventListener("resize", updateHudMobileScale);
window.addEventListener("orientationchange", () => {
    setTimeout(updateHudMobileScale, 100);
});

const HUD_RING_LENGTH = 2 * Math.PI * 49;

const hudStats = {
    health: {
        ring: document.getElementById("hud-health-ring"),
        value: document.getElementById("hud-health-value")
    },
    armour: {
        ring: document.getElementById("hud-armour-ring"),
        value: document.getElementById("hud-armour-value")
    },
    hunger: {
        ring: document.getElementById("hud-hunger-ring"),
        value: document.getElementById("hud-hunger-value")
    }
};

const hudMoneyValue = document.getElementById("hud-money-value");
const hudOnlineValue = document.getElementById("hud-online-value");
const hudIdValue = document.getElementById("hud-id-value");
const hudAmmoClip = document.getElementById("hud-ammo-clip");
const hudAmmoTotal = document.getElementById("hud-ammo-total");
const hudWeaponImage = document.getElementById("hud-weapon-image");
const hudWanted = document.getElementById("hud-wanted");

const HUD_WEAPON_IMAGES = {
    0: "fist.svg",
    1: "brassknuckle.svg",
    2: "golfclub.svg",
    3: "nightstick.svg",
    4: "knife.svg",
    5: "bat.svg",
    6: "shovel.svg",
    7: "poolcue.svg",
    8: "katana.svg",
    9: "chainsaw.svg",
    10: "dildo1.svg",
    11: "dildo2.svg",
    12: "vibrator1.svg",
    13: "vibrator2.svg",
    14: "flowers.svg",
    15: "cane.svg",
    16: "grenade.svg",
    17: "teargas.svg",
    18: "molotov.svg",
    22: "colt45.svg",
    23: "silenced.svg",
    24: "deagle.svg",
    25: "shotgun.svg",
    26: "sawnoff.svg",
    27: "spas12.svg",
    28: "uzi.svg",
    29: "mp5.svg",
    30: "ak47.svg",
    31: "m4.svg",
    32: "tec9.svg",
    33: "rifle.svg",
    34: "sniper.svg",
    35: "rocketlauncher.svg",
    36: "heatseeker.svg",
    37: "flamethrower.svg",
    38: "minigun.svg",
    39: "satchel.svg",
    40: "detonator.svg",
    41: "spraycan.svg",
    42: "extinguisher.svg",
    43: "camera.svg",
    44: "nightvision.svg",
    45: "infrared.svg",
    46: "parachute.svg"
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

function updateHudWanted(value) {
    if (!hudWanted) {
        return;
    }

    const wanted = clamp(Math.trunc(Number(value) || 0), 0, 6);
    const stars = hudWanted.querySelectorAll(".hud-wanted-star");

    stars.forEach((star, index) => {
        star.classList.toggle("active", index < wanted);
    });
}

createWantedStars();

function updateHudWeapon(data) {
    if (!data) {
        return;
    }

    const weaponId = Math.max(0, Math.trunc(Number(data.WeaponId !== undefined ? data.WeaponId : data.weaponId) || 0));
    const ammoClip = Math.max(0, Math.trunc(Number(data.AmmoClip !== undefined ? data.AmmoClip : data.ammoClip) || 0));
    const ammoTotal = Math.max(0, Math.trunc(Number(data.AmmoTotal !== undefined ? data.AmmoTotal : data.ammoTotal) || 0));
    const weaponFile = HUD_WEAPON_IMAGES[weaponId] || HUD_WEAPON_IMAGES[0];

    if (hudWeaponImage) {
        hudWeaponImage.src = "./assets/CSS/Images/Hud/Weapons/" + weaponFile;
    }

    hudAmmoClip.textContent = ammoClip;
    hudAmmoTotal.textContent = "/" + ammoTotal;
}

function showHud() {
    Loading.Transition(hud, () => {
        hud.classList.add("active");
    });
}

function hideHud() {
    hud.classList.remove("active");
}

function setHudStat(name, value) {
    const stat = hudStats[name];

    if (!stat) {
        return;
    }

    value = clamp(Number(value) || 0, 0, 100);

    stat.ring.style.strokeDasharray = HUD_RING_LENGTH;
    stat.ring.style.strokeDashoffset = HUD_RING_LENGTH * (1 - value / 100);
    stat.value.textContent = Math.round(value);
}

function updateHudHealth(health, maxHealth) {
    const stat = hudStats.health;

    if (!stat) {
        return;
    }

    health = Math.max(0, Number(health) || 0);
    maxHealth = Math.max(1, Number(maxHealth) || 100);

    const percent = clamp(health / maxHealth * 100, 0, 100);

    stat.ring.style.strokeDasharray = HUD_RING_LENGTH;
    stat.ring.style.strokeDashoffset = HUD_RING_LENGTH * (1 - percent / 100);
    stat.value.textContent = Math.round(health);
}

function updateHudArmour(armour) {
    const stat = hudStats.armour;

    if (!stat) {
        return;
    }

    armour = clamp(Number(armour) || 0, 0, 100);

    stat.ring.style.strokeDasharray = HUD_RING_LENGTH;
    stat.ring.style.strokeDashoffset = HUD_RING_LENGTH * (1 - armour / 100);
    stat.value.textContent = Math.round(armour);
}

function formatHudMoney(value) {
    value = Math.trunc(Number(value) || 0);
    return value.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
}

function updateHud(data) {
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

    if (data.online !== undefined) {
        hudOnlineValue.textContent = Math.max(0, Math.trunc(Number(data.online) || 0));
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

    if (data.wanted !== undefined) {
        updateHudWanted(data.wanted);
    }
}

if (window.GameCef) {
    GameCef.on("hud:show", showHud);
    GameCef.on("hud:hide", hideHud);

    GameCef.on("hud:update", data => {
        try {
            updateHud(JSON.parse(data));
        } catch {}
    });

    GameCef.on("hud:health", data => setHudStat("health", data));
    GameCef.on("hud:armour", data => setHudStat("armour", data));
    GameCef.on("hud:hunger", data => setHudStat("hunger", data));
    GameCef.on("hud:money", data => updateHud({ money: data }));
    GameCef.on("hud:online", data => updateHud({ online: data }));
    GameCef.on("hud:id", data => updateHud({ id: data }));
    GameCef.on("hud:wanted", data => updateHudWanted(data));

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
            const maxAmmo = stats.maxAmmo ?? stats.MaxAmmo ?? stats.ammoTotal ?? stats.AmmoTotal;

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