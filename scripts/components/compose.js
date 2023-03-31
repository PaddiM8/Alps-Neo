import * as fileDrop from "./fileDrop";
import * as multiInput from "./multiInput";
import * as pane from "./pane";
import * as toast from "./toast";

const composePane = document.getElementById("compose-pane");
const attachmentArea = composePane.querySelector(".attachment-area");
let inReplyTo = null;

function showError() {
    composePane.querySelector(".error").classList.remove("hidden");
}

function hideError() {
    composePane.querySelector(".error").classList.add("hidden");
}

async function generateMessageId() {
    const result = await fetch("/compose");
    if (result.ok) {
        return await result.text();
    } else {
        return null;
    }
}

async function submit(isDraft = false) {
    hideError();

    const attachmentUuids = [];
    for (const attachment of attachmentArea.querySelector(".attachment-list").children) {
        if (attachment.classList.contains("uploaded")) {
            attachmentUuids.push(attachment.getAttribute("data-uuid"));
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

    if (inReplyTo) {
        formData.append("in_reply_to", inReplyTo);
    }

    if (isDraft) {
        formData.append("save_as_draft", "1");
    }

    const messageId = await generateMessageId();
    if (!messageId) {
        showError();
        return;
    }

    formData.append("message_id", messageId);

    const response = await fetch("/compose", {
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
    } else if (isDraft) {
        toast.show("Saved as draft.");
        fileDrop.clearUuids(attachmentArea);
        pane.close(composePane);
    } else {
        showError();
    }
}

export function intoNewMail() {
    pane.setTitle(composePane, "Write an Email");
    const fromInput = composePane.querySelector(".input-from");
    fromInput.value = fromInput.getAttribute("data-default");
}

export function intoReply(mailId, to, from, subject) {
    inReplyTo = mailId;
    pane.setTitle(composePane, "Reply to Email");
    multiInput.setValues(composePane.querySelector(".input-to"), [to]);
    composePane.querySelector(".input-from").value = from;
    composePane.querySelector(".input-subject").value = subject;
}

export async function init() {
    composePane.querySelector("button.as-draft").addEventListener("click", async () => await submit(true));
    composePane.querySelector("button.send").addEventListener("click", async () => await submit());
    composePane.addEventListener("cleared", () => {
        console.log("cleared inReplyTo");
        inReplyTo = null;
    });
}