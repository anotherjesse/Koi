const HTMLElementBase = globalThis.HTMLElement || class {};

/**
 * Optional host-side controls for a <koi-world> element.
 *
 * Point `for` at the ID of a world. The panel remains outside the world so a
 * host application can omit it, replace it, or build its own controls.
 */
export class KoiWorldControlsElement extends HTMLElementBase {
    static get observedAttributes() {
        return ["for"];
    }

    constructor() {
        super();

        this.world = null;
        this.onControl = this.onControl.bind(this);
        this.attachShadow({mode: "open"});
    }

    connectedCallback() {
        this.render();
        this.connectWorld();
    }

    disconnectedCallback() {
        this.disconnectWorld();
    }

    attributeChangedCallback(name, previous, next) {
        if (name === "for" && previous !== next && this.isConnected)
            this.connectWorld();
    }

    disconnectWorld() {
        if (this.world)
            this.world.removeEventListener("koi-world:control", this.onControl);

        this.world = null;
    }

    connectWorld() {
        this.disconnectWorld();

        const target = document.getElementById(this.getAttribute("for"));

        if (target && target.localName === "koi-world") {
            this.world = target;
            this.world.addEventListener("koi-world:control", this.onControl);

            for (const control of ["weather", "volume", "grassAudio", "flashes"]) {
                const value = this.world.getControl?.(control);

                if (value !== undefined)
                    this.updateControl(control, value);
            }
        }

        for (const control of this.shadowRoot.querySelectorAll("input, select"))
            control.disabled = !this.world;
    }

    onControl(event) {
        if (!["weather", "volume", "grassAudio", "flashes"].includes(event.detail.control))
            return;

        this.updateControl(event.detail.control, event.detail.value);
    }

    updateControl(name, value) {
        const control = this.shadowRoot.querySelector(`[data-control="${name}"]`);

        if (!control)
            return;

        if (control.type === "checkbox")
            control.checked = value;
        else
            control.value = value;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    color: var(--koi-controls-color, #25311e);
                    font: 14px/1.4 system-ui, sans-serif;
                }

                section {
                    height: 100%;
                    padding: 18px;
                    border: 1px solid var(--koi-controls-border, #bdcbb5);
                    border-radius: var(--koi-controls-radius, 18px);
                    background: var(--koi-controls-background, #f8fbf5);
                }

                h2 {
                    margin: 0 0 18px;
                    font-size: 1rem;
                }

                label {
                    display: grid;
                    gap: 6px;
                    margin-top: 14px;
                }

                label.toggle {
                    grid-template-columns: 1fr auto;
                    align-items: center;
                }

                select,
                input[type="range"] {
                    width: 100%;
                }

                select {
                    padding: 7px 9px;
                    border: 1px solid #9aac90;
                    border-radius: 8px;
                    background: white;
                    color: inherit;
                }
            </style>
            <section part="panel" aria-label="Koi world controls">
                <h2>World controls</h2>
                <label>
                    Weather
                    <select data-control="weather">
                        <option value="auto">Automatic</option>
                        <option value="sunny">Sunny</option>
                        <option value="overcast">Overcast</option>
                        <option value="drizzle">Drizzle</option>
                        <option value="rain">Rain</option>
                        <option value="thunderstorm">Thunderstorm</option>
                    </select>
                </label>
                <label>
                    Volume
                    <input data-control="volume" type="range" min="0" max="1" step="0.01" value="1">
                </label>
                <label class="toggle">
                    Grass sounds
                    <input data-control="grassAudio" type="checkbox" checked>
                </label>
                <label class="toggle">
                    Lightning flashes
                    <input data-control="flashes" type="checkbox" checked>
                </label>
            </section>
        `;

        const weather = this.shadowRoot.querySelector('[data-control="weather"]');
        const volume = this.shadowRoot.querySelector('[data-control="volume"]');
        const grassAudio = this.shadowRoot.querySelector('[data-control="grassAudio"]');
        const flashes = this.shadowRoot.querySelector('[data-control="flashes"]');

        weather.addEventListener("change", () => this.world?.setWeather(weather.value));
        volume.addEventListener("input", () => this.world?.setVolume(volume.valueAsNumber));
        grassAudio.addEventListener("change", () => this.world?.setGrassAudio(grassAudio.checked));
        flashes.addEventListener("change", () => this.world?.setFlashes(flashes.checked));
    }
}

export const defineKoiWorldControlsElement = () => {
    if (globalThis.customElements && !customElements.get("koi-world-controls"))
        customElements.define("koi-world-controls", KoiWorldControlsElement);

    return KoiWorldControlsElement;
};

defineKoiWorldControlsElement();
