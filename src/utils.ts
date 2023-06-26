const crypto = typeof window === "undefined" ? require("crypto") : window.crypto;

export async function sha1(source: string) {
  const sourceBytes = new TextEncoder().encode(source);
  const digest: ArrayBuffer = await crypto.subtle.digest("SHA-1", sourceBytes);
  const resultBytes = [...new Uint8Array(digest)];
  return resultBytes.map((x) => x.toString(16).padStart(2, "0")).join("");
}
