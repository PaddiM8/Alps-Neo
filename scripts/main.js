import * as events from "./events";
import * as settings from "./settings";
import * as themes from "./themes";
import * as mailbox from "./components/mailboxList";
import * as compose from "./components/compose";
import * as fileDrop from "./components/fileDrop";
import * as mailList from "./components/mailList";
import * as multiInput from "./components/multiInput";
import * as pane from "./components/pane";
import * as navigation from "./components/navigation";
import * as injection from "./injection";
import Trix from "trix";

settings.init().then(() => {
    events.init();
    themes.init();
    mailbox.init();

    compose.init();
    fileDrop.init();
    mailList.init();
    multiInput.init();
    pane.init();
    navigation.init();
    injection.init();
});