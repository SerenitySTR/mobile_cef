const registration = document.getElementById("registration");

const step1 = document.getElementById("registration-step-1");
const step2 = document.getElementById("registration-step-2");

const nextButton = document.getElementById("registration-next-button");
const backButton = document.getElementById("registration-back-button");
const registerButton = document.getElementById("registration-button");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const referalInput = document.getElementById("referal");
const passwordInput = document.getElementById("password");
const passwordRepeatInput = document.getElementById("password-repeat");

const ageInput = document.getElementById("age");
const ageMinusButton = document.getElementById("age-minus");
const agePlusButton = document.getElementById("age-plus");

const genderButtons = document.querySelectorAll(".gender-button");
const passwordEyeButtons = document.querySelectorAll(".password-eye");

let selectedGender = null;

function focusRegistrationInput(input) {
    if (!input)
        return;

    requestAnimationFrame(() => {
        input.focus();
        input.select?.();
    });
}

function resetRegistrationState() {
    emailInput.value = "";
    referalInput.value = "";
    passwordInput.value = "";
    passwordInput.type = "password";
    passwordRepeatInput.value = "";
    passwordRepeatInput.type = "password";
    selectedGender = null;
    genderButtons.forEach((button) => button.classList.remove("active"));
    setAge(18);
}

function showRegistration() {
    registration.classList.add("active");
    showRegistrationStep(step1, false);
    focusRegistrationInput(emailInput);
}

function hideRegistration() {
    registration.classList.remove("active");
}

function showRegistrationStep(step, shouldFocus = true) {
    step1.classList.remove("active");
    step2.classList.remove("active");

    step.classList.add("active");

    if (!shouldFocus)
        return;

    focusRegistrationInput(step === step2 ? ageInput : emailInput);
}

function isValidEmail(email) {
    return email.includes("@") && email.includes(".");
}

function setAge(value) {
    let age = Number(value);

    if (Number.isNaN(age))
        age = 18;

    age = Math.max(18, Math.min(70, age));

    ageInput.value = age;
}

passwordEyeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (!input)
            return;

        input.type = input.type === "password"
            ? "text"
            : "password";

        focusRegistrationInput(input);
    });
});

genderButtons.forEach((button) => {
    button.addEventListener("click", () => {
        genderButtons.forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        selectedGender = button.dataset.gender === "male" ? 1 : 2;
    });
});

ageMinusButton.addEventListener("click", () => {
    setAge(Number(ageInput.value) - 1);
});

agePlusButton.addEventListener("click", () => {
    setAge(Number(ageInput.value) + 1);
});

ageInput.addEventListener("input", () => {
    ageInput.value = ageInput.value.replace(/\D/g, "").slice(0, 2);
});

ageInput.addEventListener("blur", () => {
    setAge(ageInput.value);
});

nextButton.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordRepeat = passwordRepeatInput.value;

    if (!email) {
        showError("Помилка", "Введіть адресу електронної пошти.");
        return;
    }

    if (email.length > 60) {
        showError("Невірна пошта", "E-mail не може бути довшим за 60 символів.");
        return;
    }

    if (!/^[A-Za-z0-9@._+-]+$/.test(email)) {
        showError("Невірна пошта", "E-mail може містити лише латинські літери, цифри та допустимі символи.");
        return;
    }

    if (!isValidEmail(email)) {
        showError("Невірна пошта", "Введіть коректну адресу електронної пошти.");
        return;
    }

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

    if (password !== passwordRepeat) {
        showError("Помилка", "Паролі не співпадають.");
        return;
    }

    showRegistrationStep(step2);
});

backButton.addEventListener("click", () => {
    showRegistrationStep(step1);
});

registerButton.addEventListener("click", () => {
    setAge(ageInput.value);

    if (!selectedGender) {
        showError("Помилка", "Оберіть стать персонажа.");
        return;
    }

    const data = {
        UserName: usernameInput.value.trim(),
        Password: passwordInput.value,
        Email: emailInput.value.trim(),
        Referral: referalInput.value.trim(),
        Gender: selectedGender,
        Age: Number(ageInput.value)
    };

    GameCef.sendJson("registration:submit", data);
});

document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
        return;

    if (!registration.classList.contains("active"))
        return;

    if (document.getElementById("error-screen")?.classList.contains("active") ||
        document.getElementById("dialog-screen")?.classList.contains("active"))
        return;

    if (event.key === "Escape" && step2.classList.contains("active")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        backButton.click();
        return;
    }

    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
        return;

    const target = event.target;
    if (target?.tagName === "BUTTON" || target?.tagName === "A")
        return;

    event.preventDefault();
    event.stopImmediatePropagation();
    (step2.classList.contains("active") ? registerButton : nextButton).click();
});

// Временный локальный тест регистрации.
// Автоматически работает только при file://, localhost или 127.0.0.1.
function testShowRegistration() {
    if (typeof Loading !== "undefined" && Loading.Hide)
        Loading.Hide();

    document.getElementById("authorization")?.classList.remove("active");

    usernameInput.value = "Test_Player";
    resetRegistrationState();
    showRegistration();
}

const isRegistrationLocalTest =
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

if (isRegistrationLocalTest) {
    setTimeout(() => {
        testShowRegistration();
    }, 500);
}
