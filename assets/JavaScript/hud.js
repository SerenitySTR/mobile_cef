const hud = document.getElementById("hud");

const hudMoneyValue = document.getElementById("hud-money-value");

const hudHealthBar = document.getElementById("hud-health-bar");
const hudHealthValue = document.getElementById("hud-health-value");

const hudArmourBar = document.getElementById("hud-armour-bar");
const hudArmourValue = document.getElementById("hud-armour-value");

const hudHungerBar = document.getElementById("hud-hunger-bar");
const hudHungerValue = document.getElementById("hud-hunger-value");

function showHud() {
    hud.classList.add("active");
}

function hideHud() {
    hud.classList.remove("active");
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function updateHud(data) {
    const money = Number(data.money) || 0;
    const health = clamp(Number(data.health) || 0, 0, 100);
    const armour = clamp(Number(data.armour) || 0, 0, 100);
    const hunger = clamp(Number(data.hunger) || 0, 0, 100);

    hudMoneyValue.textContent = `$${money.toLocaleString("en-US")}`;

    hudHealthBar.style.width = `${health}%`;
    hudHealthValue.textContent = `${health} / 100`;

    hudArmourBar.style.width = `${armour}%`;
    hudArmourValue.textContent = `${armour} / 100`;

    hudHungerBar.style.width = `${hunger}%`;
    hudHungerValue.textContent = `${hunger} / 100`;
}

GameCef.on("hud:show", (data) => {

    showHud();
});

GameCef.on("hud:hide", () => {
    hideHud();
});

GameCef.on("hud:update", (data) => {
    try {
        updateHud(JSON.parse(data));
    } catch {
    }
});

GameCef.on("hud:health", (data) => {
    const health = clamp(Number(data) || 0, 0, 100);

    hudHealthBar.style.width = `${health}%`;
    hudHealthValue.textContent = `${health} / 100`;
});

GameCef.on("hud:armour", (data) => {
    const armour = clamp(Number(data) || 0, 0, 100);

    hudArmourBar.style.width = `${armour}%`;
    hudArmourValue.textContent = `${armour} / 100`;
});

GameCef.on("hud:hunger", (data) => {
    const hunger = clamp(Number(data) || 0, 0, 100);

    hudHungerBar.style.width = `${hunger}%`;
    hudHungerValue.textContent = `${hunger} / 100`;
});

GameCef.on("hud:money", (data) => {
    const money = Number(data) || 0;

    hudMoneyValue.textContent = `$${money.toLocaleString("en-US")}`;
});

