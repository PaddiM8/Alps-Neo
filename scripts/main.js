import * as events from "./events";
import * as settings from "./settings";
import * as mailbox from "./components/mailboxList";
import * as compose from "./components/compose";
import * as fileDrop from "./components/fileDrop";
import * as mailList from "./components/mailList";
import * as multiInput from "./components/multiInput";
import * as trix from "./components/trix";
import * as pane from "./components/pane";
import * as navigation from "./components/navigation";

events.init();
settings.init();
mailbox.init();

compose.init();
fileDrop.init();
mailList.init();
multiInput.init();
pane.init();
navigation.init();