# Tool Reel Factory

Local automation for turning tool data into Instagram Reel assets.

Input:

- Excel or CSV with tool name, link, topic, description, and optional script

Output per tool:

- `asset-brief.md` with captured screenshot/recording notes
- `reel-script.md` and `reel-script.json` with compact Hook-Body-CTA script
- `scene-plan.json` with 3-6 scenes of 10 seconds each; default is 6 scenes / 60 seconds
- `google-vids-prompts.csv` for Google Vids
- `free-video-providers/` prompt folders for CapCut, Pika, Runway, Canva, D-ID, and Shotstack
- `post-copy.md` with caption and hashtags
- `generated/` archive folder with final MP4s, reports, props, export logs, and render assets
- `vids-clips/` cache folder for reusable Google Vids/avatar scene clips and optional timeline exports
- `vids-generated-scenes/` scene folders for Google Vids prompts and generated clip organization
- screenshots, fictional demo input files, a desktop demo recording, and a short mobile scroll recording when capture is enabled

## Setup

```bash
npm install
cp .env.example .env
```

Optional: add `OPENAI_API_KEY` in `.env` for AI script rewriting. Without it, the runner uses a simple local fallback.

For moving this project to another laptop through git, see `docs/portable-git-setup.md`.

## Windows Laptop Setup

On a fresh Windows laptop, clone/copy the project, open PowerShell in the project folder, then run:

```powershell
.\setup-windows.bat
```

With your Excel file path:

```powershell
.\setup-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

The script installs/checks Node.js 20+, dependencies, Git, Chrome, Playwright Chromium, FFmpeg when available, creates `.env`, and starts the dashboard. Full guide: `docs/windows-setup.md`.

For a simple Windows-first checklist, read `WINDOWS-RUN-GUIDE.md`.

## Run Sample

```bash
npm run sample
```

With website screenshots:

```bash
npm run sample:capture
```

## Run Your Excel File

Put the file in `inputs/`, then run:

```bash
npm run batch -- --input inputs/your-tools.xlsx --capture
```

## Free Mode

Use this when you do not want to spend OpenAI API credits.

```bash
npm run free -- --input inputs/your-tools.xlsx
```

With website screenshots and a short scroll recording:

```bash
npm run free:capture -- --input inputs/your-tools.xlsx
```

Free mode uses the local script/scene generator. It still creates:

- `scene-plan.json`
- `google-vids-prompts.csv`
- `post-copy.md`
- screenshots and WebM recording when capture is enabled

For better creative quality later, add `OPENAI_API_KEY` to `.env` and use `npm run batch`.

Expected columns. Names are flexible, but these are best:

```text
Idea Name
Short Description
ROUTES
View Script
target_user
main_benefit
language
```

For your current `Book1.xlsx`, the automation maps:

```text
Idea Name -> tool_name
Short Description -> description
ROUTES -> tool_url
View Script -> script
```

`ROUTES` can be relative, for example `/tools/all/universal-pii-ai-redactor`. The configured base URL is:

```text
https://www.altftool.com/
```

## Prepare Enriched Workbook

This creates a new workbook with extra Tool Reel Factory columns. It does not overwrite your source Excel file.

```bash
npm run prep:free:capture -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --limit 1
```

The prepared workbook includes columns for local asset files, asset brief, reel script files, Google Vids status, Drive upload status, Google Vids link, final MP4 path, final video link, final video folder link, run folder link, generated scene folders, and QA status.

## Google Drive Sync

Use Google Drive Desktop for the free Drive workflow. Paste your synced Drive folder in the dashboard `Drive sync folder` field, or pass it from the command line:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --drive-sync-dir "/Users/palsahu/Library/CloudStorage/GoogleDrive-YOUR_ACCOUNT/My Drive/Tool-Reel-Factory"
```

When a final MP4 is created, the agent copies the tool folder and `final-video.mp4` into that Drive sync folder. The prepared workbook row is updated with:

```text
TRF Drive Upload Status
TRF Drive Video Path
TRF Drive Video Link
TRF Drive Folder Path
TRF Drive Folder Link
TRF Final Video Link
```

These are local synced Drive links. Google Drive Desktop uploads them to Drive in the background. Public web share links still need Google Drive sharing/API setup.

By default the agent writes an enriched workbook copy in the run folder. To update the original source Excel file after each run, enable `Update source Excel after run` in the dashboard or pass:

```bash
--update-source-workbook
```

The agent creates a backup first under `outputs/runs/.../source-workbook-backups/`.

## One-Video Agent

