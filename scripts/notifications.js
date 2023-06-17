export function notify(message) {
    if (!("Notification" in window) || Notification.permission != "granted" || document.hasFocus()) {
        return;
    }

    new Notification(message);
}

export function init() {
    if (Notification.permission == "default") {
        Notification.requestPermission();
    }
}