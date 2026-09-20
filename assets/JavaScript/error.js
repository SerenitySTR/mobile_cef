const errorScreen = document.getElementById("error-screen");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const errorCloseButton = document.getElementById("error-close-button");

function showError(title, message) {
    Loading.Hide();

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


document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat)
        return;

    if (!errorScreen.classList.contains("active") || (event.key !== "Escape" && event.key !== "Enter"))
        return;

    if (event.key === "Enter" && (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey))
        return;

    event.preventDefault();
    event.stopImmediatePropagation();
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
