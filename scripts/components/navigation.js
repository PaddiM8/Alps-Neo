const navItems = document.querySelectorAll("header .nav-item");
let currentActiveItem = null;

export function select(pageName) {
    const activePage = currentActiveItem.getAttribute("data-page");
    document.getElementById(activePage).classList.remove("active");
    currentActiveItem.classList.remove("active");

    document.getElementById(pageName).classList.add("active");
    const item = document.querySelector(`header .nav-item[data-page="${pageName}"`);
    item.classList.add("active");
    currentActiveItem = item;
}

export function init() {
    for (const item of navItems) {
        if (item.classList.contains("active")) {
            currentActiveItem = item;
        }

        const pageName = item.getAttribute("data-page");
        item.addEventListener("click", () => {
            select(pageName);
        });
    }

    document.querySelector("header .logo").addEventListener("click", () => {
        select("mailbox");
    });
}