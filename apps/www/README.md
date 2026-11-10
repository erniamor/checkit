# www

Checkit's front end: the web app where users sign in, manage their lists, share them and add items by voice. Built with React and TanStack Start, styled with Tailwind CSS and the components of [`@repo/ui`](../../packages/ui).

**Not started yet.** Only its working rules exist, in [`CLAUDE.md`](CLAUDE.md).

Once it exists, it will:

- call the API (`apps/api`) through [`@repo/resources`](../../packages/resources), with the session cookie;
- validate its forms with the schemas of [`@repo/schemas`](../../packages/schemas) and translate their error codes;
- be available in English (default), French and Spanish;
- run on `http://localhost:3000`, the origin allowed by the API's `CORS_ORIGINS` in development.
