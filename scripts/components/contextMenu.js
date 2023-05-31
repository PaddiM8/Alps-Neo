let openMenu = null;

function bodyClick(e) {
    let target = e.target;

    // If an ancestor of the clicked element is a context menu,
    // don't do anything. Otherwise, the user clicked outside
    // the context menu and the context menu should be closed.
    // We stop after a few iterations, since a context menu
    // isn't very deep.
    for (let i = 0; i < 4 && target; i++) {
        if (target.classList.contains("context-menu")) {
            return;
        }

        target = target.parentElement;
    }

    close(openMenu);
}

function close(menu) {
    menu.remove();
    document.body.removeEventListener("click", bodyClick);
    openMenu = null;
}

export function showByElement(items, byElement) {
    const rect = byElement.getBoundingClientRect();
    showAtPos(items, rect.left, rect.top + rect.height);
}

export function showAtPos(items, x, y) {
    const existing = document.getElementById("context-menu");
    if (existing) {
        close(existing);
    }

    const menu = document.createElement("div");
    menu.id = "context-menu";
    menu.className = "context-menu";
    menu.style.left = x + "px";
    menu.style.top = y + "px";

    for (const item of items) {
        const entry = document.createElement("div");
        entry.className = "entry";

        const icon = document.createElement("i");
        icon.className = "icon fas";
        icon.classList.add(item.icon);
        entry.appendChild(icon);

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = item.name;
        entry.appendChild(name);

        entry.addEventListener("click", () => {
            close(menu);
            item.action();
        });

        menu.appendChild(entry);
    }

    openMenu = menu;
    document.body.appendChild(menu);

    const rect = menu.getBoundingClientRect();
    if (x + rect.width > document.body.clientWidth) {
        menu.style.left = document.body.clientWidth - rect.width + "px";
    }

    if (y + rect.height > document.body.clientHeight) {
        menu.style.top = document.body.clientHeight - rect.height + "px";
    }

    setTimeout(() => {
        document.body.addEventListener("click", bodyClick);
    }, 250);
}