const HTMLElementBase = globalThis.HTMLElement || class {};

/**
 * Embed Koi Farm as an isolated, responsive browser application.
 *
 * The iframe boundary keeps the legacy renderer's global styles and IDs from
 * leaking into the host project while exposing lifecycle events on the custom
 * element. Listen for `koi-farm:load`, `koi-farm:ready`, and
 * `koi-farm:session` on the element.
 */
export class KoiFarmElement extends HTMLElementBase {
    static get observedAttributes() {
        return ["src", "lang", "pond", "storage-key", "social", "loading", "title"];
    }

    constructor() {
        super();

        this.frame = null;
        this.onMessage = this.onMessage.bind(this);
    }

    connectedCallback() {
        this.classList.add("koi-farm-element");
        window.addEventListener("message", this.onMessage);
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("message", this.onMessage);
    }

    attributeChangedCallback(name, previous, next) {
        if (previous !== next && this.isConnected)
            this.render();
    }

    /**
     * The window hosting the game, when it is available.
     * @returns {Window|null}
     */
    get gameWindow() {
        return this.frame ? this.frame.contentWindow : null;
    }

    /**
     * Build the game URL from the element attributes.
     * @returns {String}
     */
    makeSource() {
        const configuredSource = this.getAttribute("src");
        const source = configuredSource ?
            new URL(configuredSource, document.baseURI) :
            new URL("../index.html", import.meta.url);
        const language = this.getAttribute("lang");
        const pond = this.getAttribute("pond");
        const storageKey = this.getAttribute("storage-key");

        source.searchParams.set("embed", "1");

        if (language)
            source.searchParams.set("lang", language);

        if (pond !== null)
            source.searchParams.set("resume", pond);

        if (storageKey)
            source.searchParams.set("storage", storageKey);

        if (!this.hasAttribute("social"))
            source.searchParams.set("social", "0");

        return source.href;
    }

    /**
     * Render or refresh the embedded game.
     */
    render() {
        const frame = document.createElement("iframe");

        frame.src = this.makeSource();
        frame.title = this.getAttribute("title") || "Koi Farm";
        frame.loading = this.getAttribute("loading") || "eager";
        frame.allow = "autoplay; clipboard-write; fullscreen";
        frame.setAttribute("allowfullscreen", "");
        frame.setAttribute("part", "frame");
        frame.addEventListener("load", () => {
            this.dispatchEvent(new CustomEvent("koi-farm:load", {
                bubbles: true,
                detail: {source: frame.src}
            }));
        });

        if (this.frame)
            this.frame.replaceWith(frame);
        else
            this.appendChild(frame);

        this.frame = frame;
    }

    /**
     * Start or resume a pond. A missing save automatically starts a new pond.
     * @param {Number} pond Pond index from 0 through 2
     */
    openPond(pond) {
        const index = Number(pond);

        if (!Number.isInteger(index) || index < 0 || index > 2)
            throw new RangeError("pond must be an integer from 0 through 2");

        this.setAttribute("pond", index.toString());
    }

    /**
     * Return to the pond chooser.
     */
    openMenu() {
        if (this.hasAttribute("pond"))
            this.removeAttribute("pond");
        else
            this.reload();
    }

    /**
     * Reload the current game URL.
     */
    reload() {
        if (this.frame)
            this.frame.src = this.makeSource();
        else if (this.isConnected)
            this.render();
    }

    /**
     * Forward trusted lifecycle messages from this element's game frame.
     * @param {MessageEvent} event Browser message event
     */
    onMessage(event) {
        if (!this.frame || event.source !== this.frame.contentWindow)
            return;

        const message = event.data;

        if (!message || message.source !== "koi-farm" || typeof message.type !== "string")
            return;

        this.dispatchEvent(new CustomEvent(message.type, {
            bubbles: true,
            detail: message
        }));
    }
}

/**
 * Register the Koi Farm custom element once.
 * @returns {typeof KoiFarmElement}
 */
export const defineKoiFarmElement = () => {
    if (!globalThis.customElements)
        return KoiFarmElement;

    if (!customElements.get("koi-farm"))
        customElements.define("koi-farm", KoiFarmElement);

    return KoiFarmElement;
};

const installStyles = () => {
    if (!globalThis.document || document.getElementById("koi-farm-element-styles"))
        return;

    const style = document.createElement("style");

    style.id = "koi-farm-element-styles";
    style.textContent = `
        :where(.koi-farm-element) {
            display: block;
            width: 100%;
            min-width: 0;
            min-height: 320px;
            aspect-ratio: 3 / 2;
            overflow: hidden;
            background: #426630;
            contain: layout paint;
        }

        :where(.koi-farm-element > iframe) {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
            background: #426630;
        }
    `;

    document.head.appendChild(style);
};

installStyles();
defineKoiFarmElement();
