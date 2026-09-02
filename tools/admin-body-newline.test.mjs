import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin journal body normalizes Enter to LF and the reader renders it as a line break", async () => {
  const [adminLibrary, globalCss] = await Promise.all([
    readFile(new URL("../src/lib/online-photo-admin.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/index.css", import.meta.url), "utf8"),
  ]);

  assert.match(adminLibrary, /function formMultilineText[\s\S]*replace\(\/\\r\\n\?\/g, "\\n"\)/);
  assert.match(adminLibrary, /const body = formMultilineText\(form, "body", existing\?\.body \|\| ""\);/);
  assert.match(globalCss, /\.markdown-body\s*\{[\s\S]*?white-space:\s*pre-line;/);
});