Use this for one complete tool reel from your Excel file. It selects one row, captures the actual tool page first, creates a short 30-60 second Hook-Body-CTA Reel plan, writes the prepared workbook, and opens/fills Google Vids when requested.

Google Vids scene clips, then local merge:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6
```

This does not use Google Vids as the final merger. It creates and exports `scene-01`, `scene-02`, etc. separately, saves them under `vids-generated-scenes/scene-XX/`, caches them under `vids-clips/scene-XX.mp4`, then renders the final MP4 locally.

## Frontend Dashboard

Start the local dashboard:

```bash
npm run ui
```

Open:

```text
http://127.0.0.1:4317
```

The dashboard lets you pick the Excel row, mode, primary/fallback Google Vids profile, AI Video avatar selection, and run the one-video agent from a button. It uses a compact control sidebar, quick status cards, one-page tabs, a scrollable black terminal panel, and a final MP4 preview when a local file is produced.

Dashboard production controls:

- `Script + Assets`: prepares script, scene JSON, Vids prompts, screenshots, recordings, and workbook links without rendering or using Google Vids quota.
- `Free Clip Pack`: prepares CapCut, Pika, Runway, Canva, D-ID, and Shotstack scene prompt folders without rendering or using Google Vids quota.
- `Local MP4`: fully free local Reel render with captions, voiceover, music, real tool screenshots, and demo recordings.
- `Vids clip cache`: every tool folder has `vids-clips/`; local MP4 uses cached Google Vids/avatar clips first when they exist.
- `Vids Clips`: Google Vids generates each selected scene as a separate clip, downloads it into `vids-generated-scenes/scene-XX/`, caches it as `vids-clips/scene-XX.mp4`, then local rendering merges the final Reel.
- `All Vids Clips`: same scene-by-scene download flow for every scene; use only when quota is available.
- `Run Queue`: runs multiple Excel rows one by one. Use `Video limit` or `Specific rows` like `2,3,5-7`. The dashboard creates a live `queue-progress.xlsx` file and updates it after each row with status, run folder, generated folder, cache folder, Google Vids URL, final MP4 path, and errors.
- `Quota planner`: manual tracker for AI video/avatar monthly limits and used counts. It estimates requests before a queue starts, marks profiles as `LIMIT USED` when Vids reports a quota/limit error, and lets you manually mark or clear that state.
- `History`: keeps recent runs in `work/ui-state.json` so you can preview, open folders, view logs, and retry rows after refresh.
- `Profile list`: shows all saved Google Vids browser profiles, including detected Google account name/email when Chrome profile metadata contains it.
- `Profiles & Limits`: separate tab for every Google Vids profile with detected identity, login state, primary/fallback badges, AI/video quota bars, avatar quota bars, profile folder, and quick actions.
- `Add Profile`: creates another isolated profile such as `work/google-vids-profile-3` and selects it without opening Google Vids.
- `Add + Login`: creates another isolated profile and immediately opens Google Vids login for that account.
- `Docs`: reads setup docs directly inside the dashboard with a selected-doc mode, an `All docs one page` mode, searchable text, match count, highlighted matches, and a section list.
- `Open Vids Cache`: opens the selected tool's `vids-clips/` folder after a run, so reusable Google Vids/avatar clips can be saved or checked quickly.
- `Open Generated`: opens the selected tool's `generated/` archive after a run, so final videos, reports, and export logs are together.

Multiple Google profiles are supported. Each profile is a separate local Chrome/Playwright browser profile under `work/`. Use only accounts you control and follow Google Vids quotas/terms. After logging into a new account, click `Refresh` in Google Vids config so the detected email/name appears in the profile dropdown. If a profile shows `LIMIT USED`, select another profile or run `Local MP4` mode until that account has quota again.

In Google Vids mode, keep `Use tool screenshots` on for professional tool promo videos. The default `Screenshot scenes` value is `3,4,5`, so the actual tool UI is attempted as reference for demo, workflow, output, and before/after proof instead of unrelated synthetic footage. If the current Google Vids UI opens only Drive/Photos and does not expose a local file chooser, the operator falls back to a safer URL-based prompt and logs the reason in `ingredientUploads`.

Choose the reel length with `--scene-count 3`, `--scene-count 4`, `--scene-count 5`, or `--scene-count 6`. Each scene is 10 seconds, so the final script stays between 30 and 60 seconds. The dashboard `Scenes` control sends this value automatically.

Fully free local video output, no Google Vids quota used:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only
```

