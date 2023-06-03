import * as compose from "./components/compose";
import * as pane from "./components/pane";

export function init() {
    // Open any mailto links in this client
    document.addEventListener("click", e => {
        const target = e.target;
        if (target.tagName == "A" && target.href.startsWith("mailto:")) {
            e.preventDefault();
            compose.intoNewMail(target.href.slice("mailto:".length));
            pane.show(document.getElementById("compose-pane"));
        }
    });
}