# ADR 0002: Runtime and UI Choices

Status: Accepted

Decision
- Cloud runtime: Node.js 18.15 (Node 20 not supported for functions here).
- Module format: CommonJS for functions output.
- Weapp UI: Vant Weapp; avoid custom UI to reduce complexity.
- Language: English-only development baseline (code/docs/commits). UI copy in English for now; i18n to be added later if needed.

Rationale
- Aligns with CloudBase stability and packaging.
- Vant covers common widgets and is familiar in WeChat ecosystem.
