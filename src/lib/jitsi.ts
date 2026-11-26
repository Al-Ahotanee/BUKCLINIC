import { createSign } from "crypto";

export interface JitsiConfig {
  provider: "jaas" | "public";
  domain: string;
  scriptSrc: string;
  roomName: string; // what the IFrame API receives
  jwt: string | null;
}

const b64u = (v: Buffer | string) => Buffer.from(v).toString("base64url");

/**
 * Builds the connection details for a room.
 *
 * With JaaS (8x8 free tier) configured, every user gets a signed token and the doctor is the moderator, so the
 * room opens immediately for everyone. Without it, we fall back to the public Jitsi server, where the first
 * person must sign in once as moderator (a restriction Jitsi applies to embedded rooms).
 */
export function buildJitsiConfig(room: string, user: { id: number; name: string; moderator: boolean }): JitsiConfig {
  const appId = process.env.JAAS_APP_ID;
  const kid = process.env.JAAS_KID;
  const key = process.env.JAAS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (appId && kid && key) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT", kid };
    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room,
      iat: now,
      nbf: now - 10,
      exp: now + 3 * 60 * 60,
      context: {
        user: { id: String(user.id), name: user.name, moderator: user.moderator ? "true" : "false" },
        features: { livestreaming: "false", "outbound-call": "false", transcription: "false", recording: "false" },
      },
    };
    const data = `${b64u(JSON.stringify(header))}.${b64u(JSON.stringify(payload))}`;
    const sig = createSign("RSA-SHA256").update(data).sign(key);
    return {
      provider: "jaas",
      domain: "8x8.vc",
      scriptSrc: `https://8x8.vc/${appId}/external_api.js`,
      roomName: `${appId}/${room}`,
      jwt: `${data}.${b64u(sig)}`,
    };
  }

  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
  return { provider: "public", domain, scriptSrc: `https://${domain}/external_api.js`, roomName: room, jwt: null };
}
