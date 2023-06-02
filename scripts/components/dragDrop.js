let dragged = null;

export function getDragged() {
    return dragged;
}

export function makeDraggable(element) {
    element.setAttribute("draggable", true);
    element.addEventListener("dragstart", () => {
        dragged = element;
    });
    element.addEventListener("dragend", () => {
        dragged = null;
    });
}

export function makeDropTarget(element, draggableClass, callback) {
    element.addEventListener("dragover", e => {
        e.preventDefault();

        if (!dragged?.classList.contains(draggableClass)) {
            return;
        }

        element.classList.add("drag-over");
    });
    element.addEventListener("dragleave", e => {
        e.preventDefault()
        element.classList.remove("drag-over");
    });
    element.addEventListener("drop", e => {
        e.preventDefault();
        if (!dragged?.classList.contains(draggableClass)) {
            return;
        }

        element.classList.remove("drag-over");
        callback(dragged);
        dragged = null;
    });
}