# AI Reel Creator by Prathak

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
- `outputs/work-tracker/tool-work-tracker.xlsx` as the master Excel tracker for idea name, tool link, hook, body, CTA, final script, captions, hashtags, SEO keywords, assets, avatar clips, final videos, Google Vids profile usage, and quality reports
- screenshots, fictional demo input files, an input-filled demo screenshot, a desktop demo recording, and a short mobile scroll recording when capture is enabled

## Branding

The project includes the real ALTF logo from `altftool.com`.

Logo files:

```text
public/brand/altf-logo.png
ui/assets/altf-logo.png
```

The dashboard header uses `ui/assets/altf-logo.png`. Final Remotion reels use `public/brand/altf-logo.png` on the final brand card, so the last seconds show the actual `Alt F` logo instead of an auto-generated initials badge.

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

After setup, daily start command:

```powershell
.\run-windows.bat
```

With your Excel file path:

```powershell
.\setup-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

The setup script installs/checks Node.js 20+, dependencies, Git, Chrome, Playwright Chromium, FFmpeg when available, creates `.env`, saves optional Excel/Drive defaults, and starts the dashboard. `run-windows.bat` reuses that setup for normal daily use. Full guide: `docs/windows-setup.md`.

For same Wi-Fi team usage, use one Windows machine as the main server and start it with `.\run-windows.bat -Lan`. The terminal prints the local dashboard link plus Same Wi-Fi URLs like `http://192.168.1.25:4317`. All assets, videos, Excel updates, Google Vids downloads, and final reels are saved on the server machine. Read the multi-user rules in `docs/windows-setup.md`.

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

This creates a new workbook with extra AI Reel Creator by Prathak columns. It does not overwrite your source Excel file.

```bash
npm run prep:free:capture -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --limit 1
```

The prepared workbook includes columns for local asset files, asset brief, reel script files, Google Vids status, Drive upload status, Google Vids link, final MP4 path, final video link, final video folder link, run folder link, generated scene folders, and QA status.

## Work Tracker Excel

The dashboard `Open Tracker Excel` and `Download Tracker` buttons regenerate the tracker before opening/downloading, so the workbook stays current after each script, avatar, asset, or video run.

```bash
npm run workbook:tracker
```

The tracker is saved at `outputs/work-tracker/tool-work-tracker.xlsx`. Main sheets:

- `Work Tracker`: one row per tool idea with tool link, source description, script language, hook/body/CTA, final script, captions, hashtags, SEO keywords, asset folder, avatar clips, final video link, Vids profiles, and quality status.
- `Post Copy`: ready-to-use Instagram caption, hashtags, hook, SEO keywords, and tool link.
- `Video Versions`: all saved reels per tool. You can create many videos for the same tool; old MP4s stay in their timestamp folders and the latest version is highlighted separately.
- `Generated Scripts`, `Generated Assets`, `Hook Avatars`, `Video Runs`, `Video Files`, `Quality Reports`, and `Profiles Limits`: detailed audit sheets for everything generated locally.

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

## Local Runner Agent

Use this as the easiest command wrapper for running the tool without remembering long commands.

Start the dashboard:

```bash
npm run agent -- --dashboard
```

Create one fully local/free Reel from the selected/default Excel:

```bash
npm run agent -- --one --row 2 --mode local
```

Run multiple rows one by one:

```bash
npm run agent -- --queue --rows 2,3,4 --mode local --continue-on-error
```

Use Google Vids only for the hook/avatar clip:

```bash
npm run agent -- --one --row 2 --mode google-hook --profiles work/shejal.sahu-anslation.com-profile
```

Common options: `--input`, `--row`, `--rows`, `--start-row`, `--limit`, `--mode prep|local|google-hook|google`, `--scenes`, `--avatar female|male|auto`, `--video-size portrait|landscape|square`, `--profiles`, `--drive-sync-dir`, and `--dry-run`.

Google Vids scene clips, then local merge:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6
```

This does not use Google Vids as the final merger. It creates and exports `scene-01`, `scene-02`, etc. separately, saves them under `vids-generated-scenes/scene-XX/`, caches them under `vids-clips/scene-XX.mp4`, then renders the final MP4 locally.

Google Vids avatar pack, then local edit with real tool assets:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --hook-vids-first --vids-scenes 1 --scene-count 6 --max-scenes 6
```

This spends Google Vids quota only on the first 10-second hook/avatar clip. The exported hook is saved under `vids-generated-scenes/scene-01/`, cached as `vids-clips/scene-01.mp4`, and the final Reel is merged locally with real screenshots, demo recordings, captions, music, and voiceover.

## Frontend Dashboard

Start the local dashboard:

```bash
npm run ui
```

Open:

```text
http://127.0.0.1:4317
```

The dashboard now opens in `Basic` mode. The existing full control set is under `Advanced Features`, including Excel row selection, modes, Google Vids profiles, queue/history, docs, terminal, and MP4 preview.

Read the docs on the separate Docs page:

