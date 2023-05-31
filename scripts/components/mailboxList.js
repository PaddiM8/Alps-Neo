import * as compose from "./compose";
import * as mailList from "./mailList";
import * as pane from "./pane";
import * as dialog from "./dialog";
import * as toast from "./toast";
import * as contextMenu from "./contextMenu";
import * as actions from "../actions";

const composeButton = document.getElementById("compose-button");
const composePane = document.getElementById("compose-pane");
const mailboxes = document.getElementById("mailboxes");
const createFolderButton = document.getElementById("create-folder");
const initialMailbox = getMailboxByName(mailboxes.getAttribute("data-selected"));
const initialTitle = document.title;
let activeMailbox = initialMailbox;

function getMailboxByName(name) {
    return mailboxes.querySelector(`.mailbox-entry[data-name="${name}"]`);
}

export function getAll() {
    const names = [];
    for (const mailbox of mailboxes.getElementsByClassName("mailbox-entry")) {
        names.push(mailbox.getAttribute("data-name"));
    }

    return names;
}

export function getSelected() {
    return activeMailbox;
}

export function getName(mailboxEntry) {
    return mailboxEntry.getAttribute("data-name");
}

window.onpopstate = async e => {
    if (e.state) {
        if (e.state.mailboxName != activeMailbox.getAttribute("data-name")) {
            await selectMailbox(getMailboxByName(e.state.mailboxName));
        }
    } else {
        await selectMailbox(initialMailbox);
    }
};

async function selectMailbox(mailboxEntry) {
    activeMailbox.querySelector(".self").classList.remove("active");
    mailboxEntry.querySelector(".self").classList.add("active");

    const mailboxName = mailboxEntry.getAttribute("data-name");
    mailboxes.setAttribute("data-selected", mailboxName);
    await mailList.loadMailbox(mailboxName);

    activeMailbox = mailboxEntry;
    window.history.pushState(
        { mailboxName: mailboxName },
        "",
        `/mailbox/${mailboxName}`
    );
}

export function setUnreadCountFromSelected(value) {
    value = Math.max(value, 0);
    activeMailbox.setAttribute("data-unread", value);
    activeMailbox.querySelector(".unread-count").textContent = value == 0
        ? ""
        : value;

    if (activeMailbox.getAttribute("data-name") == "Inbox") {
        document.title = value == 0
            ? initialTitle
            : `(${value}) ` + initialTitle;
    }
}

export function getUnreadCountFromSelected() {
    return Number(activeMailbox.getAttribute("data-unread"));
}

function getUnreadCountFromMailbox(mailboxName) {
    return Number(getMailboxByName(mailboxName).getAttribute("data-unread"));
}

async function promptCreateSubfolder(parentMailboxEntry) {
    const result = await dialog.showInput("Create subfolder", "Choose a subfolder name", "Folder name...");
    if (!result) {
        return;
    }

    if (result.includes(" ")) {
        toast.show("Mailbox name cannot contain whitespace", "error");
        return;
    }

    let path = parentMailboxEntry.getAttribute("data-name") + "/" + result;
    if (await actions.createMailbox(path)) {
        createEntry(parentMailboxEntry.querySelector(".children"), result);
    } else {
        toast.show("Failed to create mailbox", "error");
    }
}

