# Koi Farm

A browser-first Koi breeding game. It runs as a standalone site and can be embedded in another project as a web component. Get the original desktop release [on Steam](https://store.steampowered.com/app/1518810/Koi_Farm) or [on itch.io](https://jobtalle.itch.io/koifarm).

[![alt text](screenshots.png "Koi Farm")](https://youtu.be/2JS6PEr1jUo)

## Run locally

Clone the repository with its translation submodule, then start the zero-dependency development server:

```sh
git clone --recurse-submodules https://github.com/jobtalle/Koi.git
cd Koi
npm run dev
```

Open `http://127.0.0.1:4173/` for the standalone game, `http://127.0.0.1:4173/embed/` for the world-only component, or `http://127.0.0.1:4173/embed/system.html` for the complete system component.

Create a deployable static site in `dist/` with:

```sh
npm run build
npm run preview
```

## Components

The browser package has two primary component boundaries:

- `<koi-world>` is only the live pond, world, and koi renderer. It automatically starts or resumes a pond and omits the pond chooser, settings menu, cards, and tutorial UI.
- `<koi-system>` is the complete save-slot and menu experience.

`<koi-farm>` remains available as a backward-compatible alias for `<koi-system>`.

Serve this package's browser assets from a public path, import the component module, and point components at the game entry page when it is hosted somewhere else:

```html
<script type="module" src="/koi/embed/koi-farm.js"></script>

<koi-world
    src="/koi/index.html"
    save-key="homepage-pond"
    title="My koi pond">
</koi-world>
```

Add the complete system separately when a project needs it:

```html
<koi-system src="/koi/index.html" storage-key="my-site"></koi-system>
```

An optional controls component can target a world by ID. It is separate from the renderer, so applications can omit it or build their own UI with the same methods:

```html
<koi-world id="garden" save-key="garden"></koi-world>
<koi-world-controls for="garden"></koi-world-controls>
```

The controls expose automatic weather plus `sunny`, `overcast`, `drizzle`, `rain`, and `thunderstorm` presets, along with volume, grass sounds, and lightning flashes. The weather presets use the simulation's existing weather, wind, precipitation, ambient color, insect, and audio behavior. Koi Farm does not currently simulate time of day, so there is no day/night control.

Each component fills its available width with a 3:2 aspect ratio. `<koi-world>` accepts an opaque `save-key`, so applications can create any number of independently saved worlds without exposing the system's slot model:

```html
<koi-world save-key="garden"></koi-world>
<koi-world save-key="courtyard"></koi-world>
```

The exact key is used for save and load in browser storage. If omitted, it defaults to `koi-world`. These optional attributes configure an instance:

- `lang`: a supported locale such as `en-metric`, `ja`, or `nl`.
- `save-key`: the arbitrary save name for `<koi-world>`.
- `pond`: open system slot `0`, `1`, or `2`; only used by `<koi-system>`.
- `storage-key`: namespace all system save slots; only used by `<koi-system>`.
- `social`: show the Discord link in `<koi-system>`; it is hidden by default and is always omitted from `<koi-world>`.
- `loading`: set the iframe loading mode to `eager` or `lazy`.

The components emit prefixed lifecycle events: `koi-world:load`, `koi-world:ready`, `koi-world:session`, `koi-world:saved`, and `koi-world:control` for the world; `koi-system:*` for the complete system. A world exposes `saveKey`, `load(saveKey)`, `save()`, `reload()`, `setWeather(preset)`, `setVolume(level)`, `setGrassAudio(enabled)`, and `setFlashes(enabled)`. Switching keys saves the current world before loading the next one. The system exposes `openPond(index)`, `openMenu()`, and `reload()`.

When consuming the package from JavaScript, importing `koifarm` registers all four tags and exports `KoiWorldElement`, `KoiWorldControlsElement`, `KoiSystemElement`, `KoiFarmElement`, and their registration helpers.

## Translations

The game is available in several languages. Translations can be found in [this repository](https://github.com/jobtalle/KoiTranslations), and new translations can be proposed there; when new translations are made, I will add them to the game.

## Contributing

Contributions can be proposed by submitting pull requests. The best place to ask questions is in [the official discord](https://discord.gg/bw3ZFe63Qg), which has a dedicated channel for source code related discussions.

## License

Koi Farm is distributed under the [Apache 2.0 with Commons Clause](LICENSE.md) license.

Audio by [3xBlast](http://3xblast.com/3xblast.com/).

Concept art by [Samma van Klaarbergen](https://www.artstation.com/samma).

Logo by [Eveline Dubblinga](https://www.artstation.com/rosebolt).
