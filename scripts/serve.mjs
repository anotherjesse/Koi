import {createReadStream} from "node:fs";
import {stat} from "node:fs/promises";
import {createServer} from "node:http";
import {extname, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";

const args = process.argv.slice(2);
const readOption = (name, fallback) => {
    const index = args.indexOf(name);

    return index === -1 ? fallback : args[index + 1];
};
const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const root = resolve(projectRoot, readOption("--root", "."));
const port = Number(readOption("--port", process.env.PORT || "4173"));
const host = readOption("--host", "127.0.0.1");
const contentTypes = new Map([
    [".css", "text/css; charset=utf-8"],
    [".html", "text/html; charset=utf-8"],
    [".ico", "image/x-icon"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".ogg", "audio/ogg"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".ttf", "font/ttf"],
    [".wav", "audio/wav"]
]);

const server = createServer(async (request, response) => {
    try {
        const url = new URL(request.url, `http://${request.headers.host || host}`);
        const pathname = decodeURIComponent(url.pathname);
        const requested = pathname.endsWith("/") ? pathname + "index.html" : pathname;
        const file = resolve(root, "." + requested);

        if (file !== root && !file.startsWith(root + sep)) {
            response.writeHead(403).end("Forbidden");
            return;
        }

        const fileStat = await stat(file);

        if (!fileStat.isFile())
            throw new Error("Not a file");

        response.writeHead(200, {
            "Content-Length": fileStat.size,
            "Content-Type": contentTypes.get(extname(file).toLowerCase()) || "application/octet-stream",
            "Cache-Control": "no-cache"
        });

        if (request.method === "HEAD")
            response.end();
        else
            createReadStream(file).pipe(response);
    } catch (error) {
        response.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
        response.end("Not found");
    }
});

server.listen(port, host, () => {
    console.log(`Koi Farm is available at http://${host}:${port}/`);
    console.log(`Serving ${root}`);
});

