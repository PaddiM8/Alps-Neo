import * as dialog from "./components/dialog";
import * as mailbox from "./components/mailboxList";

export async function getPreviousAttachments(mailbox, mailId, textPart) {
    const result = await fetch(`/message/${encodeURIComponent(mailbox)}/${mailId}/forward?part=${textPart}`);
    const lines = (await result.text()).split("\n");
    const attachments = [];
    for (const line of lines) {
        if (!line.trim()) {
            continue;
        }

        const trimmedLine = line.trim();
        if (attachments.length == 0 ||
            Object.keys(attachments[attachments.length - 1]).length == 2) {
            attachments.push({
                partString: trimmedLine
            });
        } else {
            attachments[attachments.length - 1]["name"] = trimmedLine;
        }
    }

    return attachments;
}

async function generateMessageId() {
    const result = await fetch("/compose");
    if (!result.ok) {
        return null;
    }

    const text = (await result.text()).trim();

    return "<" + text.slice(4, -4) + ">";
}

export async function sendMail(data) {
    const formData = new FormData();
    formData.append("from", data.from);
    formData.append("to", data.to);
    formData.append("subject", data.subject);
    formData.append("text", data.text);
    formData.append("html", data.html);
    formData.append("attachment-uuids", data.attachmentUuids.join(","));
    formData.append("content_type", "text/html");

    for (const prevAttachment of data.prevAttachments ?? []) {
        formData.append("prev_attachments", prevAttachment);
    }

    if (data.saveAsDraft) {
        formData.append("save_as_draft", 1);
    }

    const messageId = await generateMessageId();
    if (!messageId) {
        return false;
    }

    formData.append("message_id", messageId);

    let url = "/compose";
    if (data.inReplyTo) {
        url = `/message/${data.inReplyTo}/reply`;
    } else if (data.toForward) {
        url = `/message/${data.toForward}/forward`;
    }

    const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    // Seems to redirect on success only. Checking status code
    // is not reliable, since it returns 200 even when when errors
    // happen.
    return response.redirected && response.url.endsWith("/mailbox/INBOX") ||
        data.saveAsDraft && response.url.includes("/message/Drafts/");
}

export async function removeMail(uids, mailbox) {
    const confirmation = await dialog.showYesNo(
        "Delete Mail",
        "Are you sure you want to delete this mail?",
        true
    );

    if (confirmation != "yes") {
        return false;
    }

    const formData = new FormData();
    for (const uid of uids) {
        formData.append("uids", uid);
    }

    const response = await fetch(`/message/${encodeURIComponent(mailbox)}/delete`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    return response.status == 200;
}

export async function markEmailIsRead(uids, mailbox, read) {
    const formData = new FormData();
    for (const uid of uids) {
        formData.append("uids", uid);
    }

    formData.append("action", read ? "add" : "remove");
    formData.append("flags", "\\Seen");

    await fetch(`/message/${encodeURIComponent(mailbox)}/flag`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });
}

export async function createMailbox(name) {
    const formData = new FormData();
    formData.append("name", name);

    const response = await fetch(`/new-mailbox`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    return response.status == 200;
}

export async function moveToMailbox(uids, name) {
    const formData = new FormData();
    for (const uid of uids) {
        formData.append("uids", uid);
    }

    formData.append("to", name == "Inbox" ? "INBOX" : name);

    const url = `/message/${encodeURIComponent(mailbox.getName(mailbox.getSelected()))}/move`;
    const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    return response.status == 200;
}

export async function getSettings() {
    const response = await fetch("/user-settings");

    return response.status == 200
        ? await response.json()
        : null;
}

export async function setSettings(obj) {
    const formData = new FormData();
    formData.append("json", JSON.stringify(obj));

    const response = await fetch(`/user-settings`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    return response.status == 200;
}