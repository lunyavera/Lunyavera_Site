const USER_ID = "229242467965206528";
const CACHE_TTL = 5 * 60 * 1000;

export function createPresenceService(client, { now = Date.now } = {}) {
  let cachedResult;
  let expiresAt = 0;
  let pendingLookup;

  async function lookupStatus() {
    let lookupFailed = false;

    for (const guild of client.guilds.cache.values()) {
      if (!guild.available) {
        lookupFailed = true;
        continue;
      }

      try {
        const members = await guild.members.fetch({ user: [USER_ID], withPresences: true, time: 5000 });
        const member = members.get(USER_ID);
        if (!member) continue;

        const status = member.presence?.status ?? "offline";
        return { statusCode: 200, body: { userId: USER_ID, status, online: status !== "offline" } };
      } catch (error) {
        if (error?.code !== 10007) lookupFailed = true;
      }
    }

    return {
      statusCode: lookupFailed ? 503 : 404,
      body: { userId: USER_ID, status: "unknown", online: null },
    };
  }

  return async function getStatus() {
    if (!client.isReady()) {
      return { statusCode: 503, body: { userId: USER_ID, status: "unknown", online: null } };
    }

    if (cachedResult && now() < expiresAt) return cachedResult;

    if (!pendingLookup) {
      pendingLookup = lookupStatus().then((result) => {
        if (result.statusCode !== 503) {
          cachedResult = result;
          expiresAt = now() + CACHE_TTL;
        }
        return result;
      }).finally(() => {
        pendingLookup = undefined;
      });
    }

    return pendingLookup;
  };
}