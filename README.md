# Intelligent Calculator Web (separate repository)

A responsive dark-mode Next.js App Router / TypeScript interface with basic and scientific calculators, rule-based natural language assistant, session history, API readiness and version display.

## Start

- Node.js 22+
- `npm install` (commit the generated `package-lock.json`, then change Jenkins to `npm ci` for reproducibility)
- Copy `.env.example` to `.env.local`
- Start the FastAPI backend independently on `http://localhost:8000`
- `npm run dev` and browse http://localhost:3000

Tests: `npm test`; types `npm run typecheck`; lint `npm run lint`; production build `npm run build`.

## Architecture

The browser talks to a Next.js same-origin route handler `/api/proxy/*`. The route handler talks to the backend configured by `API_INTERNAL_URL`. The frontend has no AI secret. History is scoped using a server-issued cookie for classroom purposes; this is **not strong authentication**.

Jenkins multi-branch configuration requires Node.js, npm, Docker, Trivy, kubectl and the `ghcr-push` / `calculator-kubeconfig` credentials. Set `STAGING_WEB_URL` in Jenkins. Replace `REPLACE_ORG` with your registry namespace before enabling deployment. API service must be reachable via `http://calculator-api:8000` in Kubernetes.

See the sibling backend ZIP for API and FastMCP server. Each directory can be moved into its own Git repository.