```text
http://127.0.0.1:4317/docs.html
```

Use the top `Docs` button from Basic mode. The docs reader supports selected doc, all docs one page, search, refresh, and clickable sections without taking space inside the workflow screen.

Focused Google Vids flow page:

```text
http://127.0.0.1:4317/vids-flow.html
```

Use this page when you want the separate Vids hook/avatar flow: load Excel row, build assets, generate script, prepare/generate Google Vids avatar clips, then quick preview or final local render.

Basic mode is the recommended one-video workflow:

- `Excel file`: choose an `.xlsx`, `.xls`, or `.csv`, or paste the saved workbook path. The last selected path is remembered.
- `Tool row`: select the exact Excel row to process; Basic and Advanced row fields stay synced.
- `Credit Safe`: ON by default. It locks Google Vids avatar/voiceover generation, blocks paid/API voice providers, and requires typing `VIDS` before any Google Vids credit-spending action after you unlock it.
- `Vids Fallback Profiles`: open the profile checkbox dropdown and select up to 4 logged-in Google Vids profiles for Auto Run. If one profile hits a limit, the queue can try the next selected profile.
- `Video mode`: keep `Hook Vids + Local` for the best balance: Google Vids creates short avatar moments where useful, then local rendering uses real screenshots/recordings for the body.
- `Duration`: choose 30, 40, 50, or 60 seconds. Each scene is 10 seconds.
- `Prepare Assets`: builds script, scene plan, screenshots, recordings, prompts, provider packs, and workbook links without final rendering or Google Vids quota.
- `Edit Script`: after generating or loading an old script, edit Hook, Body, CTA, caption, hashtags, and scene-wise text, then click `Save Update`. The dashboard rewrites `reel-script.json`, `reel-script.md`, `scenes.json`, and keeps a backup JSON in the same script folder.
- `Hook quality`: the editor scores the hook, shows the tool-type template, and gives three selectable hook variants before you spend Google Vids credits.
- `Caption style`: Final Reel can render `Trending word pop`, `Clean SaaS`, or `Minimal bold` captions while keeping avatar clips full-screen and tool screenshots readable.
- `Create Quality Reel`: applies the recommended production preset, saves settings, runs one video, streams logs in the black terminal, and previews the final MP4 in the Basic page.
- `Drive sync folder` and `Update selected Excel after run`: optional, for saving final video/folder links back into your workbook.

Dashboard production controls:

- `Choose Excel`: select an `.xlsx`, `.xls`, or `.csv` file from your laptop. The dashboard copies it into `work/uploads/`, sets the input path, and loads tool rows automatically. To update the original workbook file itself, paste its full path manually and click `Load`.
- `Script + Assets`: prepares script, scene JSON, Vids prompts, screenshots, recordings, and workbook links without rendering or using Google Vids quota.
- `Free Clip Pack`: prepares CapCut, Pika, Runway, Canva, D-ID, and Shotstack scene prompt folders without rendering or using Google Vids quota.
- `Local MP4`: fully free local Reel render with captions, voiceover, music, real tool screenshots, and demo recordings.
- `Quality Reel Preset`: one click sets the recommended free workflow: Local MP4, 6 scenes, female/male avatar hook, real tool captures, free Edge TTS voice, captions, and music.
- `Avatar Pack`: prepares or generates a hook avatar clip, optional mid-reel focus avatar clip, and final CTA avatar clip. The Basic button is `Generate Avatar Pack`.
- `Hook Vids + Local`: uses Google Vids/avatar clips for the hook, optional focus break, and CTA when available, downloads/caches them, then merges the final MP4 locally with real tool screenshots and demo recordings.
- Voiceover-matched visuals: body scenes choose the best captured screenshot/recording based on the scene voiceover, so workflow, result, before-after, share, and safety lines show the right asset instead of random screenshots.
- Full-screen proof visuals: newly captured readable screenshots and demo recordings use a 1080x1920-friendly viewport and render near full screen in the Reel so the actual tool page stays visible.
- Input demo proof: capture now saves `desktop-demo-inputs.png` after fictional values are inserted into visible input fields, and workflow scenes prefer that asset so viewers understand what to type/use.
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
- `Profile Excel`: `work/google-vids-profiles.xlsx` is auto-created and refreshed with profile name, expected email/login ID, detected email, profile path, enabled/disabled state, priority, status, quota usage, and notes. Do not store passwords in this file.
- `Docs`: reads setup docs directly inside the dashboard with a selected-doc mode, an `All docs one page` mode, searchable text, match count, highlighted matches, and a section list.
- `Open Vids Cache`: opens the selected tool's `vids-clips/` folder after a run, so reusable Google Vids/avatar clips can be saved or checked quickly.
- `Open Generated`: opens the selected tool's `generated/` archive after a run, so final videos, reports, and export logs are together.

