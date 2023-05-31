import * as contextMenu from "./contextMenu";
import * as mailbox from "./mailboxList";
import * as mailList from "./mailList";
import * as actions from "../actions";

export function show(mailListEntries, byElement) {
    const mailboxes = [];
    for (const name of mailbox.getAll()) {
        if (name == mailbox.getName(mailbox.getSelected())) {
            continue;
        }

        mailboxes.push(
            {
                icon: "fa-folder",
                name: name,
                action: async () => {
                    const success = await actions.moveToMailbox(
                        mailListEntries.map(x => mailList.getUid(x)),
                        name
                    );

                    if (success) {
                        for (const entry of mailListEntries) {
                            entry.parentElement.removeChild(entry);
                        }
                    } else {
                        toast.show("Unable to move mail(s)", "error");
                    }
                }
            }
        );
    }

    contextMenu.showByElement(mailboxes, byElement);
}