`--row 2` means Excel row 2 only. Change it to `--row 3`, `--row 4`, etc. for another single tool. `agent:one-video` always creates one video; `--limit 1` is included to make that explicit.

Script/assets only, no render and no Google Vids quota:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --prep-only
```

Dry-run, no video-generation quota used:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --max-scenes 2
```

Full Google Vids attempt when your Vids quota is available:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6
```

Google Vids mode selects an AI/avatar presenter by default on intro/outro scenes. The default avatar scenes are `1,2,6`, while tool proof scenes `3,4,5` stay in AI Video mode with real screenshots. Add `--no-avatar` to skip this, or set avatar selection to specific scenes:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6 --avatar-scenes 1,2,6
```

The dashboard avatar dropdown is loaded from `config/default.json` under `googleVids.avatarOptions`. The default is `auto`, which picks a realistic Google Vids avatar that is available in the current account. Choose `Personal Avatar - Me` only when that account has your personal avatar set up.

If Google Vids hits its free generation limit or export fails, the agent now falls back to a free local Remotion render and saves the MP4 path in the prepared workbook. The local fallback includes visual captions, captured tool screenshots, a creator/avatar badge, generated scene voiceover, and a subtle music bed. Disable local fallback only when you specifically want Vids-only behavior:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --generate --scene-count 6 --max-scenes 6 --no-local-fallback
```

Note: if the dashboard says `Local fallback video ready`, that MP4 is not Google Vids generated footage. It is the free local screenshot/voiceover render created because Google Vids failed before final export.

### Google Vids Clip Cache

Every prepared tool folder now includes:

```text
vids-clips/
```

It also includes:

```text
vids-generated-scenes/
```

It also includes:

```text
free-video-providers/
```

`vids-generated-scenes/scene-01/`, `scene-02/`, etc. keep each scene prompt and notes together. Save scene-level Google Vids exports there for audit, and copy reusable MP4s to `vids-clips/scene-01.mp4` when you want the local final editor to use them.

`free-video-providers/` keeps provider-specific prompt folders for CapCut, Pika, Runway, Canva, D-ID, and Shotstack. After downloading a provider clip, save/copy it to `vids-clips/scene-XX.mp4`; Local MP4 mode uses cached clips first.

Put reusable Google Vids/avatar footage here, or let the agent cache exported files when Google Vids export succeeds. Supported names:

```text
scene-01.mp4
scene-1.webm
avatar-scene-01.mp4
google-vids-scene-01.mp4
full-google-vids-export.mp4
partial-google-vids-export-scenes-01-03.mp4
```

When local MP4 rendering runs, it checks in this order:

```text
scene-specific cached Vids clip
full/partial cached Google Vids export
normal tool recording/screenshot assets
```

This means if a profile quota finishes later, previously generated avatar/Vids footage can still be reused in the free local render. By default, Google Vids mode now creates one Vids file per scene and downloads each scene MP4 into its own folder before local merge. The old full-timeline export path is still available with `--vids-timeline-export`. If visual QA finds hallucinated or fake UI in a Vids export, mark that cache entry with `renderEligible: false` or `qualityStatus: rejected_fake_ui`; local rendering will keep the file saved but skip it.

### Generated Output Archive

Every prepared tool folder also includes:

```text
generated/
```

The agent mirrors generated files here, including:

```text
generated/agent/prepared-tool-reel-workbook.xlsx
generated/agent/one-video-agent-report.json
generated/local-render/final-video.mp4
generated/local-render/local-reel-report.json
generated/local-render/remotion-props.json
generated/local-render/assets/
generated/google-vids/profile-name/
generated/google-vids-export/profile-name/
generated/generated-manifest.json
```

The prepared workbook includes `TRF Generated Folder` and `TRF Generated Files`, so you can open one tool row and find the saved outputs quickly.

Use multiple logged-in Google Vids profiles. The agent tries the first profile, then the next one if generation/export fails. This is for legitimate accounts you control; respect Google Vids quotas and terms.

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6 --vids-profiles work/google-vids-profile,work/google-vids-profile-2
```

Open the second email first by putting profile 2 first:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6 --vids-profiles work/google-vids-profile-2,work/google-vids-profile
```

Use only the second email:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6 --vids-profiles work/google-vids-profile-2
```

By default, fallback profiles start a new Vids file. If you have shared the same Vids file with the second account and want fallback profiles to reuse the same URL, add `--reuse-url-on-fallback`.

Render a full local 30-60 second vertical Reel from an already prepared tool folder:

```bash
npm run render:local -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --filename final-tool-reel.mp4
```

