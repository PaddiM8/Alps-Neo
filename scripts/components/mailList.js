import * as mailContent from "./mailContent";
import * as actions from "../actions";
import * as moveMenu from "./moveMenu";
import * as contextMenu from "./contextMenu";
import * as dragDrop from "./dragDrop";
import * as settings from "../settings";
import { getUnreadCountFromSelected, setUnreadCountFromSelected } from "./mailboxList";
import * as DOMPurify from "dompurify";

const mailList = document.getElementById("mail-list");
const mailDisplay = document.getElementById("mail-display");
const actionsPanel = document.querySelector(".middle .actions");
const searchInput = actionsPanel.querySelector(".search");
const shadowContent = document.createElement("div");
let selectedEntries = [];
let lastLoadedPage = null;
let lastLoadSuccessful = true;
let mailboxName = "Inbox";

async function fetchPage(mailboxName, page, query) {
    const queryString = query?.length > 0
        ? `&query=${query}`
        : "";
    const entriesResult = await fetch(`/mailbox/${encodeURIComponent(mailboxName)}?page=${page}${queryString}`);
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
            await selectEntry(entry, !e.ctrlKey);
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
        const query = searchInput.value;
        const entries = (await fetchPage(mailboxName, page, query)).trim();
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

const purify = {
    attributesToProxy: ["href", "src", "action"],
    allowRemoteContent: true,
    hasRemoteContent: false,
};
DOMPurify.addHook("afterSanitizeAttributes", node => {
    purify.hasRemoteContent = false;

    node.setAttribute("target", "_blank");

    for (const attribute of purify.attributesToProxy) {
        if (!node.hasAttribute(attribute)) {
            continue
        }

        purify.hasRemoteContent = true;
        const url = settings.get()["proxy_images"]
            ? "/proxy?allow-http=1&src=" + encodeURIComponent(node.getAttribute(attribute))
            : node.getAttribute(attribute);

        node.setAttribute(
            attribute,
            purify.allowRemoteContent ? url : ""
        );
    }
});

function setAllowRemoteContent(allowRemoteContent) {
    purify.allowRemoteContent = allowRemoteContent;
}

function sanitizerBlockedContent() {
    return purify.hasRemoteContent && !purify.allowRemoteContent;
}

export async function selectEntry(entry, clearSelectionFirst = true, overrideRemoteContent = false) {
    enableActions();

    const uid = getUid(entry);
    const mail = await fetch(`/message/${encodeURIComponent(mailboxName)}/${uid}?preferredContentType=text%2Fhtml&sanitize=0`);
    var dom = document.implementation.createHTMLDocument();
    dom.body.innerHTML = await mail.text();
    const iframe = dom.querySelector("iframe");
    if (iframe) {
        setAllowRemoteContent(overrideRemoteContent || settings.get()["remote_content"]);
        const sanitized = DOMPurify.sanitize(iframe.srcdoc);
        shadowContent.innerHTML = sanitized;

        const mailBody = iframe.parentNode;
        mailBody.removeChild(iframe);
        const shadow = mailBody.attachShadow({ mode: "open" });
        shadow.appendChild(shadowContent);
        mailBody.classList.add("html");
    }

    mailDisplay.innerHTML = "";
    for (const child of dom.body.children) {
        mailDisplay.appendChild(child);
    }

    const remoteContentWarning = mailDisplay.querySelector(".remote-content");
    if (sanitizerBlockedContent()) {
        remoteContentWarning.style.display = "";
    }

    const remoteContentButton = remoteContentWarning?.querySelector(".remote-content-button");
    if (overrideRemoteContent && remoteContentWarning) {
        remoteContentWarning.parentElement.removeChild(remoteContentWarning);
    } else if (remoteContentButton) {
        remoteContentButton.onclick = async () => {
            await selectEntry(entry, false, true);
        };
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
        await selectEntry(selectedEntries[Math.max(0, index - 1)], false);
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

function clear() {
    lastLoadedPage = null;
    lastLoadSuccessful = true;
    selectedEntries = [];
}

export async function loadMailbox(name, selectFirst = true) {
    mailboxName = name;
    clear();

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

    let searchTimeout = null;
    searchInput.addEventListener("keydown", async e => {
        if (e.key == "Enter") {
            clear();
            await loadEntries();

            return;
        }

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(async () => {
            clear();
            await loadEntries();
        }, 750);
    });
    searchInput.addEventListener("input", async () => {
        if (searchInput.value.length == 0) {
            clear();
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