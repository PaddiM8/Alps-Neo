import * as fileDrop from "./fileDrop";
import * as multiInput from "./multiInput";
import * as pane from "./pane";
import * as toast from "./toast";

const composePane = document.getElementById("compose-pane");
const attachmentArea = composePane.querySelector(".attachment-area");

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

    // Alps will give status code 200 even if it fails, but 301
    // when it actually sends it.
    if (response.status == 301) {
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

export async function init() {
    composePane.querySelector("button.as-draft").addEventListener("click", async () => await submit(true));
    composePane.querySelector("button.send").addEventListener("click", async () => await submit());
}