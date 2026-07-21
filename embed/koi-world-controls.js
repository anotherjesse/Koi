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
        this.onSession = this.onSession.bind(this);
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
        if (this.world) {
            this.world.removeEventListener("koi-world:control", this.onControl);
            this.world.removeEventListener("koi-world:session", this.onSession);
        }

        this.world = null;
    }

    connectWorld() {
        this.disconnectWorld();

        const target = document.getElementById(this.getAttribute("for"));

        if (target && target.localName === "koi-world") {
            this.world = target;
            this.world.addEventListener("koi-world:control", this.onControl);
            this.world.addEventListener("koi-world:session", this.onSession);

            for (const control of ["weather", "volume", "grassAudio", "flashes"]) {
                const value = this.world.getControl?.(control);

                if (value !== undefined)
                    this.updateControl(control, value);
            }
        }

        for (const control of this.shadowRoot.querySelectorAll("button, input, select"))
            control.disabled = !this.world;
    }

    onControl(event) {
        if (!["weather", "volume", "grassAudio", "flashes"].includes(event.detail.control))
            return;

        this.updateControl(event.detail.control, event.detail.value);
    }

    onSession(event) {
        const addFish = this.shadowRoot.querySelector("[data-add-fish]");

        if (addFish && event.detail.population)
            addFish.textContent = `Add fish · ${event.detail.population.total} total`;
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

                h3 {
                    margin: 20px 0 0;
                    padding-top: 16px;
                    border-top: 1px solid #d7e0d1;
                    font-size: .875rem;
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

                select,
                button {
                    padding: 7px 9px;
                    border: 1px solid #9aac90;
                    border-radius: 8px;
                    background: white;
                    color: inherit;
                }

                button {
                    width: 100%;
                    margin-top: 14px;
                    background: #426630;
                    color: white;
                    cursor: pointer;
                    font-weight: 700;
                }

                button:disabled {
                    cursor: default;
                    opacity: .55;
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
                <h3>Add a fish</h3>
                <label>
                    Destination
                    <select data-fish-destination>
                        <option value="river">River</option>
                        <option value="large">Large pond</option>
                        <option value="small">Small pond</option>
                    </select>
                </label>
                <label>
                    Preset
                    <select data-fish-preset>
                        <option value="random">Random</option>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                        <option value="gold">Gold</option>
                        <option value="brown">Brown</option>
                    </select>
                </label>
                <button type="button" data-add-fish>Add fish</button>
            </section>
        `;

        const weather = this.shadowRoot.querySelector('[data-control="weather"]');
        const volume = this.shadowRoot.querySelector('[data-control="volume"]');
        const grassAudio = this.shadowRoot.querySelector('[data-control="grassAudio"]');
        const flashes = this.shadowRoot.querySelector('[data-control="flashes"]');
        const fishDestination = this.shadowRoot.querySelector("[data-fish-destination]");
        const fishPreset = this.shadowRoot.querySelector("[data-fish-preset]");
        const addFish = this.shadowRoot.querySelector("[data-add-fish]");

        weather.addEventListener("change", () => this.world?.setWeather(weather.value));
        volume.addEventListener("input", () => this.world?.setVolume(volume.valueAsNumber));
        grassAudio.addEventListener("change", () => this.world?.setGrassAudio(grassAudio.checked));
        flashes.addEventListener("change", () => this.world?.setFlashes(flashes.checked));
        addFish.addEventListener("click", async () => {
            addFish.disabled = true;

            try {
                const result = await this.world?.addFish({
                    destination: fishDestination.value,
                    preset: fishPreset.value
                });

                if (result)
                    addFish.textContent = `Add fish · ${result.population.total} total`;
            }
            catch (error) {
                addFish.textContent = "Could not add fish";
            }
            finally {
                addFish.disabled = false;
            }
        });
    }
}

export const defineKoiWorldControlsElement = () => {
    if (globalThis.customElements && !customElements.get("koi-world-controls"))
        customElements.define("koi-world-controls", KoiWorldControlsElement);

    return KoiWorldControlsElement;
};

defineKoiWorldControlsElement();
