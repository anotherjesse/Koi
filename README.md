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

Open `http://127.0.0.1:4173/` for the standalone game or `http://127.0.0.1:4173/embed/` for the embedding example.

Create a deployable static site in `dist/` with:

```sh
npm run build
npm run preview
```

## Embed in another project

Serve this package's browser assets from a public path, import the custom element, and point it at the game entry page:

```html
<script type="module" src="/koi/embed/koi-farm.js"></script>

<koi-farm
    src="/koi/index.html"
    storage-key="my-site"
    title="My koi pond">
</koi-farm>
```

The component fills its available width with a 3:2 aspect ratio. These optional attributes configure an instance:

- `lang`: a supported locale such as `en-metric`, `ja`, or `nl`.
- `pond`: immediately open pond `0`, `1`, or `2`.
- `storage-key`: namespace save data when a site hosts multiple instances.
- `social`: show the Discord link; it is hidden in embeds by default.
- `loading`: set the iframe loading mode to `eager` or `lazy`.

The element emits `koi-farm:load`, `koi-farm:ready`, and `koi-farm:session` events. It also exposes `openPond(index)`, `openMenu()`, and `reload()` methods.

When consuming the package from JavaScript, importing `koifarm` registers the element and also exports `KoiFarmElement` and `defineKoiFarmElement`.

## Translations

The game is available in several languages. Translations can be found in [this repository](https://github.com/jobtalle/KoiTranslations), and new translations can be proposed there; when new translations are made, I will add them to the game.

## Contributing

Contributions can be proposed by submitting pull requests. The best place to ask questions is in [the official discord](https://discord.gg/bw3ZFe63Qg), which has a dedicated channel for source code related discussions.

## License

Koi Farm is distributed under the [Apache 2.0 with Commons Clause](LICENSE.md) license.

Audio by [3xBlast](http://3xblast.com/3xblast.com/).

Concept art by [Samma van Klaarbergen](https://www.artstation.com/samma).

Logo by [Eveline Dubblinga](https://www.artstation.com/rosebolt).
