const spawnSelection = document.getElementById("spawn-selection");
const spawnItems = document.querySelectorAll(".spawn-item");
const spawnButton = document.getElementById("spawn-button");
const spawnPreviewImage = document.getElementById("spawn-preview-image");
const spawnPreviewTitle = document.getElementById("spawn-preview-title");
const spawnPreviewIcon = document.getElementById("spawn-preview-icon");
const spawnPreviewText = document.getElementById("spawn-preview-text");
const spawnData = {
    LastPosition: {
        id: 0,
        title: "Останнє місце",
        text: "Поверніться до вашого останнього місця виходу з гри. Ви з'явитесь саме там, де востаннє завершили гру.",
        image: "./assets/CSS/Images/Spawn/last-position-new.webp",
        icon: "./assets/CSS/Images/Spawn/preview-last.svg"
    },
    Standard: {
        id: 2,
        title: "Стандартний",
        text: "Почніть гру зі стандартної точки появи — зручного місця для швидкого старту та знайомства з містом.",
        image: "./assets/CSS/Images/Spawn/standard-new.webp",
        icon: "./assets/CSS/Images/Spawn/icon-standard.svg"
    },
    House: {
        id: 1,
        title: "Будинок",
        text: "З'явіться біля власного будинку та продовжіть гру без зайвих переміщень містом.",
        image: "./assets/CSS/Images/Spawn/house-new.webp",
        icon: "./assets/CSS/Images/Spawn/preview-house.svg"
    },
    FamilyHouse: {
        id: 3,
        title: "Будинок родини",
        text: "Почніть гру біля будинку своєї родини поруч з іншими її учасниками.",
        image: "./assets/CSS/Images/Spawn/family-house-new.webp",
        icon: "./assets/CSS/Images/Spawn/preview-family-house.svg"
    }
};
let selectedSpawn = "LastPosition";
function showSpawn() {
    spawnSelection.classList.add("active");
}
function hideSpawn() {
    spawnSelection.classList.remove("active");
}
function getSpawnKey(value) {
    if (typeof value === "number") {
        return Object.keys(spawnData).find(key => spawnData[key].id === value);
    }
    if (typeof value === "string" && /^\d+$/.test(value)) {
        const id = Number(value);
        return Object.keys(spawnData).find(key => spawnData[key].id === id);
    }
    return spawnData[value] ? value : null;
}
function selectSpawn(value) {
    const type = getSpawnKey(value);
    if (!type)
        return;
    selectedSpawn = type;
    spawnItems.forEach(item => {
        item.classList.toggle("active", item.dataset.spawn === type);
    });
    const data = spawnData[type];
    spawnPreviewImage.style.opacity = "0";
    spawnPreviewImage.style.transform = "scale(1.025)";
    const requestType = type;
    const nextImage = new Image();
    nextImage.onload = () => {
        if (selectedSpawn !== requestType)
            return;
        spawnPreviewImage.src = data.image;
        requestAnimationFrame(() => {
            if (selectedSpawn !== requestType)
                return;
            spawnPreviewImage.style.opacity = "1";
            spawnPreviewImage.style.transform = "scale(1.012)";
        });
    };
    nextImage.onerror = () => {
        if (selectedSpawn !== requestType)
            return;
        spawnPreviewImage.style.opacity = "1";
        spawnPreviewImage.style.transform = "scale(1.012)";
    };
    nextImage.src = data.image;
    spawnPreviewTitle.textContent = data.title;
    if (spawnPreviewIcon)
        spawnPreviewIcon.src = data.icon;
    spawnPreviewText.textContent = data.text;
}
spawnItems.forEach(item => {
    item.addEventListener("click", () => selectSpawn(item.dataset.spawn));
});
function submitSpawn() {
    if (!spawnData[selectedSpawn])
        return;
    GameCef.sendJson("spawn:submit", {
        SpawnType: spawnData[selectedSpawn].id
    });
}
spawnButton.addEventListener("click", submitSpawn);
document.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
        return;
    if (!spawnSelection.classList.contains("active") || event.key !== "Enter")
        return;
    if (document.getElementById("error-screen")?.classList.contains("active") ||
        document.getElementById("dialog-screen")?.classList.contains("active"))
        return;
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
        return;
    if (!spawnButton || spawnButton.disabled)
        return;
    event.preventDefault();
    event.stopImmediatePropagation();
    spawnButton.click();
});
GameCef.on("spawn:show", data => {
    if (data) {
        try {
            const value = typeof data === "string" ? JSON.parse(data) : data;
            if (value && value.SelectedSpawn !== undefined)
                selectSpawn(value.SelectedSpawn);
        }
        catch {
            selectSpawn(data);
        }
    }
    Loading.Transition(spawnSelection, () => {
        showSpawn();
    });
});
GameCef.on("spawn:hide", () => {
    Loading.Hide();
    hideSpawn();
});
