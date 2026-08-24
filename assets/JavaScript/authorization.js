const authorization = document.getElementById("authorization");

const authorizationUsernameInput = document.getElementById("authorization-username");
const authorizationPasswordInput = document.getElementById("authorization-password");

const authorizationButton = document.getElementById("authorization-button");
const authorizationPasswordEye = document.querySelector(".authorization-password-eye");

function showAuthorization() {
    authorization.classList.add("active");
}

function hideAuthorization() {
    authorization.classList.remove("active");
}

authorizationPasswordEye.addEventListener("click", () => {
    authorizationPasswordInput.type = authorizationPasswordInput.type === "password"
        ? "text"
        : "password";
});

authorizationButton.addEventListener("click", () => {
    const password = authorizationPasswordInput.value;

    if (!password) {
        showError("Помилка", "Введіть пароль.");
        return;
    }

    if (password.length < 6 || password.length > 21) {
        showError("Невірний пароль", "Пароль повинен містити від 6 до 21 символу.");
        return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(password)) {
        showError("Невірний пароль", "Пароль може містити лише латинські літери, цифри та знак _.");
        return;
    }

    GameCef.sendJson("authorization:submit", {
        UserName: authorizationUsernameInput.value.trim(),
        Password: password
    });
});

GameCef.on("authorization:show", (data) => {
    authorizationUsernameInput.value = data;
    authorizationPasswordInput.value = "";

    showAuthorization();
});

GameCef.on("authorization:hide", () => {
    hideAuthorization();
});