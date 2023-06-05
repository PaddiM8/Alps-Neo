import * as mailContent from "./mailContent";
import * as actions from "../actions";
import * as moveMenu from "./moveMenu";
import * as contextMenu from "./contextMenu";
import * as dragDrop from "./dragDrop";
import { getUnreadCountFromSelected, setUnreadCountFromSelected } from "./mailboxList";

const mailList = document.getElementById("mail-list");
const mailDisplay = document.getElementById("mail-display");
const actionsPanel = document.querySelector(".middle .actions");
const shadowContent = document.createElement("div");
const showRemoteContent = false;
let selectedEntries = [];
let lastLoadedPage = null;
let lastLoadSuccessful = true;
let mailboxName = "Inbox";

async function fetchPage(mailboxName, page) {
    const entriesResult = await fetch(`/mailbox/${encodeURIComponent(mailboxName)}?page=${page}`);
    if (entriesResult.status != 200) {
        lastLoadSuccessful = false;
    }

    return await entriesResult.text();
}

function setUpEntry(entry) {
    dragDrop.makeDraggable(entry);

    entry.onmousedown = async e => {
        if (e.ctrlKey && isEntrySelected(entry)) {
            await unselectEntry(entry);
            return;
        }

        if (!isEntrySelected(entry)) {
            await selectEntry(entry, showRemoteContent, !e.ctrlKey);
        }
    };

    entry.oncontextmenu = e => {
        const isRead = isEntryRead(entry);
        contextMenu.showAtPos([
            {
                icon: isRead ? "fa-envelope" : "fa-envelope-open",
                name: isRead ? "Mark as Unread" : "Mark as Read",
                action: async () => await markIsRead(!isRead)
            },
            {
                icon: "fa-folder",
                name: "Move to Folder",
                action: () => moveMenu.show(selectedEntries, entry)
            },
            {
                icon: "fa-trash",
                name: "Delete",
                action: async () => {
                    const success = await actions.removeMail(
                        selectedEntries.map(x => getUid(x)),
                        mailboxName
                    );

                    if (success) {
                        await removeSelected();
                    }
                }
            }
        ], e.clientX, e.clientY);

        return false;
    };
}

async function loadEntries() {
    const page = lastLoadedPage == null
        ? 0
        : lastLoadedPage + 1;

    try {
        const entries = (await fetchPage(mailboxName, page)).trim();
        if (!entries) {
            lastLoadSuccessful = false;
        }

        // Make sure to clear it after fetching to avoid flickering
        if (lastLoadedPage == null) {
            mailList.innerHTML = "";
        }

        const previousLength = mailList.children.length;
        mailList.insertAdjacentHTML("beforeend", entries);

        if (mailList.children.length == 0) {
            mailList.classList.add("empty");
        } else {
            mailList.classList.remove("empty");
        }

        lastLoadedPage = page;

        for (let i = previousLength; i < mailList.children.length; i++) {
            setUpEntry(mailList.children[i]);
        }
    } catch {
        lastLoadSuccessful = false;
    }
}

function shouldLoadMore() {
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

function clearSelection() {
    for (const entry of selectedEntries) {
        entry.classList.remove("active");
    }

    selectedEntries = [];
}

export async function selectEntry(entry, remoteContent = showRemoteContent, clearSelectionFirst = true) {
    enableActions();

    const uid = getUid(entry);
    const remoteContentString = remoteContent ? "&allow-remote-resources=1" : "";
    const mail = await fetch(`/message/${encodeURIComponent(mailboxName)}/${uid}?preferredContentType=text%2Fhtml${remoteContentString}`);
    mailDisplay.innerHTML = await mail.text();
    const remoteContentButton = mailDisplay.querySelector(".remote-content-button");
    if (remoteContentButton) {
        remoteContentButton.onclick = () => {
            selectEntry(entry, true, false);
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
    if (clearSelectionFirst) {
        clearSelection();
    }

    if (!isEntrySelected(entry)) {
        entry.classList.add("active");
        selectedEntries.push(entry);
    }

    if (!isEntryRead(entry)) {
        setUnreadCountFromSelected(getUnreadCountFromSelected() - 1);
        markIsRead(true).then();
    }

    entry.classList.remove("unread");
}

export function selectEntryNoLoad(entry) {
    if (!isEntrySelected(entry)) {
        entry.classList.add("active");
        selectedEntries.push(entry);
    }
}

async function unselectEntry(entry) {
    entry.classList.remove("active");
    const index = selectedEntries.indexOf(entry);
    if (index == -1) {
        return;
    }

    selectedEntries.splice(index, 1);
    if (selectedEntries.length > 0) {
        await selectEntry(selectedEntries[Math.max(0, index - 1)], showRemoteContent, false);
    }
}

export function getSelected() {
    return selectedEntries;
}

export function getUid(entry) {
    return entry.getAttribute("data-uid");
}

export function getEntryByUid(uid) {
    return mailList.querySelector(`[data-uid="${uid}"]`);
}

function isEntrySelected(entry) {
    return entry.classList.contains("active");
}

function isEntryRead(entry) {
    return !entry.classList.contains("unread");
}

export async function selectFirst() {
    if (mailList.children.length == 0) {
        return;
    }

    await selectEntry(mailList.children[0]);
}

export async function removeSelected() {
    for (const selected of selectedEntries) {
        mailList.removeChild(selected);
    }

    if (mailList.children.length > 0) {
        await selectEntry(mailList.firstElementChild);
    }
}

export async function loadMailbox(name, selectFirst = true) {
    mailboxName = name;
    lastLoadedPage = null;
    lastLoadSuccessful = true;
    selectedEntries = [];

    await loadEntries();

    while (shouldLoadMore()) {
        await loadEntries();
    }

    const mailDisplay = document.getElementById("mail-display");
    if (selectFirst && mailList.children.length > 0 && mailDisplay.children.length == 0) {
        await selectEntry(mailList.firstElementChild);
    }
}

async function markIsRead(read) {
    const uids = selectedEntries.map(x => getUid(x));
    await actions.markEmailIsRead(uids, mailboxName, read);

    const icon = actionsPanel.querySelector(".seen");
    let unreadCountChange = 0;
    for (const entry of selectedEntries) {
        if (read) {
            if (!isEntryRead(entry)) {
                unreadCountChange--;
            }

            entry.classList.remove("unread");
            icon.classList.add("fa-envelope");
            icon.classList.remove("fa-envelope-open");
        } else {
            if (isEntryRead(entry)) {
                unreadCountChange++;
            }

            entry.classList.add("unread");
            icon.classList.remove("fa-envelope");
            icon.classList.add("fa-envelope-open");
        }
    }

    setUnreadCountFromSelected(getUnreadCountFromSelected() + unreadCountChange);
}

export async function init() {
    mailList.addEventListener("scroll", async () => {
        if (shouldLoadMore()) {
            await loadEntries();
        }
    });

    actionsPanel.querySelector(".seen").addEventListener("click", async () => {
        await markIsRead(!isEntryRead(selectedEntries[0]));
    });
    actionsPanel.querySelector(".delete").addEventListener("click", async () => {
        const success = await actions.removeMail(
            selectedEntries.map(x => getUid(x)),
            mailboxName
        );

        if (success) {
            await removeSelected();
        }
    });
    actionsPanel.querySelector(".move").addEventListener("click", async e => {
        moveMenu.show(selectedEntries, e.target);
    });
}