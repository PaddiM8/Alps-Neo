import Trix from "trix";

document.addEventListener("trix-before-initialize", () => {
    Trix.config.toolbar.getDefaultHTML = () => {
        return `
        <div class="trix-button-row">
            <span class="trix-button-group data-trix-button-group="text-tools">
                <button class="trix-button bold fas fa-bold"
                        data-trix-attribute="bold"
                        data-trix-key="b"
                        title="Bold"
                        tabindex="-1"></button>
                <button class="trix-button italic fas fa-italic"
                        data-trix-attribute="italic"
                        data-trix-key="i"
                        title="Italic"
                        tabindex="-1"></button>
                <button class="trix-button strike fas fa-strikethrough"
                        data-trix-attribute="strike"
                        title="Strikethrough"
                        tabindex="-1"></button>
                <button class="trix-button link fas fa-link"
                        data-trix-attribute="href"
                        data-trix-action="link"
                        data-trix-key="k"
                        title="Link"
                        tabindex="-1"></button>
            </span>

            <span class="trix-button-group" data-trix-button-group="block-tools">
                <button class="trix-button heading-1 fas fa-heading"
                        data-trix-attribute="heading1"
                        title="Heading"
                        tabindex="-1"></button>
                <button class="trix-button quote fas fa-quote-right"
                        data-trix-attribute="quote"
                        title="Quote"
                        tabindex="-1"></button>
                <button class="trix-button code fas fa-code"
                        data-trix-attribute="code"
                        title="Code"
                        tabindex="-1"></button>
                <button class="trix-button bullet-list fas fa-list-ul"
                        data-trix-attribute="bullet"
                        title="Bullets"
                        tabindex="-1"></button>
                <button class="trix-button number-list fas fa-list-ol"
                        data-trix-attribute="number"
                        title="Numbers"
                        tabindex="-1"></button>
            </span>

            <span class="trix-button-group-spacer"></span>

            <span class="trix-button-group" data-trix-button-group="history-tools">
                <button class="trix-button undo fas fa-undo"
                        data-trix-action="undo"
                        data-trix-key="z"
                        title="Undo"
                        tabindex="-1"
                        disabled=""></button>
                <button class="trix-button redo fas fa-redo"
                        data-trix-action="redo"
                        data-trix-key="shift+z"
                        title="Redo"
                        tabindex="-1"
                        disabled=""></button>
            </span>
        </div>
        `;
    };
});