function humanFileSize(number) {
    if (number < 1024) {
        return `${number} bytes`;
    } else if (number >= 1024 && number < 1048576) {
        return `${(number / 1024).toFixed(1)} KB`;
    } else if (number >= 1048576) {
        return `${(number / 1048576).toFixed(1)} MB`;
    }
}

async function removeRemoteFile(fileDrop, fileElement) {
    const removeClient = new XMLHttpRequest();
    const uuid = fileElement.getAttribute("data-uuid");
    if (uuid) {
        removeClient.open("POST", `/compose/attachment/${uuid}/remove`);
        removeClient.send();
    }
}

export function addFileEntry(fileDrop, name, size, isAvailableNow = false) {
    const fileList = fileDrop.querySelector(".list");
    const fileElement = document.createElement("span");
    fileElement.className = "file";

    if (isAvailableNow) {
        fileElement.classList.add("available");
    }

    const nameElement = document.createElement("span");
    nameElement.className = "name";
    nameElement.innerHTML = name;

    const sizeElement = document.createElement("span");
    sizeElement.className = "size"
    if (size) {
        sizeElement.innerHTML = humanFileSize(size);
    }

    const removeElement = document.createElement("span");
    removeElement.className = "remove"
    removeElement.innerHTML = "×";
    removeElement.addEventListener("click", () => {
        fileDrop.querySelector(".list").removeChild(fileElement);
    });

    fileElement.append(nameElement, sizeElement, removeElement);
    fileList.appendChild(fileElement);

    return fileElement;
}

async function uploadFile(fileDrop, fileInfo) {
    const fileElement = addFileEntry(fileDrop, fileInfo.name, fileInfo.size);

    // Upload the file and update the progress bar
    const client = new XMLHttpRequest();
    client.open("POST", "/compose/attachment");

    client.upload.onprogress = progress => {
        fileElement.style.setProperty(
            "--progress",
            (progress.loaded / progress.total) * 100 + "%"
        );
    };

    client.onloadend = () => {
        if (client.status == 200) {
            try {
                const response = JSON.parse(client.responseText);
                fileElement.setAttribute("data-uuid", response[0]);
                fileElement.classList.add("uploaded");
            } catch {
                fileElement.classList.add("failed");
            }
        } else {
            fileElement.classList.add("failed");
        }
    };

    fileElement.querySelector(".remove").addEventListener("click", async () => {
        if (client.LOADING) {
            client.abort();
        }

        await removeRemoteFile(fileDrop, fileElement);
    });


    let formData = new FormData();
    formData.append("attachments", fileInfo);
    client.send(formData);
}

async function browsedFiles(fileDrop, input) {
    for (const file of input.files) {
        await uploadFile(fileDrop, file);
    }
}

async function fileDropped(fileDrop, event) {
    event.preventDefault();

    for (const item of event.dataTransfer.items) {
        if (item.kind == "file") {
            await uploadFile(fileDrop, item.getAsFile());
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

export function clearUuids(fileDrop) {
    const list = fileDrop.querySelector(".list");
    for (const attachment of list.children) {
        attachment.setAttribute("data-uuid", "");
    }
}

export async function clear(fileDrop) {
    const list = fileDrop.querySelector(".list");
    for (const attachment of list.children) {
        await removeRemoteFile(fileDrop, attachment);
    }

    list.innerHTML = "";
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
        fileDrop.addEventListener("drop", async e => await fileDropped(fileDrop, e));
        fileDrop.addEventListener("dragover", e => draggedOver(fileDrop, e));
        fileDrop.addEventListener("dragleave", () => draggedAway(fileDrop));

        input.addEventListener("change", async () => await browsedFiles(fileDrop, input));
    }
}