import { afterEach, expect, it, vi } from "vitest";
import { getHealth } from "./api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each([
  { dev: true, expectedHeader: "probe-session-token" },
  { dev: false, expectedHeader: null },
])("sets the session header for DEV=$dev", async ({ dev, expectedHeader }) => {
  vi.stubEnv("DEV", dev);
  vi.stubEnv("VITE_SSD_SESSION_TOKEN", "probe-session-token");
  const fetchHealth = vi.fn<(path: string, options: RequestInit) => Promise<Response>>().mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetchHealth);

  await getHealth();

  expect(new Headers(fetchHealth.mock.calls[0][1].headers).get("X-SSD-Session")).toBe(expectedHeader);
});
