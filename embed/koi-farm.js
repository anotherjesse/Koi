const HTMLElementBase = globalThis.HTMLElement || class {};
const DEFAULT_WORLD_SAVE_KEY = "koi-world";

const getPondIndex = (value, fallback = 0) => {
    if (value === null || value === "")
        return fallback;

    const pond = Number(value);

    return Number.isInteger(pond) && pond >= 0 && pond <= 2 ? pond : fallback;
};

/**
 * Shared iframe boundary for Koi components.
 *
 * The frame isolates the legacy renderer's global styles and IDs from the host
 * project while the element forwards lifecycle events through a small public
 * API.
 */
export class KoiFrameElement extends HTMLElementBase {
    static get observedAttributes() {
        return ["src", "lang", "loading", "title"];
    }

    constructor() {
        super();

        this.frame = null;
        this.saveRequest = 0;
        this.saveRequests = new Map();
        this.onMessage = this.onMessage.bind(this);
    }

    connectedCallback() {
        this.classList.add("koi-embed-element");
        window.addEventListener("message", this.onMessage);
        this.render();
    }

    disconnectedCallback() {
        window.removeEventListener("message", this.onMessage);

        for (const request of this.saveRequests.values()) {
            clearTimeout(request.timeout);
            request.resolve(false);
        }

        this.saveRequests.clear();
    }

    attributeChangedCallback(name, previous, next) {
        if (previous !== next && this.isConnected)
            this.render();
    }

    get eventPrefix() {
        return "koi";
    }

    get defaultTitle() {
        return "Koi";
    }

    /**
     * The window hosting the component runtime, when it is available.
     * @returns {Window|null}
     */
    get gameWindow() {
        return this.frame ? this.frame.contentWindow : null;
    }

    /**
     * Add component-specific parameters to the runtime URL.
     * @param {URL} source Runtime URL
     */
    configureSource(source) {

    }

    /**
     * Build the runtime URL from the element attributes.
     * @returns {String}
     */
    makeSource() {
        const configuredSource = this.getAttribute("src");
        const source = configuredSource ?
            new URL(configuredSource, document.baseURI) :
            new URL("../index.html", import.meta.url);
        const language = this.getAttribute("lang");

        source.searchParams.set("embed", "1");

        if (language)
            source.searchParams.set("lang", language);

        this.configureSource(source);

        return source.href;
    }

    /**
     * Emit a component lifecycle event.
     * @param {String} name Event name without a component prefix
     * @param {Object} detail Public event details
     */
    dispatchLifecycle(name, detail) {
        this.dispatchEvent(new CustomEvent(`${this.eventPrefix}:${name}`, {
            bubbles: true,
            detail: detail
        }));
    }

    /**
     * Render or refresh the component runtime.
     */
    render() {
        const frame = document.createElement("iframe");

        frame.src = this.makeSource();
        frame.title = this.getAttribute("title") || this.defaultTitle;
        frame.loading = this.getAttribute("loading") || "eager";
        frame.allow = "autoplay; clipboard-write; fullscreen";
        frame.setAttribute("allowfullscreen", "");
        frame.setAttribute("part", "frame");
        frame.addEventListener("load", () => {
            this.dispatchLifecycle("load", {source: frame.src});
        });

        if (this.frame)
            this.frame.replaceWith(frame);
        else
            this.appendChild(frame);

        this.frame = frame;
    }

    /**
     * Reload the current runtime URL.
     */
    reload() {
        if (this.frame)
            this.frame.src = this.makeSource();
        else if (this.isConnected)
            this.render();
    }

    /**
     * Ask the current runtime to persist its active session.
     * @returns {Promise<Boolean>} Whether the runtime acknowledged the save
     */
    save() {
        if (!this.gameWindow)
            return Promise.resolve(false);

        const requestId = `${Date.now()}-${++this.saveRequest}`;

        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                this.saveRequests.delete(requestId);
                resolve(false);
            }, 1000);

            this.saveRequests.set(requestId, {
                resolve: resolve,
                timeout: timeout
            });
            this.gameWindow.postMessage({
                source: "koi-component",
                type: "koi-farm:save",
                requestId: requestId
            }, "*");
        });
    }

    /**
     * Forward trusted lifecycle messages from this element's runtime frame.
     * @param {MessageEvent} event Browser message event
     */
    onMessage(event) {
        if (!this.frame || event.source !== this.frame.contentWindow)
            return;

        const message = event.data;

        if (!message || message.source !== "koi-farm" || typeof message.type !== "string")
            return;

        if (message.type === "koi-farm:saved" && this.saveRequests.has(message.requestId)) {
            const request = this.saveRequests.get(message.requestId);

            clearTimeout(request.timeout);
            this.saveRequests.delete(message.requestId);
            request.resolve(true);
        }

        this.dispatchLifecycle(message.type.split(":").pop(), message);
    }
}

