import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the browser entry point has no Electron bridge", async () => {
    const [html, main, menu, discord, packageSource] = await Promise.all([
        read("index.html"),
        read("js/main.js"),
        read("js/koi/gui/menu/menu.js"),
        read("js/koi/gui/loader/loaderDiscord.js"),
        read("package.json")
    ]);
    const browserSource = [html, main, menu, discord, packageSource].join("\n");

    assert.doesNotMatch(browserSource, /window\["require"\]|electron-packager|\"electron\"/);
    assert.match(html, /js\/storage\/storageLocal\.js/);
    assert.doesNotMatch(html, /storageFile/);
    assert.match(main, /canPlayType\('audio\/ogg/);
});

test("the package exposes the embeddable web component", async () => {
    const packageJson = JSON.parse(await read("package.json"));
    const component = await read("embed/koi-farm.js");

    assert.equal(packageJson.exports["."], "./embed/koi-farm.js");
    assert.equal(packageJson.exports["./world"], "./embed/koi-farm.js");
    assert.equal(packageJson.exports["./system"], "./embed/koi-farm.js");
    assert.match(component, /class KoiWorldElement/);
    assert.match(component, /class KoiSystemElement/);
    assert.match(component, /class KoiFarmElement/);
    assert.match(component, /defineElement\("koi-world"/);
    assert.match(component, /defineElement\("koi-system"/);
});

test("embedded saves can be isolated with a storage namespace", async () => {
    const [storage, main, component] = await Promise.all([
        read("js/storage/storageLocal.js"),
        read("js/main.js"),
        read("embed/koi-farm.js")
    ]);

    assert.match(storage, /this\.prefix/);
    assert.match(main, /searchParams\.get\("storage"\)/);
    assert.match(component, /storage-key/);
});

test("world mode bypasses the system UI and automatically starts a pond", async () => {
    const [main, loader, style, demo] = await Promise.all([
        read("js/main.js"),
        read("js/koi/gui/loader/loader.js"),
        read("css/style.css"),
        read("embed/index.html")
    ]);

    assert.match(main, /WORLD_ONLY/);
    assert.match(main, /loader\.setAutomaticSlot\(WORLD_POND\)/);
    assert.match(main, /WORLD_ONLY \? null : new TutorialBreeding/);
    assert.match(loader, /automaticSlot/);
    assert.match(style, /\.koi-world-mode #gui/);
    assert.match(style, /visibility: hidden/);
    assert.match(demo, /<koi-world/);
    assert.doesNotMatch(demo, /<koi-farm/);
});
