import * as mailContent from "../mailContent";
import * as actions from "../actions";
import { getUnreadCountFromSelected, setUnreadCountFromSelected } from "../mailbox";

const mailList = document.getElementById("mail-list");
const mailDisplay = document.getElementById("mail-display");
const actionsPanel = document.querySelector(".middle .actions");
const shadowContent = document.createElement("div");
let lastSelectedEntry = null;
let lastLoadedPage = null;
let lastLoadSuccessful = true;
let mailboxName = "Inbox";

async function fetchPage(mailboxName, page) {
    const entriesResult = await fetch(`/mailbox/${mailboxName}?page=${page}`);
    return await entriesResult.text();
}

async function loadEntries() {
    const page = lastLoadedPage == null
        ? 0
        : lastLoadedPage + 1;

    try {
        const previousLength = mailList.children.length;
        const entries = await fetchPage(mailboxName, page);

        // Make sure to clear it after fetching to avoid flickering
        if (lastLoadedPage == null) {
            mailList.innerHTML = "";
        }

        mailList.insertAdjacentHTML("beforeend", entries);
        lastLoadedPage = page;

        for (let i = previousLength; i < mailList.children.length; i++) {
            const entry = mailList.children[i];
            entry.onclick = async () => {
                await selectEntry(entry);
            }
        }
    } catch {
        lastLoadSuccessful = false;
    }
}

function shouldLoadMore() {
    return false;
    return lastLoadSuccessful &&
        mailList.children.length > 0 &&
        Math.abs(mailList.scrollHeight - mailList.scrollTop - mailList.clientHeight) < 10;
}

function enableActions() {
    for (const action of actionsPanel.children) {
        if (action.classList.contains("action")) {
            action.removeAttribute("disabled");
        }
    }
}

async function selectEntry(entry, remoteContent) {
    if (lastSelectedEntry) {
        lastSelectedEntry.classList.remove("active");
    }

    entry.classList.add("active");
    enableActions();

    const uid = entry.getAttribute("data-uid");
    const remoteContentString = remoteContent ? "&allow-remote-resources=1" : "";
    const mail = await fetch(`/message/${mailboxName}/${uid}?preferredContentType=text%2Fhtml${remoteContentString}`);
    mailDisplay.innerHTML = await mail.text();
    const remoteContentButton = mailDisplay.querySelector(".remote-content-button")
    if (remoteContentButton) {
        remoteContentButton.onclick = () => {
            selectEntry(entry, true);
        };
    }

    const iframe = mailDisplay.querySelector("iframe");
    if (iframe) {
        const content = iframe.srcdoc;
        shadowContent.innerHTML = content;

        const mailBody = iframe.parentNode;
        mailBody.removeChild(iframe)
        const shadow = mailBody.attachShadow({ mode: "open" });
        shadow.appendChild(shadowContent);
    }

    mailContent.init();
    setUnreadCountFromSelected(getUnreadCountFromSelected() - 1);
    lastSelectedEntry = entry;

    if (entry.classList.contains("unread")) {
        markIsRead(true).then();
    }

    entry.classList.remove("unread");
}

export async function reload(name) {
    const previousSelected = lastSelectedEntry.getAttribute("data-uid");
    mailList.innerHTML = "";
    await loadMailbox(name);

    if (previousSelected) {
        await selectEntry(mailList.querySelector(`[data-uid='${previousSelected}']`));
    }
}

export async function removeSelected() {
    mailList.removeChild(lastSelectedEntry);
    await selectEntry(mailList.firstElementChild);
}

export async function loadMailbox(name) {
    mailboxName = name;
    lastSelectedEntry = null;
    lastLoadedPage = null;
    lastLoadSuccessful = true;

    await loadEntries();

    while (shouldLoadMore())
        await loadEntries();

    const mailDisplay = document.getElementById("mail-display");
    if (mailList.children.length > 0 && mailDisplay.children.length == 0) {
        await selectEntry(mailList.firstElementChild);
    }
}

async function markIsRead(read) {
    const uid = lastSelectedEntry.getAttribute("data-uid");
    await actions.markEmailIsRead(uid, mailboxName, read);

    const icon = actionsPanel.querySelector(".seen");
    if (read) {
        lastSelectedEntry.classList.remove("unread");
        icon.classList.add("fa-envelope");
        icon.classList.remove("fa-envelope-open");
    } else {
        lastSelectedEntry.classList.add("unread");
        icon.classList.remove("fa-envelope");
        icon.classList.add("fa-envelope-open");
    }
}

export async function init() {
    mailList.addEventListener("scroll", async () => {
        if (shouldLoadMore()) {
            await loadEntries();
        }
    });

    actionsPanel.querySelector(".seen").addEventListener("click", async () => {
        await markIsRead(lastSelectedEntry.classList.contains("unread"));
    });
    actionsPanel.querySelector(".delete").addEventListener("click", async () => {
        await actions.removeMail(lastSelectedEntry.getAttribute("data-uid"), mailboxName);
    });
}