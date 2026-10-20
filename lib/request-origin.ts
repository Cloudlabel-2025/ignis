import "server-only";

// Next may normalize request.url to localhost even when the browser uses 127.0.0.1.
// A reverse-proxy deployment can declare its public origin explicitly.
export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const incoming = new URL(`${url.protocol}//${request.headers.get("host") || url.host}`);
  if (process.env.JAGUAR_APP_ORIGIN) {
    const configured = new URL(process.env.JAGUAR_APP_ORIGIN);
    const loopback = (host: string) => ["localhost", "127.0.0.1", "[::1]"].includes(host);
    // Local browsers may use either loopback name. Still compare Origin with
    // the actual request host, and retain the configured port and protocol.
    if (process.env.NODE_ENV === "development" && loopback(configured.hostname) && loopback(incoming.hostname)
      && incoming.protocol === configured.protocol && incoming.port === configured.port) return incoming.origin;
    return configured.origin;
  }
  return incoming.origin;
}
