import * as compose from "./compose";
import * as pane from "./pane";
import * as actions from "../actions";
import * as moveMenu from "./moveMenu";
import * as mailList from "./mailList";

const composePane = document.getElementById("compose-pane");

function getMail() {
    return document.getElementById("mail");
}

function getMailbox() {
    return getMail().getAttribute("data-mailbox");
}

function getDate() {
    return getMail().querySelector(".mail-header .time").textContent.trim();
}

function getUid() {
    return getMail().getAttribute("data-uid");
}

function getTextPart() {
    return getMail().getAttribute("data-text-part");
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

function getBody() {
    const content = getMail().querySelector(".mail-body .content");
    return content.shadowRoot
        ? content.shadowRoot.innerHTML
        : content.innerHTML;
}

async function reply() {
    await compose.intoReply(
        getMailbox(),
        getUid(),
        getSender(),
        getRecipient(),
        getSubject(),
        getBody()
    );
    pane.show(composePane);
}

async function forward() {
    await compose.intoForward(
        getMailbox(),
        getUid(),
        getTextPart(),
        getDate(),
        getSender(),
        getRecipient(),
        getSubject(),
        getBody()
    );
    pane.show(composePane);
}

async function remove() {
    await actions.removeMail(getUid(), getMailbox());
}

function move(e) {
    moveMenu.show(mailList.getEntryByUid(getUid()), e.target);
}

export function init() {
    const actions = document.getElementById("mail-actions");
    actions.querySelector(".reply").addEventListener("click", reply);
    actions.querySelector(".forward").addEventListener("click", forward);
    actions.querySelector(".delete").addEventListener("click", remove);
    actions.querySelector(".move").addEventListener("click", move);
}