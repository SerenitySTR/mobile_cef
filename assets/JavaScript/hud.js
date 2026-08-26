const hud = document.getElementById("hud");

const hudMoneyValue = document.getElementById("hud-money-value");

const hudHealthBar = document.getElementById("hud-health-bar");
const hudHealthValue = document.getElementById("hud-health-value");

const hudArmourBar = document.getElementById("hud-armour-bar");
const hudArmourValue = document.getElementById("hud-armour-value");

const hudHungerBar = document.getElementById("hud-hunger-bar");
const hudHungerValue = document.getElementById("hud-hunger-value");

const hudWeaponIcon = document.getElementById("hud-weapon-icon");
const hudWeaponAmmo = document.getElementById("hud-weapon-ammo");

const hudWeaponFiles = {
    0: "fist",
    1: "brassknuckle",
    2: "golfclub",
    3: "nightstick",
    4: "knife",
    5: "bat",
    6: "shovel",
    7: "poolcue",
    8: "katana",
    9: "chainsaw",
    10: "dildo1",
    11: "dildo2",
    12: "vibrator1",
    13: "vibrator2",
    14: "flowers",
    15: "cane",
    16: "grenade",
    17: "teargas",
    18: "molotov",
    22: "colt45",
    23: "silenced",
    24: "deagle",
    25: "shotgun",
    26: "sawnoff",
    27: "spas12",
    28: "uzi",
    29: "mp5",
    30: "ak47",
    31: "m4",
    32: "tec9",
    33: "rifle",
    34: "sniper",
    35: "rocketlauncher",
    36: "heatseeker",
    37: "flamethrower",
    38: "minigun",
    39: "satchel",
    40: "detonator",
    41: "spraycan",
    42: "extinguisher",
    43: "camera",
    44: "nightvision",
    45: "infrared",
    46: "parachute"
};

const weaponsWithoutAmmo = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,40,41,42,43,44,45,46];

function showHud() { hud.classList.add("active"); }
function hideHud() { hud.classList.remove("active"); }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
function hasWeaponAmmo(weaponId) { return !weaponsWithoutAmmo.includes(weaponId); }

function updateHudWeapon(weaponId,ammo) {
    weaponId = Number(weaponId) || 0;
    ammo = Math.max(0,Number(ammo) || 0);

    const weaponFile = hudWeaponFiles[weaponId] || "fist";

    hudWeaponIcon.src = `./assets/CSS/Images/Hud/Weapons/${weaponFile}.svg`;
    hudWeaponAmmo.textContent = hasWeaponAmmo(weaponId) ? ammo : "";
}

function updateHud(data) {
    const money = Number(data.money) || 0;
    const health = clamp(Number(data.health) || 0,0,100);
    const armour = clamp(Number(data.armour) || 0,0,100);
    const hunger = clamp(Number(data.hunger) || 0,0,100);

    hudMoneyValue.textContent = `$${money.toLocaleString("en-US")}`;

    hudHealthBar.style.width = `${health}%`;
    hudHealthValue.textContent = `${health} / 100`;

    hudArmourBar.style.width = `${armour}%`;
    hudArmourValue.textContent = `${armour} / 100`;

    hudHungerBar.style.width = `${hunger}%`;
    hudHungerValue.textContent = `${hunger} / 100`;

    if (data.weaponId !== undefined)
        updateHudWeapon(data.weaponId,data.ammo);
}

GameCef.on("hud:show",() => { showHud(); });
GameCef.on("hud:hide",() => { hideHud(); });

GameCef.on("hud:update",(data) => {
    try { updateHud(JSON.parse(data)); } catch {}
});

GameCef.on("hud:health",(data) => {
    const health = clamp(Number(data) || 0,0,100);
    hudHealthBar.style.width = `${health}%`;
    hudHealthValue.textContent = `${health} / 100`;
});

GameCef.on("hud:armour",(data) => {
    const armour = clamp(Number(data) || 0,0,100);
    hudArmourBar.style.width = `${armour}%`;
    hudArmourValue.textContent = `${armour} / 100`;
});

GameCef.on("hud:hunger",(data) => {
    const hunger = clamp(Number(data) || 0,0,100);
    hudHungerBar.style.width = `${hunger}%`;
    hudHungerValue.textContent = `${hunger} / 100`;
});

GameCef.on("hud:money",(data) => {
    const money = Number(data) || 0;
    hudMoneyValue.textContent = `$${money.toLocaleString("en-US")}`;
});

GameCef.on("hud:weapon",(data) => {
    try {
        const weapon = JSON.parse(data);
        updateHudWeapon(weapon.weaponId,weapon.ammo);
    } catch {}
});