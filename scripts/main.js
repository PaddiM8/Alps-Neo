import * as mailbox from "./mailbox";
import * as compose from "./components/compose";
import * as fileDrop from "./components/fileDrop";
import * as mailList from "./components/mailList";
import * as multiInput from "./components/multiInput";
import * as pane from "./components/pane";

mailbox.init();

compose.init();
fileDrop.init();
mailList.init();
multiInput.init();
pane.init();