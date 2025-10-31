# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f62859b6-326f-4818-a9db-90825929ae51

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f62859b6-326f-4818-a9db-90825929ae51) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
yarn install

# Step 4: Start the development server with auto-reloading and an instant preview.
yarn dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f62859b6-326f-4818-a9db-90825929ae51) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

# Deployment (Vercel)

## Monorepo Structure
This repository contains multiple packages:
- `frontend` (Vite React app to deploy)
- `chain-sdk` (local TypeScript library consumed by frontend)
- `backend` (smart contracts & Truffle; not deployed to Vercel)

## Build Flow on Vercel
The frontend has a `prebuild` script that:
1. Installs dependencies for `chain-sdk` via Yarn
2. Builds `chain-sdk` (emits `dist/` with JS, types, and ABIs)
Then Vite builds the frontend into `frontend/dist` using `yarn build`.

## vercel.json
A `vercel.json` file at repo root configures a static build using `frontend/package.json`.
If you prefer configuring in the Vercel dashboard, you can omit `vercel.json` and set:
- Root Directory: `frontend`
- Install Command: `yarn install`
- Build Command: `yarn build`
- Output Directory: `dist`

## Required Environment Variables
Set these in Vercel Project Settings -> Environment Variables (do not rely on the sample values in vercel.json):
- `VITE_RPC_URL` – Your public RPC endpoint (e.g. Alchemy / Infura / local gateway)
- `VITE_CITIZENSHIP_ADDRESS`
- `VITE_ELECTION_ADDRESS`
- `VITE_BADGE_ADDRESS`
- `VITE_MONEY_ADDRESS`

Optionally you can omit addresses if `chain-sdk/contract_addresses.json` is kept in sync; the app falls back to that file.

## Steps to Deploy
1. Push these changes to your repository.
2. In Vercel, create a new project from the repo.
3. Ensure Node version is >= 18 (Project Settings -> General -> Node.js Version).
4. Confirm `Install Command` is `yarn install` and `Build Command` is `yarn build`.
5. Add environment variables listed above for Production (and Preview if needed).
6. Deploy. Vercel runs `prebuild` (building `chain-sdk`) then `build` (Vite build) via Yarn.

## Post-Deployment Verification
After deployment, open the site and confirm:
- No console errors regarding missing ABIs or addresses.
- Network requests to RPC succeed (CORS or rate limits can cause errors).
- Contract addresses resolve (check logs for warnings).

## Common Issues
| Issue | Cause | Fix |
|-------|-------|-----|
| `MODULE_NOT_FOUND chain-sdk/dist` | `chain-sdk` not built before Vite | Ensure `prebuild` script present (already added) |
| `yarn: command not found` | Previous `chain-sdk` prepare used yarn | We replaced with `npm run build` |
| Empty contract addresses | Missing env vars & outdated `contract_addresses.json` | Provide env vars or run backend deployment scripts & sync ABIs |
| RPC 429/403 errors | Rate limit or key invalid | Use dedicated RPC provider key |

## Manual Trigger of ABI Sync (Optional)
If you redeploy new contracts:
```sh
# From repo root
yarn --cwd chain-sdk sync:abi
```
Then commit updated `chain-sdk/abi` & `contract_addresses.json`.

## Local Production Build Test
```sh
cd frontend
yarn install
yarn build
npx serve dist  # or any static file server
```
Visit http://localhost:3000 and verify functionality before pushing.

---
