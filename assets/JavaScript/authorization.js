const authorization = document.getElementById("authorization");

const authorizationUsernameInput = document.getElementById("authorization-username");
const authorizationPasswordInput = document.getElementById("authorization-password");

const authorizationButton = document.getElementById("authorization-button");
const authorizationPasswordEye = document.querySelector(".authorization-password-eye");

function focusAuthorizationPassword() {
    requestAnimationFrame(() => {
        authorizationPasswordInput.focus();
        authorizationPasswordInput.select?.();
    });
}

function showAuthorization() {
    authorization.classList.add("active");
    focusAuthorizationPassword();
}

function hideAuthorization() {
    authorization.classList.remove("active");
}

let authorizationPasswordEyeTouchAt = 0;

function toggleAuthorizationPassword() {
    authorizationPasswordInput.type = authorizationPasswordInput.type === "password"
        ? "text"
        : "password";
}

authorizationPasswordEye.addEventListener("touchstart", (event) => {
    event.preventDefault();
    authorizationPasswordEyeTouchAt = Date.now();
    toggleAuthorizationPassword();
}, { passive: false });

authorizationPasswordEye.addEventListener("mousedown", (event) => {
    event.preventDefault();

    if (Date.now() - authorizationPasswordEyeTouchAt < 700)
        return;

    toggleAuthorizationPassword();
});

authorizationPasswordEye.addEventListener("click", (event) => {
    event.preventDefault();

    if (event.detail === 0)
        toggleAuthorizationPassword();
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

    if (!/^[!-~]+$/.test(password)) {
        showError("Невірний пароль", "Пароль може містити латинські літери, цифри та спеціальні символи без пробілів.");
        return;
    }

    Loading.Show();

    GameCef.sendJson("authorization:submit", {
        UserName: authorizationUsernameInput.value.trim(),
        Password: password
    });
});

document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
        return;

    if (!authorization.classList.contains("active") || event.key !== "Enter")
        return;

    if (document.getElementById("error-screen")?.classList.contains("active") ||
        document.getElementById("dialog-screen")?.classList.contains("active"))
        return;

    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
        return;

    event.preventDefault();
    event.stopImmediatePropagation();
    authorizationButton.click();
});

GameCef.on("authorization:show", (data) => {
    authorizationUsernameInput.value = data;
    authorizationPasswordInput.value = "";
    authorizationPasswordInput.type = "password";

    Loading.Transition(authorization, () => {
        showAuthorization();
    });
});

GameCef.on("authorization:hide", () => {
    hideAuthorization();
});
