import * as dialog from "./components/dialog";
import * as navigation from "./components/navigation";
import * as toast from "./components/toast";
import * as actions from "./actions";
import * as themes from "./themes";

const element = document.getElementById("settings");
let changedSinceLastSave = false;
let settings = {};

async function load() {
    settings = await actions.getSettings();
    if ("theme" in settings) {
        document.getElementById("theme").value = settings.theme;
    }

    if ("remote_content" in settings) {
        document.getElementById("remote-content").value = settings.remote_content ? "yes" : "no";
    }

    if ("proxy_images" in settings) {
        document.getElementById("proxy-images").value = settings.proxy_images ? "yes" : "no";
    }

    if ("signature" in settings) {
        document.getElementById("signature").value = settings.signature;
    }
}

async function save() {
    settings = {
        theme: document.getElementById("theme").value,
        remote_content: document.getElementById("remote-content").value == "yes",
        proxy_images: document.getElementById("proxy-images").value == "yes",
        signature: document.getElementById("signature").value,
    };

    return await actions.setSettings(settings);
}

export function get() {
    return settings;
}

export async function init() {
    document.getElementById("cancel-settings").addEventListener("click", async () => {
        if (changedSinceLastSave) {
            const result = await dialog.showYesNo("Discard changes", "Are you sure you want to discard the changes?");
            if (!result) {
                return;
            }
        }

        navigation.select("mailbox");
        await load();
    });
    document.getElementById("save-settings").addEventListener("click", async () => {
        if (await save()) {
            toast.show("Saved settings.");
            navigation.select("mailbox");
        }
    });
    const theme = document.getElementById("theme");
    theme.addEventListener("change", () => {
        themes.set(theme.value);
    });

    element.addEventListener("change", () => changedSinceLastSave = true);
    element.querySelector(".signature-area")
        .addEventListener("input", () => changedSinceLastSave = true);

    await load();
}