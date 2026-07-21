/**
 * A storage system using the browsers local storage
 * @constructor
 */
const StorageLocal = function(namespace) {
    StorageSystem.call(this);

    this.prefix = namespace ? namespace + ":" : "";
};

StorageLocal.prototype = Object.create(StorageSystem.prototype);

/**
 * Get the browser storage key for a game key
 * @param {String} key The game storage key
 * @returns {String} The namespaced browser storage key
 */
StorageLocal.prototype.makeKey = function(key) {
    return this.prefix + key;
};

/**
 * Set the value of an item
 * @param {String} key The key of the item
 * @param {String} value The value of the item
 */
StorageLocal.prototype.set = function(key, value) {
    window["localStorage"].setItem(this.makeKey(key), value);
};

/**
 * Set the buffer of an item
 * @param {String} key The key of the item
 * @param {BinBuffer} value The buffer of the item
 */
StorageLocal.prototype.setBuffer = function(key, value) {
    this.set(key, value.toString());
};

/**
 * Get an item
 * @param {String} key The key of the item
 * @returns {String|null} The value of the item, or null if it does not exist
 */
StorageLocal.prototype.get = function(key) {
    return window["localStorage"].getItem(this.makeKey(key));
};

/**
 * Get a buffer
 * @param {String} key The key of the buffer
 * @returns {BinBuffer|null} The buffer, or null if it does not exist
 */
StorageLocal.prototype.getBuffer = function(key) {
    const string = this.get(key);

    if (string)
        return new BinBuffer(string);

    return null;
};

/**
 * Remove an item
 * @param {String} key The key of the item
 */
StorageLocal.prototype.remove = function(key) {
    window["localStorage"].removeItem(this.makeKey(key));
};

/**
 * Save an image
 * @param {Blob} blob The image blob data
 * @param {String} name The file name
 */
StorageLocal.prototype.imageToFile = function(blob, name) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);

    a.href = url;
    a.download = name;

    document.body.appendChild(a);

    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
};
