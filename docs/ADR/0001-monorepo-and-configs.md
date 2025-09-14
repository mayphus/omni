# ADR 0001: Monorepo and Configs

Status: Accepted

Context
- Single repository containing weapp (miniapp), functions, and admin.
- Weapp uses `weapp-vite` which is not plain Vite.

Decision
- Keep a single root `package.json` for orchestration and dev deps.
- Keep a separate `src/functions/shop/package.json` for runtime deps (CloudBase packaging).
- Use two Vite configs: `vite.config.ts` (weapp-vite) and `vite.config.main.ts` (admin + functions).

Consequences
- Simple root-level commands; no workspace complexity.
- Cloud function deploy remains predictable for Node 18 CJS.
- Clear separation avoids config coupling issues between weapp and web/node.
