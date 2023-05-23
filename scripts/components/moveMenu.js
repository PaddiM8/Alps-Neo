import * as contextMenu from "./contextMenu";
import * as mailbox from "./mailboxList";
import * as actions from "../actions";

export function show(mailEntry, byElement) {
    const mailboxes = [];
    for (const name of mailbox.getAll()) {
        if (name == mailbox.getName(mailbox.getSelected())) {
            continue;
        }

        mailboxes.push(
            {
                icon: "fa-folder",
                name: name,
                action: async () => await actions.moveToMailbox(name, mailEntry)
            }
        );
    }

    contextMenu.show(mailboxes, byElement);
}