/**
 * A live Koi world without save-slot, settings, card, or tutorial UI.
 *
 * Listen for `koi-world:load`, `koi-world:ready`, and `koi-world:session`.
 */
export class KoiWorldElement extends KoiFrameElement {
    static get observedAttributes() {
        return [...super.observedAttributes, "save-key"];
    }

    get eventPrefix() {
        return "koi-world";
    }

    get defaultTitle() {
        return "Koi world";
    }

    /**
     * The opaque browser storage key used for this world's serialized state.
     * @returns {String}
     */
    get saveKey() {
        return this.getAttribute("save-key") || DEFAULT_WORLD_SAVE_KEY;
    }

    set saveKey(saveKey) {
        if (typeof saveKey !== "string" || saveKey.trim() === "")
            throw new TypeError("saveKey must be a non-empty string");

        this.setAttribute("save-key", saveKey);
    }

    attributeChangedCallback(name, previous, next) {
        if (name === "save-key" && previous !== next && this.isConnected && this.frame) {
            this.save().finally(() => {
                if (this.getAttribute("save-key") === next)
                    this.render();
            });

            return;
        }

        super.attributeChangedCallback(name, previous, next);
    }

    configureSource(source) {
        source.searchParams.set("mode", "world");
        source.searchParams.set("save", this.saveKey);
        source.searchParams.set("social", "0");
        source.searchParams.delete("storage");
    }

    /**
     * Load or create the world stored under an opaque save key.
     * @param {String} saveKey Browser storage key
     */
    load(saveKey) {
        if (saveKey === this.saveKey)
            this.reload();
        else
            this.saveKey = saveKey;
    }
}

/**
 * The complete Koi save-slot and menu system.
 *
 * Listen for `koi-system:load`, `koi-system:ready`, and `koi-system:session`.
 */
export class KoiSystemElement extends KoiFrameElement {
    static get observedAttributes() {
        return [...super.observedAttributes, "pond", "storage-key", "social"];
    }

    get eventPrefix() {
        return "koi-system";
    }

    get defaultTitle() {
        return "Koi system";
    }

    configureSource(source) {
        const pond = this.getAttribute("pond");
        const storageKey = this.getAttribute("storage-key");

        source.searchParams.delete("mode");
        source.searchParams.delete("pond");
        source.searchParams.delete("save");

        if (storageKey)
            source.searchParams.set("storage", storageKey);
        else
            source.searchParams.delete("storage");

        if (pond === null)
            source.searchParams.delete("resume");
        else
            source.searchParams.set("resume", getPondIndex(pond).toString());

        if (!this.hasAttribute("social"))
            source.searchParams.set("social", "0");
    }

    /**
     * Start or resume a pond from the system's three-slot chooser.
     * @param {Number} pond Pond index from 0 through 2
     */
    openPond(pond) {
        const index = getPondIndex(pond, -1);

        if (index === -1)
            throw new RangeError("pond must be an integer from 0 through 2");

        if (this.getAttribute("pond") === index.toString())
            this.reload();
        else
            this.setAttribute("pond", index.toString());
    }

    /**
     * Return to the save-slot chooser.
     */
    openMenu() {
        if (this.hasAttribute("pond"))
            this.removeAttribute("pond");
        else
            this.reload();
    }
}

/**
 * Backward-compatible alias for the complete Koi system.
 */
export class KoiFarmElement extends KoiSystemElement {
    get eventPrefix() {
        return "koi-farm";
    }

    get defaultTitle() {
        return "Koi Farm";
    }
}

const defineElement = (name, ElementClass) => {
    if (globalThis.customElements && !customElements.get(name))
        customElements.define(name, ElementClass);

    return ElementClass;
};

export const defineKoiWorldElement = () => defineElement("koi-world", KoiWorldElement);
export const defineKoiSystemElement = () => defineElement("koi-system", KoiSystemElement);
export const defineKoiFarmElement = () => defineElement("koi-farm", KoiFarmElement);

export const defineKoiElements = () => {
    defineKoiWorldElement();
    defineKoiSystemElement();
    defineKoiFarmElement();
};

const installStyles = () => {
    if (!globalThis.document || document.getElementById("koi-embed-element-styles"))
        return;

    const style = document.createElement("style");

    style.id = "koi-embed-element-styles";
    style.textContent = `
        :where(.koi-embed-element) {
            display: block;
            width: 100%;
            min-width: 0;
            min-height: 320px;
            aspect-ratio: 3 / 2;
            overflow: hidden;
            background: #426630;
            contain: layout paint;
        }

        :where(.koi-embed-element > iframe) {
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
defineKoiElements();