async function promptDelete(entry, mailboxName) {
    const result = await dialog.showYesNo("Delete mailbox", `Are you sure you want to delete '${mailboxName}'?`, true);
    if (result != "yes") {
        return;
    }

    const formData = new FormData();
    const response = await fetch(`/delete-mailbox/${encodeURI(mailboxName)}`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    if (response.status == 200) {
        const container = entry.parentElement;
        container.removeChild(entry);

        if (container.children.length == 0) {
            const arrow = container.parentElement.querySelector(".arrow");
            if (arrow) {
                arrow.parentElement.removeChild(arrow);
            }
        }
    } else {
        toast.show("Failed to delete mailbox.", "error");
    }
}

function mouseEnter(entry) {
    let menuButton = entry.querySelector(".self .menu-button");
    if (menuButton) {
        menuButton.classList.remove("hidden");
    } else {
        menuButton = document.createElement("i");
        menuButton.className = "menu-button fas fa-ellipsis-vertical";
        entry.querySelector(".self").appendChild(menuButton);

        const mailboxName = entry.querySelector(".name").textContent.trim();
        menuButton.addEventListener("click", () => {
            contextMenu.showByElement([
                {
                    icon: "fa-folder",
                    name: "Create subfolder",
                    action: async () => await promptCreateSubfolder(entry)
                },
                {
                    icon: "fa-trash",
                    name: "Delete",
                    action: async () => await promptDelete(entry, mailboxName)
                }
            ], menuButton);
        });
    }
}

function mouseLeave(entry) {
    entry.querySelector(".menu-button")?.classList.add("hidden");
}

function createArrow(entry) {
    const childContainer = entry.querySelector(".children");
    const arrow = document.createElement("i");
    arrow.className = "arrow fas";

    const isClosed = entry.querySelector(".children").classList.contains("hidden");
    arrow.classList.add(isClosed ? "fa-angle-right" : "fa-angle-down");

    arrow.addEventListener("click", () => {
        arrow.classList.toggle("fa-angle-right");
        arrow.classList.toggle("fa-angle-down");
        childContainer.classList.toggle("hidden");
    });
    entry.querySelector(".self").insertAdjacentElement("afterbegin", arrow);

    return arrow;
}

function createEntry(container, name, unreadCount = 0) {
    const newMailbox = mailboxes.querySelector(".standard-mailboxes").lastElementChild.cloneNode(true)
    newMailbox.querySelector(".name").textContent = name;
    newMailbox.querySelector(".icon").className = "icon fas fa-folder";
    newMailbox.querySelector(".unread-count").textContent = unreadCount == 0 ? "" : unreadCount;
    newMailbox.setAttribute("data-name", name);
    newMailbox.setAttribute("data-unread", unreadCount);
    container.appendChild(newMailbox);

    const parentEntry = container.parentElement;
    if (parentEntry.classList.contains("mailbox-entry")) {
        const parentSelf = container.parentElement.querySelector(".self");
        if (!parentSelf.querySelector(".arrow")) {
            createArrow(parentEntry);
        }
    }

    return newMailbox;
}

function buildEntryTree(containerElement, tree) {
    for (const name in tree) {
        const folder = tree[name];
        containerElement.appendChild(folder.entry);
        folder.entry.querySelector(".name").textContent = name;
        if (!folder.children || !Object.keys(folder.children).length) {
            continue;
        }

        const arrow = createArrow(folder.entry);
        folder.entry.querySelector(".self").insertAdjacentElement("afterbegin", arrow);

        buildEntryTree(
            folder.entry.querySelector(".children"),
            folder.children
        );
    }
}

function nestChildren() {
    const folders = {};
    const additionalMailboxes = mailboxes.querySelector(".additional-mailboxes");
    const entries = additionalMailboxes.getElementsByClassName("mailbox-entry");
    for (const entry of entries) {
        const path = entry.getAttribute("data-name").split("/");
        let obj = { children: folders };
        let objName = "";
        while (path.length > 0) {
            const name = path.shift();
            objName += objName ? "/" + name : name;
            if (!(name in obj.children)) {
                const parentContainer = obj.entry?.querySelector(".children") ?? additionalMailboxes;
                obj.children[name] = {
                    entry: getMailboxByName(objName) ?? createEntry(parentContainer, objName),
                    children: {}
                };
            }

            obj = obj.children[name];
        }
    }

    additionalMailboxes.innerHTML = "";
    buildEntryTree(additionalMailboxes, folders);
}

export async function init() {
    nestChildren();

    composeButton.addEventListener("click", () => {
        compose.intoNewMail(composePane);
        pane.show(composePane);
    });
    createFolderButton.addEventListener("click", async () => {
        const name = await dialog.showInput("Create folder", "Choose a folder name", "Folder name...");
        if (!name) {
            return;
        }

        if (await actions.createMailbox(name)) {
            createEntry(mailboxes.querySelector(".additional-mailboxes"), name);
        } else {
            toast.show("Failed to create mailbox", "error");
        }
    });

    activeMailbox.classList.add("active");
    await mailList.loadMailbox(activeMailbox.getAttribute("data-name"));

    for (const entry of mailboxes.getElementsByClassName("mailbox-entry")) {
        const self = entry.querySelector(".self");
        self.addEventListener("click", async e => {
            if (!e.target.classList.contains("menu-button") &&
                !e.target.classList.contains("arrow")) {
                await selectMailbox(entry);
            }
        });
        self.addEventListener("mouseenter", async () => {
            mouseEnter(entry);
        });
        self.addEventListener("mouseleave", async () => {
            mouseLeave(entry);
        });
    }

    const unread = getUnreadCountFromMailbox("Inbox");
    document.title = `(${unread}) ` + initialTitle;
}