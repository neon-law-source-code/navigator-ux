# Gateway integration

Copyright (C) 2026 Shook Law PLLC. SPDX-License-Identifier: BUSL-1.1

`SessionProvider` does no authentication of its own — it reads an already-verified session from an
endpoint and renders. This document records the server-side contract behind that endpoint as Neon Law
deploys it: a Pingora sidecar in front of each app that validates the session JWT and only then
proxies the request.

It is here because the component's behavior is only defensible if you can see what it is trusting. If
you are integrating this library against your own auth, the only part you have to reproduce is
the `/__session` response shape in [What the apps assume](#what-the-apps-assume) — everything else
below is one implementation of it, not a requirement.

## What exists today

`Navigator/gateway` is a working Pingora `ProxyHttp` service, but it implements a different policy
than the one Neon Law needs:

| Concern | Today (`gateway/src/lib.rs`) | Needed for Neon Law |
| --- | --- | --- |
| Credential | Shared HTTP Basic pair, SHA-256 compared | Navigator `navigator_session` JWT |
| Expiry | None — the credential is static | `exp` claim, 8-hour default TTL |
| Upstreams | One, from `GATEWAY_UPSTREAM` | One per client app, chosen by host or path |
| Identity to app | Nothing forwarded | Verified `sub` / `role` / `exp` |

The decision core is already the right seam: `decide()` is a pure function over
`(config, path, peer, forwarded_for, authorization)` returning `Proxy | Unauthorized | Forbidden`,
and it is unit-tested independently of Pingora. Extending it does not require touching `proxy.rs`
beyond passing the cookie through.

## What the apps assume

**1. The gateway verifies the token. The browser never does.**
The signing key stays server-side. A React app that validated its own JWT would be trusting a value
the reader controls.

**2. The gateway serves `GET /__session` on the app's own origin.**
It returns the already-verified claims as JSON:

```json
{ "sub": "attorney@example.com", "role": "admin", "exp": 1785563421 }
```

Status codes carry meaning that `fetchSession()` relies on:

- `200` with the payload above — authenticated.
- `401` or `403` — signed out. The app renders its signed-out state or redirects.
- anything else — a gateway fault. The app surfaces an error rather than treating an
  authenticated reader as logged out, so a transient 500 does not bounce people to login.

The claim names mirror `portal::session::SessionData`, so the gateway can serialize that struct
directly.

**3. The gateway exposes `/__login`, preserving `return_to`.**
`redirectToLogin()` sends the reader to `/__login?return_to=<path>`. Navigator's
`portal::policy::percent_encode_path` already builds the same shape for its own routes.

**4. Session lifetime is Navigator's, unchanged.**
`DEFAULT_SESSION_TTL_SECS` is 8 hours (`portal/src/session.rs`). `SessionProvider` counts that down
and warns at five minutes remaining, because a matter page is routinely left open across the lapse.

## Changes required in `Navigator/gateway`

1. **Accept the session cookie.** `decide()` currently reads only the `authorization` header. It
   needs the `Cookie` header too, and should extract `navigator_session` — the constant is
   `portal::session::SESSION_COOKIE_NAME`. Bearer tokens should keep working for API clients.

2. **Verify instead of compare.** Replace `credential_matches()` with a call into the existing
   verifier rather than a second implementation. `portal::auth::Verifier` already handles both
   paths: HS256 via `SessionStore`, and RS256 against a JWKS endpoint with optional audience and
   issuer pinning. Reusing it keeps one verification code path in the workspace.

3. **Fail closed on expiry.** `AuthClaims.exp` is validated by `jsonwebtoken` when `Validation` has
   `validate_exp` set. Confirm that is on; an expired token must produce `Unauthorized`, not
   `Proxy`.

4. **Route to per-client upstreams.** `GATEWAY_UPSTREAM` is a single `SocketAddr`. Neon Law needs a
   map — `northwind.example.com` or `/northwind/*` to the Northwind app — resolved in `upstream_peer()`.

5. **Forward identity upstream.** `upstream_request_filter()` already injects `X-Forwarded-For` and
   `X-Real-IP`. Add the verified subject and role so the app and any backend can attribute actions
   without re-parsing the token. Strip these headers from the *inbound* request first, or a client
   can forge them.

6. **Authorise, not just authenticate.** A valid Navigator token proves who someone is, not that
   they may read a given matter. Matter-level access has to be checked against `sub`/`role` before
   proxying, or every authenticated Navigator user reaches every client surface. This is the one
   item with no equivalent in the current gateway, and it is the one that matters most — the static
   site enforced it through 108 per-path rules in `netlify.toml`, and none of that carries over.

## Open question

Item 6 needs a decision on where matter access lives: a claim inside the JWT, a lookup the gateway
performs against Navigator, or a static per-app allowlist. The apps work with any of the three; the
gateway must pick one before a client surface is exposed.
