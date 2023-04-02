import * as mailContent from "../mailContent";

const mailList = document.getElementById("mail-list");
const mailDisplay = document.getElementById("mail-display");
const shadowContent = document.createElement("div");
let lastSelectedEntry = null;
let lastLoadedPage = null;
let lastLoadSuccessful = true;
let mailboxName = "Inbox";

async function loadEntries() {
    const page = lastLoadedPage == null
        ? 0
        : lastLoadedPage + 1;

    try {
        const previousLength = mailList.children.length;
        const entries = await fetch(`/mailbox/${mailboxName}?page=${page}`);
        mailList.insertAdjacentHTML("beforeend", await entries.text());
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
    return lastLoadSuccessful &&
        mailList.children.length > 0 &&
        Math.abs(mailList.scrollHeight - mailList.scrollTop - mailList.clientHeight) < 10;
}

async function selectEntry(entry, remoteContent) {
    if (lastSelectedEntry) {
        lastSelectedEntry.classList.remove("active");
    }

    entry.classList.add("active");

    const uid = entry.getAttribute("data-uid");
    const part = +entry.getAttribute("data-part") + 1;
    const remoteContentString = remoteContent ? "&allow-remote-resources=1" : "";
    const mail = await fetch(`/message/${mailboxName}/${uid}?part=${part}${remoteContentString}`);
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

    lastSelectedEntry = entry;
}

export async function removeSelected() {
    mailList.removeChild(lastSelectedEntry);
    await selectEntry(mailList.firstElementChild);
}

export async function loadMailbox(name) {
    mailboxName = name;
    mailList.innerHTML = "";
    lastSelectedEntry = null;
    lastLoadedPage = null;
    lastLoadSuccessful = true;

    await loadEntries();

    while (shouldLoadMore())
        await loadEntries();

    if (mailList.children.length > 0) {
        await selectEntry(mailList.firstElementChild);
    }
}

export async function init() {
    mailList.addEventListener("scroll", async () => {
        if (shouldLoadMore()) {
            await loadEntries();
        }
    });
}