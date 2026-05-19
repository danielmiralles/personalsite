# personalsite

Daniel Miralles' personal site. Built with Astro, deployed on Coolify.

## Development

```sh
npm install
npm run dev      # astro dev on :4321
npm run build    # static build into dist/
npm run preview  # serve dist/ on :4321
npm test         # playwright e2e against the preview server
```

## Analytics (production)

The site uses self-hosted [Umami](https://umami.is) for privacy-friendly analytics. The tracker is injected only in production builds when both env vars are present.

To enable it in production:

1. In Coolify → personalsite application → **Environment Variables**, set both:
   - `PUBLIC_UMAMI_SRC` (e.g. `https://umami.sinapsys.work/script.js`)
   - `PUBLIC_UMAMI_WEBSITE_ID` (UUID from the Umami dashboard)
2. Mark **both** as **Build Variable**, NOT Runtime. Astro's static build inlines `PUBLIC_*` vars at build time — runtime-only vars will not reach the rendered HTML.
3. Redeploy. Verify via `view-source:https://daniel.sinapsys.work` — the `<script>` with `data-website-id` should appear inside `<head>`.

See `.env.example` for the variable contract. Locally these vars are left unset, so the tracker is silent in dev and preview.
