import * as fileDrop from "./fileDrop";
import * as multiInput from "./multiInput";
import * as pane from "./pane";
import * as toast from "./toast";
import * as actions from "../actions";
import * as settings from "../settings";
import * as dialog from "./dialog";

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
    const submit = composePane.querySelector(".primary");
    submit.setAttribute("disabled", "true");

    const messageElement = composePane.querySelector(".input-message")
    const html = `<html><body>${messageElement.value}</body></html>`;

    if (to.length == 0 || from.length == 0) {
        showError();
        return;
    }

    if (subject.length == 0) {
        const accept = await dialog.showYesNo("No subject", "Are you sure you want to send an email without a subject?");
        if (accept != "yes") {
            return;
        }
    }

    const data = {
        from: from,
        to: to,
        subject: subject,
        text: messageElement.textContent,
        html: html,
        attachmentUuids: attachmentUuids,
        prevAttachments: context.toForward ? prevAttachments : null,
        saveAsDraft: kind == "draft",
        inReplyTo: context.inReplyTo,
        toForward: context.toForward,
    };

    const success = await actions.sendMail(data);
    if (success && kind == "draft") {
        toast.show("Saved as draft.");
        fileDrop.clearUuids(attachmentArea);
        pane.close(composePane);
        submit.removeAttribute("disabled");
    } else if (success) {
        toast.show("Email was sent.");
        fileDrop.clearUuids(attachmentArea);
        pane.close(composePane);
        submit.removeAttribute("disabled");
    } else {
        showError();
    }
}

export function intoNewMail(to = null) {
    clearContext();
    pane.setTitle(composePane, "Write an Email");

    if (to?.length > 0) {
        const toInput = composePane.querySelector(".input-to");
        multiInput.setValues(toInput, [to]);
    }

    const fromInput = composePane.querySelector(".input-from");
    fromInput.value = fromInput.getAttribute("data-default");

    const signature = settings.get().signature;
    if (signature) {
        composePane.querySelector(".input-message").value = `<br><br>${signature}`;
    }
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
    const attachment = new Trix.Attachment({ content: `<blockquote>${content}</blockquote>` });
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
    const attachments = await actions.getPreviousAttachments(mailbox, mailId, textPart);
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