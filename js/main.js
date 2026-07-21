const searchParams = new URLSearchParams(window.location.search);
const glParameters = {
    alpha: false,
    antialias: window["localStorage"].getItem(Menu.prototype.KEY_MSAA) === null || window["localStorage"].getItem(Menu.prototype.KEY_MSAA) === "true",
    premultipliedAlpha: true,
    preserveDrawingBuffer: true
};
const canvas = document.getElementById("renderer");
const gl =
    canvas.getContext("webgl", glParameters) ||
    canvas.getContext("experimental-webgl", glParameters);
let chosenLocale = null;
let chosenSlot = -1;

/**
 * Check if game is running within WKWebView on iOS.
 */

const RUNNING_ON_WEBVIEW_IOS = (window.webkit && window.webkit.messageHandlers) ? true : false;
const WORLD_ONLY = searchParams.get("mode") === "world";
const WORLD_SAVE_KEY = searchParams.get("save") || "koi-world";
const SHOW_SOCIAL_LINK = searchParams.get("social") !== "0";
const requestedPopulation = Number(searchParams.get("population"));
const WORLD_INITIAL_POPULATION = searchParams.has("population") &&
    Number.isInteger(requestedPopulation) &&
    requestedPopulation >= 0 &&
    requestedPopulation <= Koi.prototype.FISH_CAPACITY ? requestedPopulation : null;

document.documentElement.classList.toggle("koi-world-mode", WORLD_ONLY);

/**
 * Reload the game into the menu
 */
const reloadMenu = () => {
    window.location = window.location.protocol + "//" + window.location.host + window.location.pathname;
};

/**
 * Reload the currently loaded game
 */
const reloadGame = () => {
    if (chosenSlot === -1)
        reloadMenu();
    else
        window.location = window.location.protocol + "//" + window.location.host + window.location.pathname + "?resume=" + chosenSlot.toString();
};

/**
 * Called when loading resources failed
 */
const onFailure = () => {
    alert("Failed loading resources");
};

/**
 * Make a language object from a locale code
 * @param {String} locale The locale code
 * @returns {Language} The language object most suitable for this locale
 */
const makeLanguage = locale => {
    switch (locale) {
        default:
        case "en":
        case "en-imperial":
            chosenLocale = "en-imperial";

            return new Language("KoiTranslations/english_imperial.json");
        case "en-metric":
            chosenLocale = "en-metric";

            return new Language("KoiTranslations/english_metric.json");
        case "nl":
            chosenLocale = "nl";

            return new Language("KoiTranslations/dutch.json");
        case "pl":
            chosenLocale = "pl";

            return new Language("KoiTranslations/polish.json");
        case "tr":
            chosenLocale = "tr";

            return new Language("KoiTranslations/turkish.json");
        case "de":
            chosenLocale = "de";

            return new Language("KoiTranslations/german.json");
        case "fr":
            chosenLocale = "fr";

            return new Language("KoiTranslations/french.json");
        case "ja":
            chosenLocale = "ja";

            return new Language("KoiTranslations/japanese.json");
        case "es":
            chosenLocale = "es";

            return new Language("KoiTranslations/spanish.json");
        case "pt":
            chosenLocale = "pt";

            return new Language("KoiTranslations/portuguese.json");
        case "zh":
            chosenLocale = "zh";

            return new Language("KoiTranslations/simplifiedchinese.json");
        case "ko":
            chosenLocale = "ko";

            return new Language("KoiTranslations/korean.json");
        case "ru":
            chosenLocale = "ru";

            return new Language("KoiTranslations/russian.json");
        case "fy":
            chosenLocale = "fy";

            return new Language("KoiTranslations/frisian.json");
        case "uk":
            chosenLocale = "uk";

            return new Language("KoiTranslations/ukrainian.json");
        case "it":
            chosenLocale = "it";

            return new Language("KoiTranslations/italian.json");
        case "fil":
            chosenLocale = "fil";

            return new Language("KoiTranslations/filipino.json");
        case "id":
            chosenLocale = "id";

            return new Language("KoiTranslations/indonesian.json");
        case "sr":
        case "sr-latn":
            chosenLocale = "sr-latn";

            return new Language("KoiTranslations/serbian_latin.json");
        case "sr-cyrl":
            chosenLocale = "sr-cyrl";

            return new Language("KoiTranslations/serbian_cyrillic.json");
    }
};

const paramLang = searchParams.get("lang") || window["localStorage"].getItem(Menu.prototype.KEY_LANGUAGE);
const language = paramLang ? makeLanguage(paramLang) : makeLanguage(navigator.language.substring(0, 2));
const loader = new Loader(
    document.getElementById("loader"),
    document.getElementById("loader-graphics"),
    document.getElementById("loader-slots"),
    document.getElementById("loader-button-settings"),
    document.getElementById("wrapper"),
    !RUNNING_ON_WEBVIEW_IOS && SHOW_SOCIAL_LINK && !WORLD_ONLY,
    !RUNNING_ON_WEBVIEW_IOS && !WORLD_ONLY);
