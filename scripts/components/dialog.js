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

    return [dialog, body, background, buttons];
}

function close(dialog, background) {
    document.body.removeChild(background);
    document.body.removeChild(dialog);
}

export function showInput(title, content, placeholder) {
    const [dialog, body, background, buttons] = createFoundation(title, content);

    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    buttons.appendChild(cancel);

    const ok = document.createElement("button");
    ok.textContent = "Ok";
    ok.classList = "primary";
    buttons.appendChild(ok);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    body.appendChild(input);

    document.body.insertAdjacentElement("beforeend", background);
    document.body.insertAdjacentElement("beforeend", dialog);

    return new Promise((resolve, reject) => {
        cancel.addEventListener("click", () => {
            close(dialog, background);
            resolve(null);
        });

        ok.addEventListener("click", () => {
            close(dialog, background);
            resolve(input.value);
        });
    });
}

export function showYesNo(title, content, isDanger = false) {
    const [dialog, body, background, buttons] = createFoundation(title, content);

    const no = document.createElement("button");
    no.textContent = "No";
    buttons.appendChild(no);

    const yes = document.createElement("button");
    yes.className = "primary";
    yes.textContent = "Yes";
    buttons.appendChild(yes);
    if (isDanger) {
        yes.classList.add("danger");
    }

    document.body.appendChild(background);
    document.body.appendChild(dialog);

    return new Promise((resolve, reject) => {
        no.addEventListener("click", () => {
            close(dialog, background);
            resolve("no");
        });

        yes.addEventListener("click", () => {
            close(dialog, background);
            resolve("yes");
        });
    });
}