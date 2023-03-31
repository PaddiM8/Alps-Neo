import * as compose from "./components/compose";
import * as pane from "./components/pane";

function getMail() {
    return document.getElementById("mail");
}

function getId() {
    return getMail().getAttribute("data-uid");
}

function getSubject() {
    return getMail().querySelector(".mail-header h1").textContent.trim();
}

function getRecipient() {
    return getMail().querySelector(".mail-header .to a").textContent.trim();
}

function getSender() {
    return getMail().querySelector(".mail-header .from a").textContent.trim();
}

function reply() {
    compose.intoReply(
        getId(),
        getSender(),
        getRecipient(),
        "Re: " + getSubject()
    );
    pane.show(document.getElementById("compose-pane"));
}

export function init() {
    const actions = document.getElementById("mail-actions");
    actions.querySelector(".reply").addEventListener("click", reply);
}