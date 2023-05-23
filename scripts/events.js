import * as mailList from "./components/mailList";
import * as mailbox from "./components/mailboxList";

async function updateMailbox(name) {
    await mailList.reload(name);
}

export function init() {
    const source = new EventSource("/events/new-mail");
    source.addEventListener("message", async event => {
        const data = event.data;
        const separationIndex = data.indexOf(":");
        const type = data.slice(0, separationIndex);
        const value = data.slice(separationIndex + 1).trim();

        if (type == "mailbox") {
            let mailboxName = value == "INBOX"
                ? "Inbox"
                : value;

            // TODO: Update the unread count if the mailbox isn't selected
            if (mailbox.getName(mailbox.getSelected()) == mailboxName) {
                await updateMailbox(mailboxName);
            }
        } else {
            console.log(type, value);
        }
    });
}