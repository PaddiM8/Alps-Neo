const mailList = document.getElementById("mail-list");
const mailPane = document.getElementById("mail-pane");
const shadowContent = document.createElement("div");
let lastSelectedEntry = null;
let lastLoadedPage = null;
let lastLoadSuccessful = true;

async function loadEntries() {
    const page = lastLoadedPage + 1 ?? 0;

    try {
        const entries = await fetch(`/mailbox/INBOX?page=${page}`);
        mailList.insertAdjacentHTML("beforeend", await entries.text());
        lastLoadedPage = page;
    } catch {
        lastLoadSuccessful = false;
    }
}

function shouldLoadMore() {
    return lastLoadSuccessful &&
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
    const mail = await fetch(`/message/INBOX/${uid}?part=${part}${remoteContentString}`);
    mailPane.innerHTML = await mail.text();
    const remoteContentButton = mailPane.querySelector(".remote-content-button")
    if (remoteContentButton) {
        remoteContentButton.onclick = () => {
            selectEntry(entry, true);
        };
    }

    const iframe = mailPane.querySelector("iframe");
    if (iframe) {
        const content = iframe.srcdoc;
        shadowContent.innerHTML = content;

        const mailBody = iframe.parentNode;
        mailBody.removeChild(iframe)
        const shadow = mailBody.attachShadow({ mode: "open" });
        shadow.appendChild(shadowContent);
    }

    lastSelectedEntry = entry;
}

async function init() {
    await loadEntries();

    while (shouldLoadMore())
        await loadEntries();

    mailList.onscroll = async () => {
        if (shouldLoadMore()) {
            await loadEntries();
        }
    };

    if (mailList.children) {
        selectEntry(mailList.firstElementChild);
    }

    for (const entry of mailList.children) {
        entry.onclick = async () => {
            await selectEntry(entry);
        }
    }
}

init();