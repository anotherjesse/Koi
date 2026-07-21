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
    assert.match(component, /class KoiFarmElement/);
    assert.match(component, /customElements\.define/);
    assert.match(component, /koi-farm:ready/);
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
