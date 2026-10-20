import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function originFor(mode, configured, address, host) {
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL("../lib/request-origin.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports: module.exports, require: () => ({}), URL,
    process: { env: { NODE_ENV: mode, JAGUAR_APP_ORIGIN: configured } } });
  return module.exports.requestOrigin(new Request(address, { headers: { host } }));
}

test("local development uses the actual loopback request host for sign-out origin checks", () => {
  assert.equal(originFor("development", "http://127.0.0.1:3000", "http://localhost:3000/api/session", "localhost:3000"), "http://localhost:3000");
  assert.equal(originFor("development", "http://localhost:3000", "http://localhost:3000/api/session", "127.0.0.1:3000"), "http://127.0.0.1:3000");
});

test("other hosts, ports and production retain the configured origin", () => {
  for (const [mode, host] of [["development", "evil.example:3000"], ["development", "localhost:3001"], ["production", "localhost:3000"]]) {
    assert.equal(originFor(mode, "http://127.0.0.1:3000", "http://localhost:3000/api/session", host), "http://127.0.0.1:3000");
  }
  assert.equal(originFor("development", "https://ignis.example", "http://localhost:3000/api/session", "localhost:3000"), "https://ignis.example");
});
