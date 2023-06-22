"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha1 = void 0;
async function sha1(source) {
    const sourceBytes = new TextEncoder().encode(source);
    const digest = await globalThis.crypto.subtle.digest("SHA-1", sourceBytes);
    const resultBytes = [...new Uint8Array(digest)];
    return resultBytes.map((x) => x.toString(16).padStart(2, "0")).join("");
}
exports.sha1 = sha1;