let imperial = false;

if (gl &&
    gl.getExtension("OES_element_index_uint") &&
    (gl.vao = gl.getExtension("OES_vertex_array_object"))) {
    const audioEngine = new AudioEngine(new Random());
    const audioFormat = document.createElement("audio").canPlayType('audio/ogg; codecs="vorbis"') ? "ogg" : "wav";
    const audio = new AudioBank(audioEngine, audioFormat);

    language.load(() => {
        imperial = language.get("UNIT_LENGTH") === "ft";

        const settings = {
            flash: true
        };

        let session = new Session();
        let activeSaveKey = null;
        const slotNames = ["session", "session2", "session3"];
        const storage = new StorageLocal(searchParams.get("storage"));
        const wrapper = document.getElementById("wrapper");
        const gui = new GUI(
            document.getElementById("gui"),
            new CodeViewer(document.getElementById("code"), storage),
            audio);
        const systems = new Systems(gl, new Random(2893), wrapper.clientWidth, wrapper.clientHeight);
        const menu = WORLD_ONLY ? null : new Menu(
            document.getElementById("menu"),
            loader.fullscreen,
            chosenLocale,
            audioEngine,
            settings,
            audio);
        let lastTime = null;
        let koi = null;
        let loaded = true;
        let mouseLeft = false;
        let alt = false;
        let control = false;
        let shift = false;

        new Drop(gui, systems, document.getElementById("drop"), canvas);

        if (menu)
            loader.setMenu(menu);

        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;

        window.onresize = () => {
            if (canvas.width === wrapper.clientWidth && canvas.height === wrapper.clientHeight)
                return;

            canvas.width = wrapper.clientWidth;
            canvas.height = wrapper.clientHeight;

            systems.resize(canvas.width, canvas.height);
            gui.resize();

            if (koi)
                koi.resize();
        };

        /**
         * Save the game state to local storage
         */
        const save = () => {
            storage.setBuffer(activeSaveKey, session.serialize(koi, gui));
        };

        /**
         * Notify an embedding page about a lifecycle event without exposing save data
         * @param {String} type The event type
         * @param {Object} detail Public event details
         */
        const notifyHost = (type, detail) => {
            const message = Object.assign({
                source: "koi-farm",
                type: type
            }, detail || {});

            window.dispatchEvent(new CustomEvent(type, {detail: message}));

            if (window.parent !== window)
                window.parent.postMessage(message, "*");
        };

        window.addEventListener("message", event => {
            const message = event.data;

            if (event.source !== window.parent ||
                !message ||
                message.source !== "koi-component")
                return;

            if (message.type === "koi-farm:save") {
                if (koi)
                    save();

                notifyHost("koi-farm:saved", {
                    requestId: message.requestId,
                    saveKey: activeSaveKey
                });

                return;
            }

            if (message.type === "koi-farm:add-fish") {
                if (!koi)
                    return;

                try {
                    const result = koi.addFish(message.spec);

                    save();
                    notifyHost("koi-farm:fish-added", {
                        requestId: message.requestId,
                        added: result.added,
                        population: result.population
                    });
                }
                catch (error) {
                    notifyHost("koi-farm:fish-added", {
                        requestId: message.requestId,
                        error: error instanceof Error ? error.message : "Invalid fish specification"
                    });
                }

                return;
            }

            if (message.type !== "koi-farm:control" || !koi)
                return;

            let value = message.value;

            switch (message.control) {
                case "weather":
                    if (typeof value !== "string")
                        return;

                    try {
                        koi.setWeather(value);
                    }
                    catch (error) {
                        return;
                    }

                    break;
                case "volume":
                    if (typeof value !== "number" || !Number.isFinite(value))
                        return;

                    value = Math.max(0, Math.min(1, value));
                    audioEngine.setMasterVolume(value);

                    break;
                case "grassAudio":
                    if (typeof value !== "boolean")
                        return;

                    audioEngine.granular = value;

                    break;
                case "flashes":
                    if (typeof value !== "boolean")
                        return;

                    settings.flash = value;

                    break;
                default:
                    return;
            }

            notifyHost("koi-farm:control", {
                control: message.control,
                value: value
            });
        });

        /**
         * A function that creates a new game session
         * @param {String} saveKey The opaque storage key for this session
         * @param {Object} detail Public identity for the session
         */
        const newSession = (saveKey, detail) => {
            activeSaveKey = saveKey;
            session = new Session();

            gui.clear();

            if (koi)
                koi.free();

            koi = session.makeKoi(
                storage,
                systems,
                audio,
                gui,
                save,
                WORLD_ONLY ? null : new TutorialBreeding(storage, gui.overlay),
                WORLD_ONLY ? WORLD_INITIAL_POPULATION : null);

            notifyHost("koi-farm:session", Object.assign({
                resumed: false,
                population: koi.getPopulation()
            }, detail));
        };

        /**
         * Continue an existing game
         * @param {String} saveKey The opaque storage key for this session
         * @param {Object} detail Public identity for the session
         */
        const continueGame = (saveKey, detail) => {
            activeSaveKey = saveKey;

            gui.cards.enableBookButton(audio);

            try {
                session.deserialize(storage.getBuffer(activeSaveKey));

                koi = session.makeKoi(storage, systems, audio, gui, save);

                notifyHost("koi-farm:session", Object.assign({
                    resumed: true,
                    population: koi.getPopulation()
                }, detail));
            } catch (error) {
                newSession(saveKey, detail);

                console.warn(error);
            }
        };

        const resumables = WORLD_ONLY ? null : slotNames.map(saveKey =>
            storage.getBuffer(saveKey) !== null);
        const worldResumable = WORLD_ONLY && storage.getBuffer(WORLD_SAVE_KEY) !== null;

        if (resumables)
            loader.setResumables(resumables);

        // Trigger the animation frame loop
        lastTime = performance.now();

        const loop = time => {
            if (loaded && koi) {
                koi.render(.001 * (time - lastTime), settings);

                lastTime = time;

                requestAnimationFrame(loop);
            }
        };

        canvas.addEventListener("mousedown", event => {
            event.preventDefault();

            koi.touchStart(event.clientX, event.clientY, control, shift);
        });

        canvas.addEventListener("touchstart", event => {
            event.preventDefault();

            koi.touchStart(event.changedTouches[0].clientX, event.changedTouches[0].clientY, control, shift);
        });

        canvas.addEventListener("mousemove", event => {
            koi.touchMove(event.clientX, event.clientY, mouseLeft);

            mouseLeft = false;
        });

        canvas.addEventListener("touchmove", event => {
            event.preventDefault();

            koi.touchMove(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        })

        canvas.addEventListener("mouseup", () => {
            koi.touchEnd();
        });

        canvas.addEventListener("touchend", event => {
            event.preventDefault();

            koi.touchEnd();
        });

        canvas.addEventListener("mouseleave", () => {
            koi.mouseLeave();

            mouseLeft = true;
        });

        window.onkeydown = event => {
            if (event.key === "Alt")
                alt = true;
            else if (event.key === "Control")
                control = true;
            else if (event.key === "Shift")
                shift = true;
            else if (event.key === "Enter" && alt)
                loader.fullscreen.toggle();
            else if (menu && (event.key === "Escape" || event.key === "m"))
                menu.toggle();
            else if (koi && koi.keyDown(event.key))
                event.preventDefault();
        };

        window.onfocus = () => {
            alt = control = shift = false;
        };

        window.onkeyup = event => {
            switch (event.key) {
                case "Alt":
                    alt = false;

                    break;
                case "Control":
                    control = false;

                    break;
                case "Shift":
                    shift = false;

                    break;
            }
        };

        window.onbeforeunload = () => {
            gui.cancelAction();
            if (koi) {
                koi.touchEnd();

                save();

                koi.free();
            }

            systems.free();
            gui.clear();

            loaded = false;
        };

        window.addEventListener('appMovedToBackground', () => {
            if (koi)
                save();

            if (menu)
                menu.show();
        });

        if (WORLD_ONLY) {
            loader.setNewGameCallback(saveKey =>
                newSession(saveKey, {saveKey: saveKey}));
            loader.setContinueCallback(saveKey =>
                continueGame(saveKey, {saveKey: saveKey}));
            loader.setAutomaticSave(WORLD_SAVE_KEY, worldResumable);
        }
        else {
            loader.setNewGameCallback(index => {
                chosenSlot = index;
                newSession(slotNames[index], {pond: index});
            });
            loader.setContinueCallback(index => {
                chosenSlot = index;
                continueGame(slotNames[index], {pond: index});
            });
        }

        loader.setFinishCallback(() => {
            requestAnimationFrame(loop);

            audioEngine.interact();
        });

        notifyHost("koi-farm:ready", WORLD_ONLY ? {
            locale: chosenLocale,
            mode: "world",
            saveKey: WORLD_SAVE_KEY,
            resumable: worldResumable
        } : {
            locale: chosenLocale,
            mode: "system",
            resumables: resumables
        });
    }, onFailure);

    // Create globally available SVG defs
    new FishIconDefs(
        document.getElementById("fish-icon-defs"),
        new Random(Random.prototype.makeSeed(Koi.prototype.COLOR_BACKGROUND.r)));
    new CodeIconDefs(
        document.getElementById("code-icon-defs"));
}
else
    onFailure();
