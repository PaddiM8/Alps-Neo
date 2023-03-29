function humanFileSize(number) {
    if (number < 1024) {
        return `${number} bytes`;
    } else if (number >= 1024 && number < 1048576) {
        return `${(number / 1024).toFixed(1)} KB`;
    } else if (number >= 1048576) {
        return `${(number / 1048576).toFixed(1)} MB`;
    }
}

async function removeFile(fileDrop, fileElement) {
    const removeClient = new XMLHttpRequest();
    const uuid = fileElement.getAttribute("data-uuid");
    if (uuid) {
        removeClient.open("POST", `/compose/attachment/${uuid}/remove`);
        removeClient.send();
    }

    fileDrop.querySelector(".list").removeChild(fileElement);
}

async function addFile(fileDrop, fileInfo) {
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

    file.append(name, size, remove);
    fileList.appendChild(file);

    // Upload the file and update the progress bar
    const client = new XMLHttpRequest();
    client.open("POST", "/compose/attachment");

    client.upload.onprogress = progress => {
        file.style.setProperty(
            "--progress",
            (progress.loaded / progress.total) * 100 + "%"
        );
    };

    client.onloadend = () => {
        if (client.status == 200) {
            try {
                const response = JSON.parse(client.responseText);
                file.setAttribute("data-uuid", response[0]);
                file.classList.add("uploaded");
            } catch {
                file.classList.add("failed");
            }
        } else {
            file.classList.add("failed");
        }
    };

    remove.addEventListener("click", async () => {
        if (client.LOADING) {
            client.abort();
        }

        await removeFile(fileDrop, file);
    });


    let formData = new FormData();
    formData.append("attachments", fileInfo);
    client.send(formData);
}

async function browsedFiles(fileDrop, input) {
    for (const file of input.files) {
        await addFile(fileDrop, file);
    }
}

async function fileDropped(fileDrop, event) {
    event.preventDefault();

    for (const item of event.dataTransfer.items) {
        if (item.kind == "file") {
            await addFile(fileDrop, item.getAsFile());
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
        await removeFile(fileDrop, attachment);
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