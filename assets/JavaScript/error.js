const errorScreen = document.getElementById("error-screen");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const errorCloseButton = document.getElementById("error-close-button");

function showError(title, message) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;

    errorScreen.classList.add("active");
}

function hideError() {
    errorScreen.classList.remove("active");
}

errorCloseButton.addEventListener("click", () => {
    hideError();
});

GameCef.on("error:show", (data) => {
    try {
        const error = JSON.parse(data);

        showError(error.title || "Помилка", error.message || "Сталася невідома помилка");
    } catch {
        showError(
            "Помилка",
            data || "Сталася невідома помилка"
        );
    }
});

GameCef.on("error:hide", () => {
    hideError();
});
