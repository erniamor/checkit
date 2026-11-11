# Hosting options

Status: recommendation, no decision yet.

## What needs hosting

| Piece | Needs |
| --- | --- |
| `apps/www` (TanStack Start) | SSR runtime (Node or edge), CDN for static assets |
| `apps/api` (Hono) | Long-running Node process (Server-Sent Events for real time), PostgreSQL database, daily backups |
| Email sending | Chosen: Resend, sending domain in its EU region (Ireland), for magic links, sign-in codes and invitations |
| Personal data | Accounts (email, name), lists and their items, list memberships; voice recordings only in transit if server-side transcription is used: data location and backups matter |

Four constraints shape the choice:

- **Data residency:** users are mainly in Europe and GDPR applies: personal data (database, backups, email provider, transcription service) should be stored and processed in the EU. A region close to the users keeps compliance simple.
- **Real time needs a long-running API:** list changes are pushed to members over Server-Sent Events, long-lived HTTP responses held by a process that stays up. Serverless functions (Vercel, Netlify) can host `www`, not `api`, unless real time is delegated to a managed service (Ably, Pusher...), which adds a provider and a cost. The proxy in front of the API must not buffer `text/event-stream` responses, and should serve HTTP/2 (browsers limit HTTP/1.1 to 6 connections per domain, and each open list holds one).
- **One API instance at first:** events go through an in-memory bus, so they only reach the clients connected to the instance that published them. With several instances, replace it with PostgreSQL `LISTEN/NOTIFY` (no new service) or Redis pub/sub; the bus is already behind an interface for that.
- **`www` and `api` must share a parent domain:** the browser calls the API directly with the session cookie, and the front end's server forwards that cookie to the API during rendering. In development both run on `localhost` (cookies ignore the port). In production, serve them on sibling subdomains (e.g. `app.example.com` and `api.example.com`) and enable Better Auth's cross-subdomain cookies (`advanced.crossSubDomainCookies` with the parent domain), so the front end's server receives the cookie too. Two unrelated domains would block this (third-party cookies).

## Options

### 1. Split: `www` on Vercel or Netlify, `api` on a PaaS (Railway, Render, Fly.io, Scalingo, Clever Cloud)

Pros:
- Best-in-class front-end hosting: global CDN, preview deployment per branch, zero ops.
- The PaaS gives a managed PostgreSQL, deploys from Git, handles TLS and keeps long-lived connections (SSE) open.
- Scalingo and Clever Cloud are EU providers with EU-only regions.
- Each piece scales and fails independently.

Cons:
- Two providers, two bills, two dashboards.
- Data residency must be checked per service: front-end functions often run in the US by default, and not every PaaS offers every region.
- `www` and `api` on different domains: session cookies and CORS need care (a shared parent domain, e.g. `app.` and `api.`, keeps cookies simple).
- Usage-based pricing can rise with traffic spikes (functions, bandwidth).

### 2. One VPS in the required region with Coolify or Docker Compose

Pros:
- Everything in one place, in a region of our choice: simplest answer to data residency.
- Lowest, predictable monthly cost; long-lived SSE connections need no special setup beyond disabling response buffering in the proxy.
- Full control over versions, database and backups.

Cons:
- We own the ops: OS updates, security, monitoring, backups, restore tests.
- No automatic scaling; a traffic spike (launch, campaign) must fit on the server.
- Single point of failure unless we add a second server.

### 3. A major cloud provider (AWS, Google Cloud, Azure) in the required region

Pros:
- Managed database and storage, mature backups and scaling, wide choice of regions.
- Room to grow without changing provider.

Cons:
- Complex to set up and to bill; needs cloud expertise.
- Oversized for a small app like this one.

## Recommendation

- **To launch:** option 1 with an EU PaaS for `api` and PostgreSQL (Scalingo or Clever Cloud, or Railway/Render in an EU region), and `www` on Vercel or Netlify with server functions pinned to an EU region. Best balance of low ops and good developer experience.
- **If budget comes first:** option 2, a VPS in the EU with Coolify, on the condition that someone owns updates and backups.

To decide: monthly budget, who handles ops, and expected number of simultaneous users.
