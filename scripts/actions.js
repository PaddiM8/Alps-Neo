import * as dialog from "./components/dialog";
import * as mailList from "./components/mailList";

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