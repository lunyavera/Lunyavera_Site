import { once } from "node:events";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { createPresenceService } from "./discord-presence.mjs";

type DiscordConnection = {
  client: Client;
  getStatus: ReturnType<typeof createPresenceService>;
  login: Promise<boolean>;
};

const discordGlobal = globalThis as typeof globalThis & { discordConnection?: DiscordConnection };

export async function getDiscordPresence() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) return { statusCode: 503, body: { status: "unknown" } };

  if (!discordGlobal.discordConnection) {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences],
    });
    client.on("error", () => console.error("Discord client encountered an error."));

    const login = client.login(token).then(async () => {
      if (!client.isReady()) await once(client, Events.ClientReady, { signal: AbortSignal.timeout(10_000) });
      return true;
    }).catch(() => {
      client.destroy();
      if (discordGlobal.discordConnection?.client === client) delete discordGlobal.discordConnection;
      console.error("Discord bot could not connect. Check its token and gateway intents.");
      return false;
    });

    discordGlobal.discordConnection = { client, getStatus: createPresenceService(client), login };
  }

  const connection = discordGlobal.discordConnection;
  if (!await connection.login) return { statusCode: 503, body: { status: "unknown" } };
  return connection.getStatus();
}