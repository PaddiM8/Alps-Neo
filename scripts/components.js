function createInputBox(value) {
    const box = document.createElement("span");
    box.className = "input-box";

    const content = document.createElement("span");
    content.className = "content";
    content.textContent = value;
    box.appendChild(content);

    box.addEventListener("click", () => {
        // It might have been deleted at this point
        if (box.parentElement) {
            const input = box.parentElement.querySelector("input");
            input.value = content.textContent;
            removeInputBox(input, box);
        }
    });

    const button = document.createElement("span");
    button.className = "remove";
    button.innerHTML = "×";

    button.addEventListener("click", () => {
        removeInputBox(box.parentElement.querySelector("input"), box);
    });

    box.appendChild(button);

    return box;
}

function addInputBox(input) {
    input.parentElement.insertBefore(createInputBox(input.value), input);
    input.value = "";
    input.placeholder = "";
}

function removeInputBox(input, box) {
    input.parentElement.removeChild(box);
    if (input.parentElement.children.length == 1) {
        input.placeholder = input.getAttribute("data-placeholder");
    }
}

function initMultiInputs() {
    for (const multiInput of document.querySelectorAll(".multi-input")) {
        const input = multiInput.querySelector("input");
        input.setAttribute("data-placeholder", input.placeholder);
        input.addEventListener("keydown", e => {
            if ((e.key == " " || e.key == ",") && input.value.trim()) {
                addInputBox(input);
                e.preventDefault();
            } else if (e.key == "Backspace" && input.value == "" && multiInput.children.length > 1) {
                const lastBox = multiInput.children[multiInput.children.length - 2];
                input.value = lastBox.textContent;
                removeInputBox(input, lastBox);
            }
        });

        input.addEventListener("blur", () => {
            if (input.value.trim()) {
                addInputBox(input);
            }
        });
    }
}

function init() {
    initMultiInputs();
}

init();