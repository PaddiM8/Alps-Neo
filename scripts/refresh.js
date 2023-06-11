import * as actions from "./actions";
import * as mailList from "./components/mailList";
import * as mailboxList from "./components/mailboxList";

const mailListElement = document.getElementById("mail-list");
let activeScrollWatcher = false;

async function loadSelectedMailbox() {
    const previousSelected = mailList.getSelected().map(x => mailList.getUid(x));
    await mailList.loadMailbox(mailboxList.getName(mailboxList.getSelected()), false)

    for (const i in previousSelected) {
        const uid = previousSelected[i];
        const entry = mailListElement.querySelector(`.mail-entry[data-uid="${uid}"]`);
        if (i == 0) {
            await mailList.selectEntry(entry);
        } else {
            mailList.selectEntryNoLoad(entry);
        }
    }
}

function isMailListScrollNearTop() {
    return mailListElement.children.length < 50 ||
        mailListElement.children[49].offsetTop > mailListElement.scrollTop + mailListElement.clientHeight;
}

function handleScroll() {
    if (isMailListScrollNearTop()) {
        loadSelectedMailbox();
        mailListElement.removeEventListener("scroll", handleScroll);
        activeScrollWatcher = false;
    }
}

export async function all() {
    mailboxes();

    if (isMailListScrollNearTop()) {
        loadSelectedMailbox();

        return;
    }

    if (!activeScrollWatcher) {
        mailListElement.addEventListener("scroll", handleScroll);
        activeScrollWatcher = true;
    }
}

export async function mailboxes() {
    const selectedMailbox = mailboxList.getName(mailboxList.getSelected());
    const mailboxesHtml = await (await actions.get("/mailbox/INBOX?showMailboxes")).text();
    document.getElementById("mailbox-list-container").innerHTML = mailboxesHtml;
    mailboxList.init(false);

    const mailboxEntry = mailboxList.getMailboxByName(selectedMailbox);
    mailboxList.selectMailbox(mailboxEntry, false);
}