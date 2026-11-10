# Hosting options

Status: recommendation, no decision yet.

## What needs hosting

| Piece | Needs |
| --- | --- |
| `apps/www` (TanStack Start) | SSR runtime (Node or edge), CDN for static assets |
| `apps/api` (Hono) | Long-running Node process (WebSockets for real time), PostgreSQL database, daily backups |
| Email sending | Transactional email provider for magic links, sign-in codes and invitations |
| Personal data | Accounts (email, name), lists and their items, list memberships; voice recordings only in transit if server-side transcription is used: data location and backups matter |

Three constraints shape the choice:

- **Data residency:** users are mainly in Europe and GDPR applies: personal data (database, backups, email provider, transcription service) should be stored and processed in the EU. A region close to the users keeps compliance simple.
- **Real time needs a long-running API:** list changes are pushed to members over WebSockets, which need a process that stays up and holds open connections. Serverless functions (Vercel, Netlify) can host `www`, not `api`, unless real time is delegated to a managed service (Ably, Pusher...), which adds a provider and a cost.
- **One API instance at first:** with several instances, a message published on one must reach the clients connected to the others (PostgreSQL `LISTEN/NOTIFY` or Redis pub/sub). Not needed to launch, but the real-time layer should keep this door open.

## Options

### 1. Split: `www` on Vercel or Netlify, `api` on a PaaS (Railway, Render, Fly.io, Scalingo, Clever Cloud)

Pros:
- Best-in-class front-end hosting: global CDN, preview deployment per branch, zero ops.
- The PaaS gives a managed PostgreSQL, deploys from Git, handles TLS and supports WebSockets.
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
- Lowest, predictable monthly cost; WebSockets need no special setup.
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
