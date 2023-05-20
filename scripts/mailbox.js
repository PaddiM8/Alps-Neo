import * as compose from "./components/compose";
import * as mailList from "./components/mailList";
import * as pane from "./components/pane";
import * as dialog from "./components/dialog";
import * as toast from "./components/toast";
import * as contextMenu from "./components/contextMenu";

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

window.onpopstate = async e => {
    if (e.state) {
        if (e.state.mailboxName != activeMailbox.getAttribute("data-name")) {
            await mailboxSelected(getMailboxByName(e.state.mailboxName));
        }
    } else {
        await mailboxSelected(initialMailbox);
    }
};

async function mailboxSelected(mailboxEntry) {
    activeMailbox.classList.remove("active");
    mailboxEntry.classList.add("active");

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

async function createMailbox(name) {
    const formData = new FormData();
    formData.append("name", name);

    const response = await fetch(`/new-mailbox`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    if (response.status == 200) {
        entry = `
            <div class="mailbox-entry" data-name="${name}" data-unread="0">
                <i class="icon fas fa-folder"></i>
                <span class="name">
                    ${name}
                </span>
                <span class="unread-count"></span>
            </div>
        `;
        mailboxes.querySelector(".additional-mailboxes").insertAdjacentHTML("beforeend", entry);
    } else {
        toast.show("Failed to create mailbox", "error");
    }
}

export function setUnreadCountFromSelected(value) {
    activeMailbox.setAttribute("data-unread", value);
    activeMailbox.querySelector(".unread-count").textContent = value;

    if (activeMailbox.getAttribute("data-name") == "Inbox") {
        document.title = `(${value}) ` + initialTitle;
    }
}

export function getUnreadCountFromSelected() {
    return Number(activeMailbox.getAttribute("data-unread"));
}

function getUnreadCountFromMailbox(mailboxName) {
    return Number(getMailboxByName(mailboxName).getAttribute("data-unread"));
}

async function promptCreateSubfolder(mailboxName) {
    const result = await dialog.showInput("Create subfolder", "Choose a subfolder name", "Folder name...");
    if (!result) {
        return;
    }

    alert("Unimplemented. Would've created a folder under: " + mailboxName);
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
        entry.parentElement.removeChild(entry);
    } else {
        toast.show("Failed to delete mailbox.", "error");
    }
}

function mouseEnter(entry) {
    let menuButton = entry.querySelector(".menu-button");
    if (menuButton) {
        menuButton.classList.remove("hidden");
    } else {
        menuButton = document.createElement("i");
        menuButton.className = "menu-button fas fa-ellipsis-vertical";
        entry.appendChild(menuButton);

        const mailboxName = entry.querySelector(".name").textContent.trim();
        menuButton.addEventListener("click", () => {
            const rect = menuButton.getBoundingClientRect();
            contextMenu.show([
                {
                    icon: "fa-folder",
                    name: "Create subfolder",
                    action: async () => await promptCreateSubfolder(mailboxName)
                },
                {
                    icon: "fa-trash",
                    name: "Delete",
                    action: async () => await promptDelete(entry, mailboxName)
                }
            ], rect.top, rect.left);
        });
    }
}

function mouseLeave(entry) {
    entry.querySelector(".menu-button")?.classList.add("hidden");
}

export async function init() {
    composeButton.addEventListener("click", () => {
        compose.intoNewMail(composePane);
        pane.show(composePane);
    });
    createFolderButton.addEventListener("click", async () => {
        const name = await dialog.showInput("Create folder", "Choose a folder name", "Folder name...");
        if (name) {
            createMailbox(name);
        }
    });

    activeMailbox.classList.add("active");
    await mailList.loadMailbox(activeMailbox.getAttribute("data-name"));

    for (const entry of mailboxes.getElementsByClassName("mailbox-entry")) {
        entry.querySelector(".name").addEventListener("click", async () => {
            await mailboxSelected(entry);
        });
        entry.addEventListener("mouseenter", async () => {
            mouseEnter(entry);
        });
        entry.addEventListener("mouseleave", async () => {
            mouseLeave(entry);
        });
    }

    const unread = getUnreadCountFromMailbox("Inbox");
    document.title = `(${unread}) ` + initialTitle;
}