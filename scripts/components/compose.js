import * as fileDrop from "./fileDrop";
import * as multiInput from "./multiInput";
import * as pane from "./pane";
import * as toast from "./toast";

const composePane = document.getElementById("compose-pane");
const attachmentArea = composePane.querySelector(".attachment-area");
let context = {
    inReplyTo: null,
    toForward: null
}

function clearContext() {
    for (const key in context) {
        context[key] = null;
    }
}

function showError() {
    composePane.querySelector(".error").classList.remove("hidden");
}

function hideError() {
    composePane.querySelector(".error").classList.add("hidden");
}

async function generateMessageId() {
    const result = await fetch("/compose");
    if (!result.ok) {
        return null;
    }

    return (await result.text()).trim();
}

async function submit(kind = "normal") {
    hideError();

    const prevAttachments = [];
    const attachmentUuids = [];
    for (const attachment of attachmentArea.querySelector(".attachment-list").children) {
        if (attachment.classList.contains("uploaded")) {
            attachmentUuids.push(attachment.getAttribute("data-uuid"));
        } else if (attachment.getAttribute("data-prev")) {
            prevAttachments.push(attachment.getAttribute("data-prev"));
        } else {
            alert("All attachments have not been uploaded yet. Please delete any failed attachments and wait for all of them to upload before proceeding.");
            return;
        }
    }

    const to = multiInput.getValues(composePane.querySelector(".input-to"));
    const from = composePane.querySelector(".input-from").value;
    const cc = multiInput.getValues(composePane.querySelector(".input-cc"));
    const subject = composePane.querySelector(".input-subject").value;
    const message = composePane.querySelector(".input-message").value;

    const formData = new FormData();
    formData.append("from", from);
    formData.append("to", to.join(","));
    formData.append("subject", subject);
    formData.append("text", message);
    formData.append("attachment-uuids", attachmentUuids.join(","));
    formData.append("content_type", "text/html");

    if (context.toForward && prevAttachments.length > 0) {
        for (const prevAttachment of prevAttachments) {
            formData.append("prev_attachments", prevAttachment);
        }
    }

    if (kind == "draft") {
        formData.append("save_as_draft", "1");
    }

    const mailData = await generateMessageId();
    if (!mailData) {
        showError();
        return;
    }

    formData.append("message_id", mailData.messageId);

    let url = "/compose";
    if (context.inReplyTo) {
        url = `/message/${context.inReplyTo}/reply`;
    } else if (context.toForward) {
        url = `/message/${context.toForward}/forward`;
    }

    const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    // Seems to redirect on success only. Checking status code
    // is not reliable, since it returns 200 even when when errors
    // happen.
    if (response.redirected) {
        toast.show("Email was sent.");
        fileDrop.clearUuids(attachmentArea);
        pane.close(composePane);
    } else if (kind == "draft") {
        toast.show("Saved as draft.");
        fileDrop.clearUuids(attachmentArea);
        pane.close(composePane);
    } else {
        showError();
    }
}

async function getPreviousAttachments(mailbox, mailId, textPart) {
    const result = await fetch(`/message/${mailbox}/${mailId}/forward?part=${textPart}`);
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

export function intoNewMail() {
    clearContext();
    pane.setTitle(composePane, "Write an Email");
    const fromInput = composePane.querySelector(".input-from");
    fromInput.value = fromInput.getAttribute("data-default");
}

export function intoReply(mailbox, mailId, to, from, subject, content) {
    clearContext();
    context.inReplyTo = [mailbox, mailId].join("/");
    pane.setTitle(composePane, "Reply to Email");
    multiInput.setValues(composePane.querySelector(".input-to"), [to]);
    composePane.querySelector(".input-from").value = from;
    composePane.querySelector(".input-subject").value = `Re: ${subject}`;

    const editor = composePane.querySelector(".input-message").editor;
    editor.insertString("\n\n---");
    const attachment = new Trix.Attachment({ content: `<blockquote>${content}</blockquote>` })
    editor.insertAttachment(attachment);
    editor.setSelectedRange([0, 0]);
}

export async function intoForward(mailbox, mailId, textPart, date, from, to, subject, content) {
    clearContext();
    context.toForward = [mailbox, mailId].join("/");
    pane.setTitle(composePane, "Forward Email");
    composePane.querySelector(".input-subject").value = `Fwd: ${subject}`;

    const editor = composePane.querySelector(".input-message").editor;
    editor.insertString("\n\n---");
    editor.insertString(`\nDate: ${date}`);
    editor.insertString(`\nFrom: ${from}`);
    editor.insertString(`\nTo: ${to}`);
    editor.insertString(`\nSubject: ${subject}\n`);
    const attachment = new Trix.Attachment({ content: `<blockquote>${content}</blockquote>` })
    editor.insertAttachment(attachment);
    editor.setSelectedRange([0, 0]);

    // Previous attachments
    const attachments = await getPreviousAttachments(mailbox, mailId, textPart);
    for (const attachment of attachments) {
        const fileEntry = fileDrop.addFileEntry(attachmentArea, attachment.name, null, true);
        fileEntry.setAttribute("data-prev", attachment.partString);
    }
}

export async function init() {
    composePane.querySelector("button.as-draft").addEventListener("click", async () => await submit("draft"));
    composePane.querySelector("button.send").addEventListener("click", async () => await submit());
    composePane.addEventListener("cleared", () => {
        clearContext();
    });
}