The local MP4 is a free Reel with captions, captured tool screenshots, recorded tool usage where available, generated scene voiceover, subtle music, and a creator/avatar badge. Add `--no-audio` to `render:local` only if you want a silent visual draft.

## Google Vids

Google Vids video generation does not currently have a clear public API for fully creating videos from prompts. This project prepares the prompts and keeps a persistent browser profile so you can log in once with your second email.

```bash
npm run vids:login
```

Login a second Google account into a separate local browser profile:

```bash
npm run vids:login -- --profile work/google-vids-profile-2
```

Verify the browser state after login:

```bash
npm run vids:check
```

Verify the second profile:

```bash
npm run vids:check -- --profile work/google-vids-profile-2
```

This saves a screenshot and page-state report under `outputs/runs/google-vids-check-*`.

Create/fill a Google Vids scene from a prepared tool folder:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --scene 1
```

Create/fill a Google Vids scene and select an AI Video avatar without spending generation quota:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --scene 1 --avatar auto
```

This opens Google Vids, selects portrait mode, opens AI video, and fills the scene prompt. It does not generate video unless you add `--submit`.

Generate and insert one scene:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --scene 1 --submit --insert --after-submit-wait 120000
```

Append a new scene to an existing Vids file:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --scene 2 --url "https://docs.google.com/videos/d/YOUR_FILE_ID/edit" --new-scene-first --skip-portrait --submit --insert --after-submit-wait 120000
```

Dry-run the first two scenes without spending generation quota:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --all-scenes --max-scenes 2
```

For the real tool-demo scene, attempt to attach captured screenshots as Ingredients:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --scene 3 --ingredients auto --ingredients-scenes 3
```

Attach screenshots to all proof-heavy scenes:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --all-scenes --max-scenes 6 --ingredients auto --ingredients-scenes 3,4,5 --avatar auto
```

Google Vids features visible in the current editor include AI video, Avatar, Voiceover, Music, Image, Record, Uploads, Stock, Captions, Text, Templates, and Shapes. The automation currently uses AI video, Avatar, and screenshot Ingredients when Google Vids exposes a selectable upload route. For fully free, repeatable posting output, prefer Local MP4 mode because it adds real tool captures, voiceover, captions, and music without spending Vids generation quota.

Current tested state:

- Google Vids login profile works.
- Scene prompt fill works.
- Scene 1 generate + insert works.
- Appending Scene 2 into an existing Vids file works.
- Screenshot Ingredients are attempted and reported; the current Google Vids UI can open Drive/Photos without a local file chooser, so prompts automatically stop claiming attached screenshots when upload is not available.
- AI Video panel recovery works after Ingredients and Avatar changes.
- Scene prompts are compact, scene-specific, and only mention uploaded reference files when those files were actually uploaded.
- Google sign-in/account-chooser pages are detected early with a clear login/profile message.
- MP4 export/download works through the Google Vids browser menu.
- Generated outputs are mirrored into each tool's `generated/` folder.
- Exported Google Vids/avatar footage can be cached in `vids-clips/` and reused by local rendering; one-scene exports are saved as `scene-XX.mp4` clips for the local final merge.
- Rejected/hallucinated Vids cache entries are saved for audit but skipped by the local final editor.
- Full 6-scene generation can stop when the free Google Vids account reaches its video-generation limit.
- Local Remotion fallback works for a complete 30-60 second vertical MP4 using the generated script/captions and captured tool screenshots.

Export/download MP4 from an existing Vids file:

```bash
npm run vids:export -- --url "https://docs.google.com/videos/d/YOUR_FILE_ID/edit" --filename final-tool-reel.mp4
```

Write the Vids link and final MP4 path back into the prepared workbook:

```bash
npm run workbook:update -- --workbook outputs/runs/prepared-.../prepared-tool-reel-workbook.xlsx --tool-dir outputs/runs/prepared-.../tool-folder --vids-url "https://docs.google.com/videos/d/YOUR_FILE_ID/edit" --mp4 outputs/runs/.../final-tool-reel.mp4
```

This also writes clickable Excel formula links in the last columns:

```text
TRF Final Video Link
TRF Final Video Folder Link
TRF Drive Video Link
TRF Drive Folder Link
TRF Run Folder Link
TRF Generated Folder
TRF Generated Files
```

## Download Google Vids MP4

If you have a Google Vids file ID and an access token with Drive permissions:

```bash
GOOGLE_VIDS_FILE_ID=... GOOGLE_ACCESS_TOKEN=... npm run drive:download-vid
```

Downloaded files are saved under `outputs/runs/downloads/`.
