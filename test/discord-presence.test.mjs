import assert from "node:assert/strict";
import test from "node:test";
import { createPresenceService } from "../lib/discord-presence.mjs";

const userId = "229242467965206528";

function makeClient(fetchMember, ready = true) {
  return {
    isReady: () => ready,
    guilds: { cache: new Map([["guild", { available: true, members: { fetch: fetchMember } }]]) },
  };
}

test("reports Discord presence and an absent presence as offline", async () => {
  for (const status of ["online", "idle", "dnd", null]) {
    const client = makeClient(async (options) => {
      assert.deepEqual(options, { user: [userId], withPresences: true, time: 5000 });
      return new Map([[userId, { presence: status ? { status } : null }]]);
    });
    const result = await createPresenceService(client)();
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.status, status ?? "offline");
    assert.equal(result.body.online, status !== null);
  }
});

test("returns unavailable before the client is ready", async () => {
  const getStatus = createPresenceService(makeClient(async () => { throw new Error("unexpected lookup"); }, false));
  assert.equal((await getStatus()).statusCode, 503);
});

test("caches results for five minutes and refreshes after expiry", async () => {
  let now = 0;
  let calls = 0;
  const getStatus = createPresenceService(makeClient(async () => {
    calls += 1;
    return new Map([[userId, { presence: { status: calls === 1 ? "online" : "dnd" } }]]);
  }), { now: () => now });

  assert.equal((await getStatus()).body.status, "online");
  now = 299999;
  assert.equal((await getStatus()).body.status, "online");
  assert.equal(calls, 1);
  now = 300000;
  assert.equal((await getStatus()).body.status, "dnd");
  assert.equal(calls, 2);
});

test("caches a not-found result but retries failed lookups", async () => {
  let missingCalls = 0;
  const missing = createPresenceService(makeClient(async () => { missingCalls += 1; return new Map(); }));
  assert.equal((await missing()).statusCode, 404);
  assert.equal((await missing()).statusCode, 404);
  assert.equal(missingCalls, 1);

  let failedCalls = 0;
  const retry = createPresenceService(makeClient(async () => {
    failedCalls += 1;
    if (failedCalls === 1) throw new Error("Discord unavailable");
    return new Map([[userId, { presence: { status: "online" } }]]);
  }));
  assert.equal((await retry()).statusCode, 503);
  assert.equal((await retry()).statusCode, 200);
  assert.equal(failedCalls, 2);
});

test("shares concurrent lookups", async () => {
  let calls = 0;
  let finish;
  const wait = new Promise((resolve) => { finish = resolve; });
  const getStatus = createPresenceService(makeClient(async () => {
    calls += 1;
    await wait;
    return new Map([[userId, { presence: { status: "online" } }]]);
  }));
  const requests = [getStatus(), getStatus(), getStatus()];
  finish();
  assert.deepEqual((await Promise.all(requests)).map((result) => result.statusCode), [200, 200, 200]);
  assert.equal(calls, 1);
});

test("distinguishes missing members from unavailable guilds and lookup errors", async () => {
  const missing = createPresenceService(makeClient(async () => { throw Object.assign(new Error("unknown member"), { code: 10007 }); }));
  assert.equal((await missing()).statusCode, 404);
  const client = makeClient(async () => new Map());
  client.guilds.cache.set("unavailable", { available: false });
  assert.equal((await createPresenceService(client)()).statusCode, 503);
});