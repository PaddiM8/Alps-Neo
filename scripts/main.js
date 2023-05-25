import * as events from "./events";
import * as mailbox from "./components/mailboxList";
import * as compose from "./components/compose";
import * as fileDrop from "./components/fileDrop";
import * as mailList from "./components/mailList";
import * as multiInput from "./components/multiInput";
import * as trix from "./components/trix";
import * as pane from "./components/pane";

events.init();
mailbox.init();

compose.init();
fileDrop.init();
mailList.init();
multiInput.init();
pane.init();