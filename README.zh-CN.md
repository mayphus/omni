# Children’s Dream Planet (Tongmeng Plant) 🌍

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![pnpm](https://img.shields.io/badge/pnpm-strict-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-18-61dafb)

[English](./README.md) | 简体中文

基于微信生态的完整电商解决方案，包含面向客户的微信小程序、基于云开发的 Serverless 后端，以及现代化的管理控制台。

---

## 📖 简介

本项目是一个 **TypeScript Monorepo (单体仓库)**，确保在各个模块之间实现高度的代码共享和类型安全。它主要包含三个部分：

- 📱 **小程序 (`src/weapp`)**：面向客户的微信小程序前端，用于浏览商品、管理购物车和下单。基于 `weapp-vite`、React 和 Vant Weapp 构建。
- ☁️ **云函数 (`src/functions`)**：腾讯云开发 (TCB) Serverless 函数，作为后端 API。主路由（`shop` 函数）部分安全地处理身份验证、订单处理和支付集成。
- 💻 **管理后台 (`src/admin`)**：基于 Web 的仪表盘，用于内容管理、订单跟踪和业务分析。基于 Vite 和 React 构建。

## 🏗️ 项目结构

```text
tongmeng-plant/
├── src/
│   ├── weapp/           # 小程序源码 (React + Vant)
│   ├── functions/       # 云函数 (Node.js 18 CJS)
│   ├── admin/           # 管理后台 (React + Vite)
│   ├── shared/          # 跨端共享类型 & Zod schemas
│   └── types/           # 全局类型声明文件 (.d.ts)
├── weapp/               # 编译后的小程序产物 (在微信开发者工具中按此目录导入)
├── functions/           # 编译后的云函数产物
├── admin/               # 编译后的管理后台产物
└── scripts/             # 内部 CI/CD 编排脚本
```

## 🚀 环境依赖

在开始之前，请确保已安装以下环境：
- **Node.js** v18 或更高版本
- **pnpm** (必须使用的包管理器，请勿使用 `npm` 或 `yarn`)
- **微信开发者工具** (用于预览和调试小程序)
- **腾讯云开发 (TCB)** 账号与环境

## 🛠️ 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 环境配置
创建本地环境变量文件：
```bash
cp .env.example .env.local
```
在 `.env.local` 中填入你的 TCB 和微信相关凭证。
> [!WARNING]
> 切勿将 `.env.local` 或私钥文件（`.private-wx.key`, `.private-tcb.key`）提交到版本控制系统中。请妥善保管你的密钥（例如存放在 `~/.config/tongmeng-plant/keys`）。

### 3. 本地开发

**小程序 (客户端)**
```bash
pnpm dev:weapp
```
编译完成后，在 **微信开发者工具** 中打开生成的 `weapp/` 目录。
> [!TIP]
> 请确保在微信开发者工具中勾选“使用 npm 模块”，并在必要时点击“工具 → 构建 npm”。

**管理后台 (仪表盘)**
```bash
pnpm dev:admin
```
启动后，可在 `http://localhost:5173` 访问管理控制台。

## 📦 构建与部署

我们使用定制的 Vite 配置来高效地构建所有平台目标。

| 环境 | 构建命令 | 部署命令 |
| :--- | :--- | :--- |
| **小程序 (WeApp)** | `pnpm build:weapp` | `pnpm deploy:weapp` |
| **管理后台 (Admin)** | `pnpm build:admin` | `pnpm deploy:admin` |
| **云函数 (Functions)** | `pnpm build:functions`| `pnpm deploy:functions`|
| **所有应用** | `pnpm build:all` | `pnpm deploy:all` |

> *注：* `deploy:functions` 会将 `shop` 路由强制部署到云开发 (TCB)。`deploy:admin` 会将静态资源发布到云开发的静态网站托管。

## 🧪 测试与代码质量

我们的测试框架是 **Vitest**，并结合了严格的 TypeScript 类型检查。

- `pnpm typecheck` – 运行 TypeScript 类型验证（不生成编译文件）。
- `pnpm test` – 运行所有 Vitest 测试用例（单元/集成）并在提交前构建所有目标环境以确保通过。
- `pnpm test:ci` – 轻量级、快速的 Vitest 运行模式（dot reporter）。
- `pnpm verify` – 完整的 CI 验证流水线（类型检查 → `test:ci` → 构建云函数 → 构建小程序 → 构建管理后台）。

## 📄 开源协议
本项目采用 MIT 协议开源。