Multiple Google profiles are supported. Each profile is a separate local Chrome/Playwright browser profile under `work/`. Use only accounts you control and follow Google Vids quotas/terms. After logging into a new account, click `Refresh` in Google Vids config so the detected email/name appears in the profile dropdown. If a profile shows `LIMIT USED`, select another profile or run `Local MP4` mode until that account has quota again. The dashboard and CLI runner both read the profile registry when choosing fallback order, skipping disabled and limit-used profiles.

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

Recommended hybrid mode when you want a strong Vids/avatar hook but reliable real tool proof:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --hook-vids-first --vids-scenes 1 --scene-count 6 --max-scenes 6
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
generated/local-render/reel-quality-report.json
generated/local-render/remotion-props.json
generated/local-render/assets/
generated/google-vids/profile-name/
generated/google-vids-export/profile-name/
generated/generated-manifest.json
```

The prepared workbook includes `TRF Generated Folder`, `TRF Generated Files`, `TRF Reel Quality Score`, and `TRF Reel Quality Report`, so you can open one tool row and find the saved outputs quickly.

The quality report scores each reel on avatar hook, downloaded Google Vids hook/CTA clips, hook copy, real tool proof, screen recording, saved Google Vids body voiceover, captions, music, CTA/review reminder, and 30-60 second duration. If Google Vids clips or voiceover are missing, the MP4 can still render with local fallbacks, but the dashboard will mark it as a draft/review item instead of silently treating it like a premium post-ready reel. Treat `post_ready_review` as a strong draft that still needs one human review before upload.

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

For the newer runner shortcut, skip `--profiles` to use the enabled priority order from `work/google-vids-profiles.xlsx`:

```bash
npm run agent -- --one --row 2 --mode google-hook
```

By default, fallback profiles start a new Vids file. If you have shared the same Vids file with the second account and want fallback profiles to reuse the same URL, add `--reuse-url-on-fallback`.

Render a full local 30-60 second vertical Reel from an already prepared tool folder:

```bash
npm run render:local -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --filename final-tool-reel.mp4
```

The local MP4 is a free Reel with captions, captured tool screenshots, recorded tool usage where available, generated scene voiceover, subtle music, and a creator/avatar badge. Add `--no-audio` to `render:local` only if you want a silent visual draft.

Every local MP4 render also writes `reel-quality-report.json` and mirrors it into `generated/local-render/`. The dashboard and workbook show the score so weak reels are easy to catch before posting.

For a less robotic final voice, export a human voiceover pack and record or generate each scene as a separate audio file:

```bash
npm run voiceover:pack -- --tool-dir outputs/runs/one-video-agent-.../tool-folder
```

Save audio files in the generated `voiceovers/` folder as `scene-01.mp3`, `scene-02.mp3`, etc. Then render again:

```bash
npm run render:local -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --voiceover-dir outputs/runs/one-video-agent-.../tool-folder/voiceovers --filename final-tool-reel-human-voice.mp4
```

The renderer uses these scene audio files first. Missing scene audio falls back to built-in macOS/Windows TTS.

### Better AI Scripts, Voice, And Avatar Clips

The agent can prepare or generate higher-quality media when API keys are configured.

Use OpenAI or Gemini for script enhancement:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --ai --ai-provider openai --ai-model gpt-5-mini
```

Generate natural scene voiceovers:

```bash
npm run voiceover:generate -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --provider edge --voice hi-IN-SwaraNeural
npm run voiceover:generate -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --provider openai --voice verse
npm run voiceover:generate -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --provider elevenlabs --voice YOUR_ELEVENLABS_VOICE_ID
```

Free voice setup:

```bash
python3 -m pip install edge-tts
```

Recommended free voices:

```text
hi-IN-SwaraNeural    Hindi female, good for Hindi/Devanagari scripts
hi-IN-MadhurNeural   Hindi male
en-IN-NeerjaNeural   Indian English female, often better for Roman Hinglish
en-IN-PrabhatNeural  Indian English male
```

Run a full one-video job with free Edge TTS:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --tts-provider edge --tts-voice hi-IN-SwaraNeural
```

Choose the opening presenter style:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --hook-avatar female
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --hook-avatar male
```

Useful `.env` keys:

```text
OPENAI_API_KEY=...
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
HEYGEN_API_KEY=...
HEYGEN_VOICE_ID=...
```

Use your own image references for avatar clips:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --creator-images "/path/me-front.jpg,/path/me-side.jpg,/path/me-close.jpg"
```

Default AltFTool female and male host images are saved in `public/avatar/` and are used automatically when no custom avatar image is selected. The dashboard buttons `Female` and `Male` switch between these saved defaults, and Google Vids hook/focus/CTA prompts reference the selected image so the presenter style stays consistent.

This creates `avatar-references/` and `avatar-generation/` prompt packs. If HeyGen API keys and a voice ID are configured, automated avatar clip generation can be run with:

```bash
npm run avatar:generate -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --provider heygen --scenes 1,2,6 --voice-id YOUR_HEYGEN_VOICE_ID
```

Downloaded/generated avatar MP4s are cached in `vids-clips/`, and Local MP4 uses them before fallback screenshots.

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
