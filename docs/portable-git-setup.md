# Portable Git Setup

Use this when you want to run Tool Reel Factory on another laptop.

## What Goes In Git

Git should contain:

- source code in `src/`
- dashboard UI in `ui/`
- config in `config/`
- sample input in `inputs/`
- docs in `README.md` and `docs/`
- `package.json` and `package-lock.json`

Git should not contain:

- Google login profiles in `work/`
- downloaded browser files in `chrome/`
- generated videos, screenshots, recordings, and workbooks in `outputs/`
- local rendered assets in `public/tool-reel-assets/`
- secrets in `.env`
- `node_modules/`

## First Laptop

Create the git repo and commit:

```bash
git init
git add .
git commit -m "Initial Tool Reel Factory automation"
```

Then create an empty GitHub/GitLab repo and connect it:

```bash
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

## Other Laptop Setup

Clone the repo:

```bash
git clone YOUR_REPO_URL
cd YOUR_REPO_FOLDER
```

Install Node dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env
```

Optional: install Playwright browser if capture does not work with local Chrome:

```bash
npm run browser:install
```

Start dashboard:

```bash
npm run ui -- --port 4317
```

Open:

```text
http://127.0.0.1:4317
```

## Excel File

Your current Excel file is outside the repo:

```text
/Users/palsahu/workplace/projects/n learn/Book1.xlsx
```

On another laptop, either:

- keep the Excel file anywhere and select that path in the dashboard
- or copy it into `inputs/` and use that path

The source Excel is not committed automatically because it may contain private tool planning data.

## Google Vids Profiles

Google Vids login profiles are not copied through git. On every new laptop:

1. Open the dashboard.
2. Go to Profiles & Limits.
3. Click Add + Login.
4. Log in with the Google account you want to use.
5. Return to the dashboard and click Refresh.

This keeps account cookies and quota state local to that laptop.

## Common Commands

Free local MP4, no Google Vids quota:

```bash
npm run agent:one-video -- --input "/path/to/Book1.xlsx" --row 2 --limit 1 --local-only
```

Script and assets only:

```bash
npm run agent:one-video -- --input "/path/to/Book1.xlsx" --row 2 --limit 1 --prep-only
```

Google Vids hybrid attempt:

```bash
npm run agent:one-video -- --input "/path/to/Book1.xlsx" --row 2 --limit 1 --generate --max-scenes 7 --vids-profiles work/google-vids-profile
```

If Google Vids quota is finished, run Local MP4 mode from the dashboard.
