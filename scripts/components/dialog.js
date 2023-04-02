function createFoundation(title, content) {
    const background = document.createElement("div");
    background.className = "dialog-background";

    const dialog = document.createElement("div");
    dialog.className = "dialog";

    const header = document.createElement("div");
    header.className = "dialog-header";
    const titleElement = document.createElement("h2");
    titleElement.className = "title";
    titleElement.textContent = title;
    header.appendChild(titleElement);
    dialog.appendChild(header);

    const body = document.createElement("div");
    body.className = "dialog-body";
    body.textContent = content;
    dialog.appendChild(body);

    const buttons = document.createElement("div");
    buttons.className = "buttons";
    dialog.appendChild(buttons);

    return [dialog, background, buttons];
}

function close(dialog, background) {
    document.body.removeChild(background);
    document.body.removeChild(dialog);
}

export function showYesNo(title, content, isDanger = false) {
    const [dialog, background, buttons] = createFoundation(title, content);

    const no = document.createElement("button");
    no.textContent = "No";
    buttons.appendChild(no);

    const yes = document.createElement("button");
    yes.className = "primary";
    yes.textContent = "Yes";
    if (isDanger) {
        yes.classList.add("danger");
    }

    buttons.appendChild(yes);

    document.body.insertAdjacentElement("beforeend", background);
    document.body.insertAdjacentElement("beforeend", dialog);

    return new Promise((resolve, reject) => {
        no.addEventListener("click", () => {
            close(dialog, background);
            resolve("no")
        });

        yes.addEventListener("click", () => {
            close(dialog, background);
            resolve("yes")
        });
    });
}