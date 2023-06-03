import * as settings from "./settings";

export function set(name) {
    document.body.className = name;
}

export function init() {
    set(settings.get().theme)
}