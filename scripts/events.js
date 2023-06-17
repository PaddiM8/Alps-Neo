import * as refresh from "./refresh";
import * as mailboxList from "./components/mailboxList";
import * as notifications from "./notifications";
import ReconnectingWebSocket from "reconnecting-websocket";

export function init() {
    const webSocket = new ReconnectingWebSocket(`wss://${window.location.host}/events`);
    webSocket.addEventListener("message", async event => {
        const data = event.data;
        const separationIndex = data.indexOf(":");
        const type = data.slice(0, separationIndex);
        let value = data.slice(separationIndex + 1).trim();
        if (value == "INBOX") {
            value = "Inbox";
        }

        if (type == "mailbox" && value == mailboxList.getName(mailboxList.getSelected())) {
            notifications.notify("Mail received.");

            await refresh.all();
        } else if (type == "mailbox") {
            await refresh.mailboxes();
        } else {
            // TODO: tell the server to select the currently selected mailbox and
            // handle events for individual mails
            console.log(type, value);
        }
    });


    let isReconnecting = false;
    webSocket.addEventListener("open", async () => {
        if (isReconnecting) {
            await refresh.all();
        }

        isReconnecting = false;
    });

    webSocket.addEventListener("close", async () => {
        isReconnecting = true;
    });
}