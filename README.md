# Children’s Dream Planet (Tongmeng Plant)

A WeChat Mini Program solution featuring a customer-facing shop, a cloud-based backend, and an admin management console.

## Overview

This repository is a monorepo containing three main components:
*   **WeApp (`src/weapp`)**: The WeChat Mini Program frontend for customers to browse products, manage carts, and place orders. Built with `weapp-vite`, React, and Vant Weapp.
*   **Functions (`src/functions`)**: CloudBase (TCB) cloud functions acting as the backend API. The main `shop` function handles authentication, order processing, and payment integration.
*   **Admin (`src/admin`)**: A web-based administration console for managing products, orders, and viewing analytics. Built with Vite and React.

## Project Structure

```bash
├── src
│   ├── weapp/           # Mini Program source (React + Vant)
│   ├── functions/       # Cloud functions (Node.js)
│   ├── admin/           # Admin dashboard (React + Vite)
│   ├── shared/          # Shared types and utilities
│   └── types/           # Global type definitions
├── weapp/               # Compiled Mini Program (for DevTools)
├── functions/           # Compiled cloud functions
├── admin/               # Compiled admin app
└── scripts/             # Build and deployment scripts
```

## Prerequisites

*   Node.js 18+
*   pnpm
*   WeChat DevTools (for Mini Program development)
*   CloudBase (TCB) account

## Getting Started

1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Environment Setup**
    *   Copy `.env.example` to `.env.local` and fill in your credentials.
    *   **Note**: Never commit `.env.local` or private keys to version control.

3.  **Development**

    *   **Mini Program**:
        ```bash
        pnpm run dev:weapp
        ```
        Then open the `weapp/` directory in WeChat DevTools. 
        *Tip: Run `pnpm run build:weapp:npm` once to ensure npm dependencies (like Vant) are correctly packed.*

    *   **Admin Console**:
        ```bash
        pnpm run dev:admin
        ```
        Access the admin panel locally at `http://localhost:5173` (or the port shown in your terminal).

4.  **Building**

    *   **Build All**:
        ```bash
        pnpm run build:all
        ```
    *   **Individual builds**: `pnpm run build:weapp`, `pnpm run build:functions`, `pnpm run build:admin`.

## Deployment

Deployment scripts are located in `package.json`:

*   `pnpm run deploy:weapp`: Deploys the Mini Program (requires CI keys configured).
*   `pnpm run deploy:functions`: Deploys cloud functions to CloudBase.
*   `pnpm run deploy:admin`: Deploys the admin console to static hosting.

## Testing

*   **Unit Tests**: `pnpm test` (Vitest)
*   **E2E Tests**: `pnpm run test:e2e` (Miniprogram Automator)
*   **Type Check**: `pnpm run typecheck`
*   **Verify**: `pnpm run verify` (Runs all checks and builds)

## License

MIT
