import * as fileDrop from "./fileDrop";

let resizing = false;
let lastSize = null;

export function clear(pane) {
    for (const input of pane.querySelectorAll("input, textarea, .textarea")) {
        if (input.classList.contains("no-clear")) {
            continue;
        }

        input.value = "";
        if (input.parentElement.classList.contains("multi-input")) {
            input.placeholder = input.getAttribute("data-placeholder");

            while (input.previousSibling) {
                input.parentElement.removeChild(input.parentElement.firstChild);
            }
        }
    }

    for (const drop of pane.querySelectorAll(".file-drop")) {
        fileDrop.clear(drop);
    }
}

export function close(pane) {
    pane.classList.add("hidden");
    pane.classList.remove("minimised");
    pane.previousElementSibling.style.height = "";
    clear(pane);
}

export function minimise(pane) {
    pane.classList.add("minimised");
    const sibling = pane.previousElementSibling;
    const bodyHeight = document.body.getBoundingClientRect().height;
    const siblingTop = sibling.getBoundingClientRect().top;
    lastSize = sibling.style.height;
    sibling.style.height = bodyHeight - siblingTop - pane.querySelector(".pane-header").clientHeight + "px";
}

export function unminimise(pane) {
    pane.classList.remove("minimised");
    pane.previousElementSibling.style.height = lastSize;
}

function initPane(pane) {
    const closeButton = pane.querySelector(".close");
    closeButton.addEventListener("click", () => close(pane));

    const minimiseButton = pane.querySelector(".minimise");
    minimiseButton.addEventListener("click", () => minimise(pane));

    const header = pane.querySelector(".pane-header");
    header.addEventListener("click", e => {
        if (!e.target.classList.contains("minimise")) {
            unminimise(pane);
        }
    });

    const resizer = document.createElement("span");
    resizer.className = "resizer";
    header.prepend(resizer);
    resizer.addEventListener("mousedown", () => {
        resizing = true;
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mouseup", () => {
        resizing = false;
        document.body.style.userSelect = "";
    });

    const sibling = pane.previousElementSibling;
    sibling.style.boxSizing = "border-box";
    document.addEventListener("mousemove", e => {
        if (resizing) {
            pane.style.height = "auto";
            pane.previousElementSibling.style.height = e.clientY - sibling.getBoundingClientRect().top + "px";
        }
    });
}


export function init() {
    for (const pane of document.getElementsByClassName("pane")) {
        initPane(pane);
    }
}