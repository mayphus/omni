# Types (Ambient only)

Purpose
- Provide ambient `.d.ts` declarations that help TypeScript understand global APIs or runtime environments.
- Example: WeChat Mini Program API typings, test globals, or minor module shims.

Rules
- Do not place domain models or Zod schemas here.
- Runtime‑shared code (types, helpers, schemas) belongs in `src/shared` and is imported normally.

Current
- `weapp-env.d.ts` – references `miniprogram-api-typings` so TS knows `wx.*` APIs in WeApp source.
