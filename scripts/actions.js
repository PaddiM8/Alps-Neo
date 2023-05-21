import * as dialog from "./components/dialog";
import * as mailList from "./components/mailList";
import * as toast from "./components/toast";
import * as mailbox from "./mailbox";

export async function removeMail(id, mailbox) {
    const confirmation = await dialog.showYesNo(
        "Delete Mail",
        "Are you sure you want to delete this mail?",
        true
    );

    if (confirmation == "yes") {
        const formData = new FormData();
        formData.append("uids", id);
        await fetch(`/message/${mailbox}/delete`, {
            method: "POST",
            credentials: "same-origin",
            body: formData,
        });

        await mailList.removeSelected();
    }
}

export async function markEmailIsRead(id, mailbox, read) {
    const formData = new FormData();
    formData.append("uids", id);
    formData.append("action", read ? "add" : "remove");
    formData.append("flags", "\\Seen");

    await fetch(`/message/${mailbox}/flag`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });
}

export async function moveToMailbox(name, mailEntry) {
    const formData = new FormData();
    formData.append("to", name);
    formData.append("uids", mailEntry.getAttribute("data-uid"));

    const url = `/message/${mailbox.getName(mailbox.getSelected())}/move`;
    const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    if (response.status == 200) {
        mailEntry.parentElement.removeChild(mailEntry);
    } else {
        toast.show("Unable to move mail(s)", "error");
    }
}