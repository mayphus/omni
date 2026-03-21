# Omni / 极物 (Ji Wu) 🌍

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![pnpm](https://img.shields.io/badge/pnpm-strict-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-18-61dafb)

English | [简体中文](./README.zh-CN.md)

A complete e-commerce solution built for the WeChat ecosystem featuring a customer-facing Mini Program, a serverless CloudBase backend, and a modern Admin management console.

---

## 📖 Overview

This repository is structured as a **TypeScript Monorepo**, ensuring high code sharing and type safety across all boundaries. It contains three primary components:

- 📱 **WeApp (`src/weapp`)**: The WeChat Mini Program frontend for customers to browse products, manage their carts, and place orders. Built with `weapp-vite`, React, and Vant Weapp.
- ☁️ **Functions (`src/functions`)**: Tencent CloudBase (TCB) serverless functions acting as the backend API. The main router (`shop` function) securely handles authentication, order processing, and payment integration.
- 💻 **Admin (`src/admin`)**: A web-based dashboard for content management, order tracking, and business analytics. Built with Vite and React.

## 🏗️ Project Structure

```text
omni/
├── src/
│   ├── weapp/           # Mini Program source code (React + Vant)
│   ├── functions/       # Cloud functions (Node.js 18 CJS)
│   ├── admin/           # Admin dashboard (React + Vite)
│   ├── shared/          # Cross-runtime types & Zod schemas
│   └── types/           # Ambient declarative typings (.d.ts)
├── weapp/               # Compiled Mini Program (Load this in WeChat DevTools)
├── functions/           # Compiled cloud functions output
├── admin/               # Compiled admin app output
└── scripts/             # Internal CI/CD Python/JS orchestration scripts
```

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** v18 or newer
- **pnpm** (Required package manager, please do not use `npm` or `yarn`)
- **WeChat DevTools** (For previewing the Mini Program)
- A **CloudBase (TCB)** Account & Environment

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Setup
Create your local environment file:
```bash
cp .env.example .env.local
```
Fill in `.env.local` with your TCB and WeChat credentials.  
> [!WARNING]
> Never commit `.env.local` or private key files (`.private-wx.key`, `.private-tcb.key`) to version control. Keep your keys secure (e.g., in `~/.config/omni/keys`).

### 3. Development Workflows

**Mini Program (Customer App)**
```bash
pnpm dev:weapp
```
Once it builds, open the generated `weapp/` folder in **WeChat DevTools**. 
> [!TIP]
> Ensure "Use npm modules" is checked in DevTools, and run Tools → "Build NPM" if necessary.

**Admin Console (Dashboard)**
```bash
pnpm dev:admin
```
The console will be accessible at `http://localhost:5173`.

## 📦 Build & Deployment

We use customized Vite configurations to build all platform targets efficiently.

| Environment | Build Command | Deploy Command |
| :--- | :--- | :--- |
| **WeApp** | `pnpm build:weapp` | `pnpm deploy:weapp` |
| **Admin** | `pnpm build:admin` | `pnpm deploy:admin` |
| **Functions** | `pnpm build:functions`| `pnpm deploy:functions`|
| **All Apps** | `pnpm build:all` | `pnpm deploy:all` |

> *Note:* `deploy:functions` will force deploy the `shop` router to CloudBase. `deploy:admin` pushes to TCB static hosting.

## 🧪 Testing & Code Quality

Our testing framework is **Vitest**, alongside strict TypeScript checks.

- `pnpm typecheck` – Run TypeScript validation (no-emit mode).
- `pnpm test` – Run all Vitest suites (unit/integration) and build all targets to ensure everything passes before committing.
- `pnpm test:ci` – Lightweight, fast Vitest run (dot reporter).
- `pnpm verify` – Complete CI pipeline (Typecheck → `test:ci` → Build functions → Build weapp → Build admin).

## 📄 License
This project is licensed under the MIT License.
