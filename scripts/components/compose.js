import * as multiInput from "./multiInput";
import * as pane from "./pane";
import * as toast from "./toast";

const composePane = document.getElementById("compose-pane");

async function submit() {
    const to = multiInput.getValues(composePane.querySelector(".input-to"));
    const from = composePane.querySelector(".input-from").value;
    const cc = multiInput.getValues(composePane.querySelector(".input-cc"));
    const subject = composePane.querySelector(".input-subject").value;
    const message = composePane.querySelector(".input-message").value;
    const messageId = await fetch("/compose");

    const formData = new FormData();
    formData.append("from", from);
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("text", message);
    formData.append("message_id", messageId);

    const response = await fetch("/compose", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
    });

    if (response.ok) {
        pane.close(composePane);
        toast.show("Email was sent.");
    } else {
        composePane.querySelector(".error").classList.remove("hidden");
    }
}

export function init() {
    composePane.querySelector("button.primary").addEventListener("click", submit);
}