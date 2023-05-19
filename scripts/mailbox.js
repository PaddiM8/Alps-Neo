import * as compose from "./components/compose";
import * as mailList from "./components/mailList";
import * as pane from "./components/pane";

const composeButton = document.getElementById("compose-button");
const composePane = document.getElementById("compose-pane");
const mailboxes = document.getElementById("mailboxes");
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

export async function init() {
    composeButton.addEventListener("click", () => {
        compose.intoNewMail(composePane);
        pane.show(composePane);
    });

    activeMailbox.classList.add("active");
    await mailList.loadMailbox(activeMailbox.getAttribute("data-name"));

    for (const mailboxEntry of mailboxes.getElementsByClassName("mailbox-entry")) {
        mailboxEntry.addEventListener("click", async () => {
            await mailboxSelected(mailboxEntry);
        });
    }

    const unread = getUnreadCountFromMailbox("Inbox");
    document.title = `(${unread}) ` + initialTitle;
}