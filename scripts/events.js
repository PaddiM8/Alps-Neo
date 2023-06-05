import * as refresh from "./refresh";

export function init() {
    const source = new EventSource("/events/new-mail");
    source.addEventListener("message", async event => {
        const data = event.data;
        const separationIndex = data.indexOf(":");
        const type = data.slice(0, separationIndex);
        const value = data.slice(separationIndex + 1).trim();

        if (type == "mailbox") {
            await refresh.go();
        } else {
            console.log(type, value);
        }
    });
}