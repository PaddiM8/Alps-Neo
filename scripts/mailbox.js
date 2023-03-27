const composeButton = document.getElementById("compose-button");
const composePane = document.getElementById("compose-pane");

composeButton.addEventListener("click", () => {
    composePane.classList.remove("hidden");
});