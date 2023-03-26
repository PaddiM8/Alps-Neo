const mailList = document.getElementById("mail-list");
const mailPane = document.getElementById("mail-pane");
const shadowContent = document.createElement("div");
let lastSelectedEntry = null;

async function selectEntry(entry) {
    entry.classList.add("active");
    if (lastSelectedEntry) {
        lastSelectedEntry.classList.remove("active");
    }

    const uid = entry.getAttribute("data-uid");
    const part = +entry.getAttribute("data-part") + 1;
    const mail = await fetch(`/message/INBOX/${uid}?part=${part}`);
    mailPane.innerHTML = await mail.text();
    const iframe = mailPane.querySelector("iframe");

    if (iframe) {
        const content = iframe.srcdoc;
        shadowContent.innerHTML = content;

        const mailBody = iframe.parentNode;
        mailBody.removeChild(iframe)
        const shadow = mailBody.attachShadow({ mode: "closed" });
        shadow.appendChild(shadowContent);
    }

    lastSelectedEntry = entry;
}

async function init() {
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