let resizing = false;

function clearPane(pane) {
    for (const input of pane.querySelectorAll("input, textarea")) {
        input.value = "";
    }
}

function initPane(pane) {
    const closeButton = pane.querySelector(".close");
    closeButton.addEventListener("click", () => {
        pane.classList.add("hidden");
        pane.classList.remove("minimised");
        clearPane(pane);
    });

    const minimiseButton = pane.querySelector(".minimise");
    minimiseButton.addEventListener("click", () => {
        pane.classList.add("minimised");
        pane.style.height = "";
    });

    const header = pane.querySelector(".pane-header");
    header.addEventListener("click", e => {
        if (!e.target.classList.contains("minimise")) {
            pane.classList.remove("minimised");
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

    document.addEventListener("mousemove", e => {
        if (resizing) {
            pane.style.maxHeight = `calc(${pane.parentElement.clientHeight}px - 2em)`;
            pane.style.height = document.body.clientHeight - e.clientY + "px";
        }
    });
}


export function init() {
    for (const pane of document.getElementsByClassName("pane")) {
        initPane(pane);
    }
}