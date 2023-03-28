function humanFileSize(number) {
    if (number < 1024) {
        return `${number} bytes`;
    } else if (number >= 1024 && number < 1048576) {
        return `${(number / 1024).toFixed(1)} KB`;
    } else if (number >= 1048576) {
        return `${(number / 1048576).toFixed(1)} MB`;
    }
}

function addFile(fileDrop, fileInfo) {
    const fileList = fileDrop.querySelector(".list");
    const file = document.createElement("span");
    file.className = "file";

    const name = document.createElement("span");
    name.className = "name";
    name.innerHTML = fileInfo.name;
    const size = document.createElement("span");
    size.className = "size"
    size.innerHTML = humanFileSize(fileInfo.size);
    const remove = document.createElement("span");
    remove.className = "remove"
    remove.innerHTML = "×";
    remove.addEventListener("click", () => {
        fileList.removeChild(file);
    });

    file.append(name, size, remove);
    fileList.appendChild(file);
}

function browsedFiles(fileDrop, input) {
    for (const file of input.files) {
        addFile(fileDrop, file);
    }
}

function fileDropped(fileDrop, event) {
    event.preventDefault();

    for (const item of event.dataTransfer.items) {
        if (item.kind == "file") {
            addFile(fileDrop, item.getAsFile());
        }
    }

    draggedAway(fileDrop);
}

function draggedOver(fileDrop, event) {
    event.preventDefault();
    fileDrop.classList.add("dragging-over");
}

function draggedAway(fileDrop) {
    fileDrop.classList.remove("dragging-over");
}

export function init() {
    for (const fileDrop of document.getElementsByClassName("file-drop")) {
        const input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";
        input.multiple = true;
        input.ariaHidden = true;

        // Give it a proper max height to make sure it
        // overflows. It should not expand to fit the items.
        fileDrop.style.maxHeight = fileDrop.clientHeight + "px";

        fileDrop.querySelector("button").addEventListener("click", () => {
            input.click();
        });
        fileDrop.addEventListener("drop", e => fileDropped(fileDrop, e));
        fileDrop.addEventListener("dragover", e => draggedOver(fileDrop, e));
        fileDrop.addEventListener("dragleave", e => draggedAway(fileDrop));

        input.addEventListener("change", () => browsedFiles(fileDrop, input));
    }
}