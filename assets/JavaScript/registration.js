const registration = document.getElementById("registration");

const step1 = document.getElementById("registration-step-1");
const step2 = document.getElementById("registration-step-2");

const nextButton = document.getElementById("registration-next-button");
const backButton = document.getElementById("registration-back-button");
const registerButton = document.getElementById("registration-button");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordRepeatInput = document.getElementById("password-repeat");

const ageInput = document.getElementById("age");
const ageMinusButton = document.getElementById("age-minus");
const agePlusButton = document.getElementById("age-plus");

const genderButtons = document.querySelectorAll(".gender-button");
const passwordEyeButtons = document.querySelectorAll(".password-eye");

let selectedGender = null;

function showRegistration() {
    registration.classList.add("active");
    step1.classList.add("active");
    step2.classList.remove("active");
}

function hideRegistration() {
    registration.classList.remove("active");
}

function showRegistrationStep(step) {
    step1.classList.remove("active");
    step2.classList.remove("active");

    step.classList.add("active");
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
    });
});

genderButtons.forEach((button) => {
    button.addEventListener("click", () => {
        genderButtons.forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        selectedGender = button.dataset.gender;
    });
});

ageMinusButton.addEventListener("click", () => {
    setAge(Number(ageInput.value) - 1);
});

agePlusButton.addEventListener("click", () => {
    setAge(Number(ageInput.value) + 1);
});

ageInput.addEventListener("input", () => {
    if (ageInput.value === "")
        return;

    setAge(ageInput.value);
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

    if (!/^[A-Za-z0-9_]+$/.test(password)) {
        showError("Невірний пароль", "Пароль може містити лише латинські літери, цифри та знак _.");
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
    if (!selectedGender) {
        showError("Помилка", "Оберіть стать персонажа.");
        return;
    }

    const data = {
        UserName: usernameInput.value.trim(),
        Password: passwordInput.value,
        Email: emailInput.value.trim(),
        Gender: selectedGender,
        Age: Number(ageInput.value)
    };

    GameCef.sendJson("registration:submit", data);
});

GameCef.on("registration:show", (data) => {
    usernameInput.value = data;
    showRegistration();
});

GameCef.on("registration:hide", () => {
    hideRegistration();
});

