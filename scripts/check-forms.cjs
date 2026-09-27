// Exercise the real frontend handler and unchanged backend without sending email.
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const source = fs.readFileSync(
  path.resolve(__dirname, "../site/site.js"),
  "utf8",
);
function harness(kind, values, response) {
  let handler,
    resets = 0,
    calls = [];
  const submit = { textContent: "Send request", disabled: false };
  const status = { textContent: "", className: "", focus() {} };
  const form = {
    dataset: { leadForm: kind },
    reportValidity: () => true,
    querySelector: () => submit,
    addEventListener: (event, fn) => (handler = fn),
    setAttribute() {},
    removeAttribute() {},
    reset() {
      resets++;
    },
  };
  const context = {
    document: {
      documentElement: { classList: { add() {} } },
      querySelector: (selector) =>
        selector === "form[data-lead-form]"
          ? form
          : selector === "#form-status"
            ? status
            : null,
    },
    FormData: class {
      *[Symbol.iterator]() {
        yield* Object.entries(values);
      }
    },
    fetch: async (url, options) => {
      calls.push({ url, ...options });
      return response();
    },
    AbortController,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(source, context);
  return {
    send: () => handler({ preventDefault() {} }),
    status,
    submit,
    calls,
    get resets() {
      return resets;
    },
  };
}
async function run() {
  const values = {
    name: " Sample Customer ",
    email: "customer@example.invalid",
    phone: "555-0100",
    address: "Test project area",
    fenceType: "Galvanized chain-link",
    linearFootage: "150.5",
    fenceHeight: "6",
    corners: "2",
    endpoints: "2",
    singleGates: "1",
    doubleGates: "0",
    cantileverGates: "0",
    description: "Repair fence by access gate.",
    company: "Sample Company",
    projectType: "Commercial",
    workType: "Repair",
    timeline: "October",
  };
  const ok = () =>
    Promise.resolve({ ok: true, json: async () => ({ success: true }) });
  const quote = harness("quote", values, ok);
  await quote.send();
  assert.equal(quote.calls.length, 1);
  assert.equal(quote.calls[0].url, "/api/quote");
  assert.equal(quote.calls[0].method, "POST");
  const payload = JSON.parse(quote.calls[0].body);
  assert.deepEqual(Object.keys(payload), [
    "name",
    "email",
    "phone",
    "address",
    "fenceType",
    "linearFootage",
    "fenceHeight",
    "corners",
    "endpoints",
    "singleGates",
    "doubleGates",
    "cantileverGates",
    "description",
  ]);
  assert.equal(payload.name, "Sample Customer");
  assert.equal(payload.doubleGates, "0");
  assert.equal(payload.linearFootage, "150.5");
  for (const expected of [
    "Company: Sample Company",
    "Property / project type: Commercial",
    "Work requested: Repair",
    "Desired schedule: October",
    values.description,
  ])
    assert(payload.description.includes(expected));
  assert.equal(quote.resets, 1);
  assert(quote.status.className.includes("success"));
  assert.equal(quote.submit.disabled, false);
  const contact = harness(
    "contact",
    {
      name: "Customer",
      email: "customer@example.invalid",
      message: "Contact test",
    },
    ok,
  );
  await contact.send();
  assert.equal(contact.calls[0].url, "/api/contact");
  assert.deepEqual(JSON.parse(contact.calls[0].body), {
    name: "Customer",
    email: "customer@example.invalid",
    message: "Contact test",
  });
  for (const response of [
    () =>
      Promise.resolve({ ok: false, json: async () => ({ success: false }) }),
    () => Promise.resolve({ ok: true, json: async () => ({ success: false }) }),
    () =>
      Promise.resolve({
        ok: true,
        json: async () => {
          throw Error("HTML response");
        },
      }),
    () => Promise.reject(Error("Network unavailable")),
  ]) {
    const failed = harness("quote", values, response);
    await failed.send();
    assert.equal(failed.resets, 0);
    assert(failed.status.className.includes("error"));
    assert.equal(failed.submit.disabled, false);
  }
  const blank = harness(
    "contact",
    { name: "   ", email: "a@b.invalid", message: "Test" },
    ok,
  );
  await blank.send();
  assert.equal(blank.calls.length, 0);
  let resolveRequest;
  const pending = harness(
    "quote",
    values,
    () => new Promise((resolve) => (resolveRequest = resolve)),
  );
  const first = pending.send();
  await pending.send();
  assert.equal(pending.calls.length, 1);
  assert.equal(pending.submit.disabled, true);
  resolveRequest(await ok());
  await first;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "fury-form-test-"));
  fs.copyFileSync(
    path.resolve(__dirname, "../server.js"),
    path.join(temp, "server.js"),
  );
  const port = 4499;
  const server = spawn(process.execPath, [path.join(temp, "server.js")], {
    env: {
      PATH: process.env.PATH,
      NODE_PATH: path.resolve(__dirname, "../node_modules"),
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(Error("Local backend timeout")),
        5000,
      );
      server.stdout.once("data", () => {
        clearTimeout(timeout);
        resolve();
      });
      server.once("error", reject);
      server.once("exit", (code) => {
        if (code) reject(Error("Local backend exited " + code));
      });
    });
    for (const [endpoint, data, file] of [
      ["quote", payload, "quote_requests.json"],
      [
        "contact",
        JSON.parse(contact.calls[0].body),
        "contact_submissions.json",
      ],
    ]) {
      const r = await fetch(`http://127.0.0.1:${port}/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      assert.equal(r.status, 200);
      assert.equal((await r.json()).success, true);
      const stored = JSON.parse(
        fs.readFileSync(path.join(temp, file), "utf8"),
      )[0];
      for (const [key, value] of Object.entries(data))
        assert.equal(stored[key], value, `Stored ${endpoint}.${key}`);
    }
  } finally {
    server.kill();
    await new Promise((resolve) => server.once("exit", resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log(
    "Passed: quote/contact payloads, commercial details, zero counts, success, failures, retained inputs, submission lock and unchanged local backend storage. No email sent.",
  );
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
