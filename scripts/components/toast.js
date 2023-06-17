export function show(text, level = "info", timeShow = 3250) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.classList.add(level);
    toast.textContent = text;

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("slide");
    }, 250)
    setTimeout(() => {
        toast.classList.remove("slide");

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 800)
    }, timeShow);
}

show("This is a test.", "info", 325000);