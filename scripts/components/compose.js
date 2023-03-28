import * as multiInput from "./multiInput";
import * as pane from "./pane";
import * as toast from "./toast";

const composePane = document.getElementById("compose-pane");

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

    const to = multiInput.getValues(composePane.querySelector(".input-to"));
    const from = composePane.querySelector(".input-from").value;
    const cc = multiInput.getValues(composePane.querySelector(".input-cc"));
    const subject = composePane.querySelector(".input-subject").value;
    const message = composePane.querySelector(".input-message").value;

    const formData = new FormData();
    formData.append("from", from);
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("text", message);

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

    if (response.ok) {
        if (isDraft) {
            toast.show("Saved as draft.");
        } else {
            toast.show("Email was sent.");
        }

        pane.close(composePane);
    } else {
        showError();
    }
}

export async function init() {
    composePane.querySelector("button.as-draft").addEventListener("click", async () => await submit(true));
    composePane.querySelector("button.send").addEventListener("click", submit);
}