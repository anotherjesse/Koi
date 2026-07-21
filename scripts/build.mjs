import {cp, mkdir, rm} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(projectRoot, "dist");
const browserFiles = [
    "audio",
    "css",
    "embed",
    "font",
    "js",
    "KoiTranslations",
    "svg",
    "autumn.css",
    "favicon.ico",
    "index.html",
    "manifest.json",
    "winter.css"
];

await rm(outputRoot, {recursive: true, force: true});
await mkdir(outputRoot, {recursive: true});

for (const entry of browserFiles)
    await cp(resolve(projectRoot, entry), resolve(outputRoot, entry), {recursive: true});

console.log(`Built browser site in ${outputRoot}`);

