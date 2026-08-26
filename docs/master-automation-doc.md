# AI Reel Creator by Prathak - Master Automation Doc

Last updated: 2026-08-25

## Latest Quality Control Update

The Basic workflow now adds safer production controls before any reel is generated:

1. `Tool idea name` has quick filters for ready tools, tools with no saved video yet, and P0 rows. Ready tools are shown first by default so you do not waste time on unfinished tool pages.
2. Saved video status is refreshed after the workbook loads, so rows with completed reels show a video-ready tag and folder link in the tool list.
3. Campaign Run shows a credit estimate before queue start. `Credit Safe` mode shows local/free processing and blocks Google Vids generation unless you unlock it.
4. The Final Reel step has a pre-render review checklist for row, assets, script, avatar, voice, profile, and final QA.
5. Final local rendering can run in `Credit Safe` mode without requiring a ready Google Vids profile. Google Vids profiles are required only for avatar/voiceover generation.
6. Google Vids profile selection now allows added but login-needed profiles. Disabled and limit-used profiles stay blocked; if a login-needed profile is selected, Google Vids may ask you to sign in before generation continues.
7. `Low-credit Vids` is ON by default. When Vids is unlocked, it spends only on the hook avatar clip and completes the rest with local real-demo editing.

Recommended daily flow:

```text
Load Excel -> choose ready tool -> check old work -> Build Assets -> Generate/Edit Script -> Prepare/Generate Avatar -> Render Final Reel -> review final MP4
```

## Latest Auto Queue, Avatar Pack, And Separate Docs Reader Update

The Basic dashboard now keeps docs on a separate reader page so the workflow stays focused.

Read docs link:

```text
http://127.0.0.1:4317/docs.html
```

Where to find it:

1. Top bar `Docs` button.
2. Direct `/docs.html` URL.

The Docs page can read one selected doc or all docs in one page. It also includes search, match count, refresh, and a clickable section list.

Basic mode now focuses on the manual quality flow: load Excel, search tool names, open the `Tool idea name` dropdown, click a tool name, then build assets, generate/edit script, prepare avatar prompts, and render/review the final reel step by step. `Credit Safe` stays ON by default so Google Vids generation cannot start accidentally. `Low-credit Vids` also stays ON by default; when you unlock Google Vids, it generates only the hook avatar clip and lets the local renderer use real demo assets for the body and CTA.

The Google Vids avatar flow is now an `Avatar Pack`:

```text
Scene 1: hook avatar clip
Scene 2: optional mid-reel focus avatar clip
Last scene: optional CTA avatar clip
Body scenes: real tool screenshots / screen recordings / local voiceover
```

Low-credit mode:

```text
Google Vids: Scene 1 hook avatar only
Local render: real tool demo body + CTA/end card + captions + voiceover
Best use: Instagram Reels where one strong human hook is enough and quota should be saved
```

Generated avatar clip names:

```text
hook_avatar.mp4
focus_avatar_scene_02.mp4
cta_avatar.mp4
```

Cached local render names:

```text
vids-clips/scene-01.mp4
vids-clips/scene-02.mp4
vids-clips/scene-05.mp4 or vids-clips/scene-06.mp4, depending on selected duration
```

During final render, any cached avatar/focus/CTA clip keeps its own Google Vids audio. The local voiceover is skipped for that scene to avoid double voice. The remaining body scenes continue to use real tool screenshots/recordings with captions and voiceover.

All avatar/focus/CTA clips render full-screen in the final 9:16 Reel and do not receive extra local captions, because Google Vids avatar clips can already include captions/audio. Tool demo scenes keep the captured AltFTool screenshots and recordings as the main full-screen visual, so the real UI stays readable instead of becoming a tiny background. For readable screenshots, local captions use a smaller one-word lower strip and URL text is shortened in the caption layer.

Body scene visuals now follow the voiceover meaning:

```text
input / run / workflow -> demo screen recording
result / output / checklist -> after/result screenshot
before / after / proof -> before-after captured screens
mobile / share / caption -> mobile scroll or share-context screen
privacy / safe / review -> safety/result screen
```

Asset capture also writes a `toolUseGuide` into the asset manifest. Script and render steps use this guide so body scenes explain the real use-flow: open the AltFTool link, show what the tool does, fill or upload fictional demo input, click the visible primary action, and hold the result/output screen for review.

Every rendered scene keeps AltFTool visible through the top brand strip, page frame, caption/footer, or final brand card.

## Latest Brand And Windows Portability Update

The project now includes the real ALTF logo and Windows-first run scripts.

Brand assets:

```text
public/brand/altf-logo.png
ui/assets/altf-logo.png
```

Where the logo appears:

1. Dashboard top-left brand mark.
2. Final Reel end card.
3. Remotion default props for preview/testing.

Windows commands:

```powershell
.\setup-windows.bat
.\run-windows.bat
```

`setup-windows.bat` is for first-time setup or dependency repair. `run-windows.bat` is for normal daily dashboard use. The scripts save port, Excel path, and Drive sync folder into `.env` when provided.

## Latest Vids Flow Version Page

The app now has a separate focused Google Vids flow page:

```text
http://127.0.0.1:4317/vids-flow.html
```

This page is similar to the `Open Version 1` link, but it is for the newer Google Vids workflow. It keeps the main Basic dashboard clean while giving a direct step-by-step path for:

1. Load default Excel and tool idea names.
2. Select one tool row.
3. Build real tool assets.
4. Generate the reel script.
5. Prepare Google Vids hook/avatar prompts safely.
6. Generate Google Vids avatar clips only after Credit Safe is turned off and `VIDS` is typed.
7. Quick preview or final local render.

Default mode is safe: Credit Safe is ON and Low-credit Vids is ON, so prompt preparation and preview can happen before any Google Vids credits are used.

## Latest Windows LAN / Multi-User Deployment Note

For team usage, use one Windows laptop or desktop as the main server and let same-Wi-Fi users open the dashboard in their own browsers. The browser runs on each user's laptop, but automation runs on the server machine.

LAN start command:

```text
.\run-windows.bat -Lan
```

The server terminal prints:

```text
Local URL: http://127.0.0.1:4317
Same Wi-Fi URLs:
  http://192.168.1.25:4317
Docs: http://127.0.0.1:4317/docs.html
Vids Flow: http://127.0.0.1:4317/vids-flow.html
```

Storage behavior:

```text
Excel uploads/copies      -> server project folder
screenshots/assets        -> server outputs folder
Google Vids downloads     -> server outputs folder
final reels               -> server timestamped tool folder
tracker workbook          -> server outputs/work-tracker
client laptop             -> browser UI only, unless user downloads a file
```

Multi-user operating rules:

1. Multiple users can view the dashboard, select rows, and review scripts.
2. Heavy jobs should run through a shared queue.
3. Google Vids automation should lock one profile per active job.
4. If a Google Vids profile is busy, login-needed, or limit-used, use the next fallback profile.
5. Final render should normally run one at a time on a laptop, or at most two at a time on a stronger desktop.
6. Use Quick Preview first, then full Render Final Reel only after review.
7. Do not expose the dashboard to public internet without authentication.

Recommended server:

```text
Windows 10/11
Node.js 20+
Google Chrome
16 GB RAM minimum, 32 GB better
SSD storage
Stable Wi-Fi or wired LAN
```

## Latest Pipeline Update - 30 to 60 Second Reels

The current default production flow is now:

1. Open the actual tool URL and build assets first.
2. Save screenshots, recordings, demo files, and `asset-brief.md` in the tool folder.
3. Improve the script into a compact Hook-Body-CTA arc.
4. Keep final Reel length between 30 and 60 seconds.
5. Use 3-6 scenes of exactly 10 seconds each; default is 6 scenes / 60 seconds.
6. Save `reel-script.md`, `reel-script.json`, `scene-plan.json`, `google-vids-prompts.csv`, `free-video-providers/`, and `post-copy.md`.
7. Save scene-level Google Vids prompt folders in `vids-generated-scenes/scene-XX/`.
8. Save free/free-trial provider prompt folders for CapCut, Pika, Runway, Canva, D-ID, and Shotstack.
9. Use real tool screenshots/recordings for demo, workflow, output, and before/after proof.
10. Generate/cache Google Vids/avatar/provider clips when quota is available.
11. Merge the final Reel locally with captions, voiceover, music, transitions, progress bar, CTA, and safety reminder.
12. Save final MP4, reports, props, render assets, exports, and generated files under the same tool folder.

Default Google Vids/avatar pack settings:

```text
Avatar scenes: 1,2,last
Screenshot/proof scenes: remaining body scenes
```

Use `--scene-count 3`, `--scene-count 4`, `--scene-count 5`, or `--scene-count 6` to choose the script/video length.

This doc explains the complete setup we built for turning your Excel tool list into promotional Instagram Reel assets and videos.

## Goal

You want to focus only on developing tools. This automation should handle the promotion workflow:

1. Read tool details from Excel.
2. Open the actual tool link.
3. Capture screenshots and short screen recordings.
4. Prepare a better Hinglish Reel script.
5. Convert it into 3-6 focused scenes.
6. Create Google Vids prompts for 10-second clips.
7. Optionally use Google Vids with avatar and screenshot ingredients.
8. If Google Vids quota fails, render a free local MP4 fallback.
9. Mirror generated videos, reports, exports, and render assets into the same tool folder.
10. Save final links and output paths back into a prepared Excel file.

## Current Project

Project folder:

```text
/Users/palsahu/Documents/Codex/2026-08-14/mene-website-banaya-thai-or-usme
```

Your Excel file:

```text
/Users/palsahu/workplace/projects/n learn/Book1.xlsx
```

Tool website base URL:

```text
https://www.altftool.com/
```

Dashboard URL:

```text
http://127.0.0.1:4317
```

## What Is Built

### 1. Excel Reader

The system reads `.xlsx` or `.csv` files and maps your columns automatically.

Your current workbook mapping:

```text
Idea Name -> tool_name
Short Description -> description
ROUTES -> tool_url / tool_route
View Script -> script
Category -> category
Priority -> priority
STATUS -> status
```

If `ROUTES` contains a relative path like:

```text
/tools/all/universal-pii-ai-redactor
```

the system converts it to:

```text
https://www.altftool.com/tools/all/universal-pii-ai-redactor
```

### Basic Dashboard Flow

The dashboard opens in `Basic` mode for one-video production:

1. Choose or paste the Excel file path.
2. Click `Load` and select the tool row.
3. Keep `Hook Vids + Local` for the recommended workflow.
4. Choose `Female presenter`, `Male presenter`, or `Auto presenter`.
5. Use the avatar photo control to select the built-in female/male AltFTool presenter or upload a consented PNG/JPG/WebP custom avatar photo.
6. Choose 30, 40, 50, or 60 seconds, and keep `Vids size` on `Vertical 9:16` for Reels. Use `Landscape 16:9` or `Square 1:1` only when you are generating Google Vids clips for non-reel reuse.
7. Click `Prepare Assets` to build script, screenshots, recordings, prompts, and workbook links without final render.
8. Use `Edit Script` when needed to update Hook, Body, CTA, caption, hashtags, or scene-wise voiceover/on-screen text, then click `Save Update`.
9. Click `Create Quality Reel` to generate the recommended Reel: Google Vids avatar hook when quota/profile is available, real tool demo in the body, Edge Hindi voiceover, captions, music, quality report, and final local MP4.

The dashboard remembers the last Excel path, selected row, Basic mode, avatar style, avatar photo, duration, Drive sync folder, and selected tab in `work/ui-state.json`. Uploaded custom avatar photos are stored in `work/avatar-references/`.

Resume after a failed automation run:

1. Select the same tool row again.
2. Use the existing-work strip to choose `Use Old Assets`, `Use Old Script`, or `Use Old Avatar`.
3. If only the avatar prompt pack exists but no downloaded avatar video exists, click `Avatar Step`, generate/download the avatar pack, then click `Final Step`.
4. If only final render failed, click `Final Step` and render again from the saved assets/script/avatar.

Google Vids prompt quality rules:

- Every Google Vids generated clip follows the selected size: `Vertical 9:16`, `Landscape 16:9`, or `Square 1:1`. Reels should stay vertical by default.
- The hook starts in the first 2 seconds with a direct Hinglish line.
- Tool proof must use real AltFTool/tool screenshots, URL context, or captured screen references.
- No fake UI, no unsupported features, no private data, and no generic filler.
- CTA clips mention the caption link, save/share/follow action, and human review before sharing.

### 2. Tool Capture Agent

For each selected tool row, the agent opens the real tool URL and captures:

```text
screenshots/desktop-top.png
screenshots/desktop-full-page.png
screenshots/desktop-demo-before.png
screenshots/desktop-demo-after.png
screenshots/mobile-top.png
recordings/desktop-demo.webm
recordings/mobile-scroll.webm
demo-assets/demo-input.txt
demo-assets/demo-data.csv
demo-assets/demo-document.pdf
demo-assets/demo-image.png
```

It uses only fictional/demo data. It does not use real private data.

### 3. Reel Script Agent

The script agent improves the tool script for:

```text
hook
public engagement
clear problem
practical value
Hinglish voiceover
short captions
safe claims
```

Important rule:

```text
Do not invent fake features. Do not show fake UI. Use the real tool screenshot/demo wherever possible.
```

### 4. Scene Director Agent

The scene plan always has:

```text
3-6 scenes
10 seconds each
30-60 seconds total
9:16 vertical format
Hinglish voiceover
Instagram Reel style
```

Output file:

```text
scene-plan.json
```

Google Vids prompt output:

```text
google-vids-prompts.csv
```

Free provider prompt output:

```text
free-video-providers/
free-video-providers/all-free-provider-prompts.csv
```

Post caption output:

```text
post-copy.md
```

### 5. Google Vids Operator

The Google Vids operator opens Google Vids in a persistent browser profile and can:

```text
open Google Vids
select/create portrait video
open AI video panel
select avatar
attach tool screenshots as ingredients
fill scene prompts
submit generation when enabled
insert generated clip when enabled
export/download MP4 when possible
cache full/partial exports for later local reuse
```

Current Google Vids features seen in the editor:

```text
AI video
Avatar
Voiceover
Music
Image
Record
Uploads
Stock
Captions
Text
Templates
Shapes
```

The automation currently uses these reliably:

```text
AI video
Avatar
Screenshot Ingredients
Export menu
Vids clip cache
```

Voiceover and music are handled more reliably in local MP4 mode right now.

### 5.1 Google Vids Clip Cache

Every tool folder gets a local cache folder:

```text
vids-clips/
```

Use it for reusable Google Vids/avatar footage. Supported names:

```text
scene-01.mp4
scene-1.webm
avatar-scene-01.mp4
google-vids-scene-01.mp4
full-google-vids-export.mp4
partial-google-vids-export-scenes-01-03.mp4
```

Default Google Vids mode creates one Vids file per scene, exports each scene MP4, stores it in `vids-generated-scenes/scene-XX/`, and caches it as `vids-clips/scene-XX.mp4`. Local rendering then merges the final Reel. The old full-timeline export path is available with `--vids-timeline-export`.

Avatar Pack hybrid mode creates Scene 1 hook, optional Scene 2 focus, and the last CTA in Google Vids, exports each as a short avatar clip, caches them in `vids-clips/`, and then renders the final Reel locally with real tool screenshots and demo recordings. The dashboard's default `Low-credit Vids` mode uses only Scene 1 hook generation, so one reel normally needs one Google Vids clip instead of a full hook/focus/CTA pack:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --hook-vids-first --vids-scenes 1 --scene-count 6 --max-scenes 6
```

When local MP4 render runs, priority is:

```text
scene-specific cached Vids clip
full/partial cached Google Vids export
real demo recording
real screenshots
```

If visual QA shows a cached Vids export has hallucinated or fake UI, set that manifest entry to `renderEligible: false` or a rejected `qualityStatus`. The file stays saved in `vids-clips/`, but local rendering skips it and uses real captured screenshots/recordings instead.

If scene export is blocked by the current Google Vids UI, manually download or record a Vids/avatar scene and save it as `scene-01.mp4`, `scene-02.mp4`, etc. inside `vids-clips/`. For the Basic Avatar Pack, also keep copies in the `hook-avatar/` folder as `hook_avatar.mp4`, `focus_avatar_scene_02.mp4`, and `cta_avatar.mp4`.

### 6. Local Free Video Renderer

If Google Vids quota is over or you want a fully free workflow, local render creates a 70-second MP4 with:

```text
cached Google Vids/avatar clips when available
real tool screenshots
real demo screen recording when available
Hinglish voiceover
animated captions
subtle music bed
creator/avatar badge
before-after scene
professional safety reminder
```

This uses Remotion locally.

### 6.1 Generated Output Archive

Every tool folder also has:

```text
generated/
```

This is the complete generated-output archive for that tool. The agent mirrors:

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
free-video-providers/
```

`reel-quality-report.json` scores the Reel on avatar hook, hook copy, real tool proof, screen recording, voiceover, captions, music, CTA/review reminder, and 30-60 second duration. The dashboard and workbook surface the score so low-quality drafts can be improved before posting.

Use `generated/` for final outputs and audit files. Use `free-video-providers/` for CapCut/Pika/Runway/Canva/D-ID/Shotstack prompts. Use `vids-clips/` for reusable Google Vids/avatar/provider footage that should feed future local renders.

## Dashboard Use

Start dashboard:

```bash
npm run ui
```

Open:

```text
http://127.0.0.1:4317
```

Dashboard lets you control:

```text
Excel file path
Excel row number
queue start row
queue video limit
specific queue rows
run mode
max scenes
primary Google Vids profile
fallback Google Vids profile
detected profile name/email
Profiles & Limits tab with all profiles and quota bars
add new Google Vids profile
add new profile without opening login
refresh profile list
use only primary profile
select Vids avatar
avatar name
avatar scenes
use tool screenshots
screenshot scenes
reuse Vids URL on fallback
disable local fallback
manual Vids quota tracker
recent run history
retry row
video preview
open generated output folder
open Vids clip cache folder
quick status cards for selected tool, mode, profiles, and output
Run / Queue & History / Docs tabs
read and search docs inside dashboard
```

The dashboard opens in `Basic` mode with three clean top-level tabs: `Tool Promotion`, `General Script Video`, and `Profiles`. The existing full control dashboard is still grouped under `Advanced Features`, including one-page tabs, quick status cards, a black terminal panel with internal scrolling, an output preview, queue/history cards, profile limits, and a searchable docs reader.
Use `Choose` beside the Excel file field to select an `.xlsx`, `.xls`, or `.csv` file. The dashboard saves a copy in `work/uploads/`, sets the input path, and loads the tool rows automatically. To update the original workbook file itself, paste its full path manually and click `Load`.
The `Profiles` tab is global. Add, login, rename, remove, and choose primary/fallback Google Vids users there once; Tool Promotion, Hook Avatar, Final Reel, automation queues, and General Script Video all reuse the same profile selection.

Dashboard modes:

```text
Script + Assets -> prepares script, scene plan, screenshots, recordings, prompts, and workbook links only.
Free Clip Pack -> prepares free provider prompt folders with no Google Vids quota.
Local MP4 -> creates a free local video with captions, voiceover, music, and real tool proof.
Quality Reel Preset -> sets Local MP4, 6 scenes, female/male avatar hook, Edge TTS free voice, real captures, captions, and music.
Hook Vids + Local -> generates short Google Vids/avatar clips for hook, focus, and CTA when useful, then merges locally with real screenshots and demo recordings.
Vids Clips -> asks Google Vids to generate/export separate scene clips, then local merge.
All Vids Clips -> same scene-by-scene download flow for every scene; use only when quota is available.
```

Queue:

```text
Video limit: number of Excel rows to process from Start row.
Specific rows: optional exact list, for example 2,3,5-7.
Queue runs one row at a time.
queue-progress.xlsx is created inside outputs/runs/queue-.../ and updated after each row.
The progress workbook stores row status, run folder, generated folder, cache folder, Google Vids URL, final MP4 path, and errors.
If Google Vids reports quota limit, pending Google rows pause automatically.
The exhausted profile is marked LIMIT USED in profile cards and dropdowns.
```

Persistent dashboard state:

```text
work/ui-state.json
```

This stores recent run history and manual quota tracker numbers. It does not store Google passwords.

## Multiple Google Vids Profiles

Yes, multiple Google Vids profiles are supported.

Each profile is a separate local browser profile folder:

```text
work/google-vids-profile
work/google-vids-profile-2
work/google-vids-profile-3
...
```

Dashboard behavior:

```text
Profiles tab -> profile list shows all added profiles.
Profiles tab -> shows all profiles, login status, primary/fallback badges, AI video usage, avatar usage, quota notes, and quick actions.
If Chrome profile metadata contains a Google account, the detected email/name appears in the dropdown.
If metadata is not available, the dashboard shows email unknown.
Profiles marked LIMIT USED should not be selected for new Google Vids runs.
Primary profile is tried first.
Fallback profile is tried next if generation/export fails.
Use only primary disables fallback.
Use Primary -> sets that profile as the next primary Google Vids account.
Use Fallback -> sets that profile as fallback.
Login -> opens Google Vids login for that profile.
Folder -> opens the local profile folder.
```

Quota behavior:

```text
Google does not expose an exact public free-quota counter in this automation.
The dashboard stores a practical tracker in work/ui-state.json.
When Google Vids reports a quota/limit error, that profile is auto-marked LIMIT USED.
The quota card also has Mark Vids limit used for manual mark/clear.
To clear it after quota resets, lower used counts if needed, uncheck Mark Vids limit used, and Save.
```

Add another account:

```text
New profile: google-vids-profile-3
Click Add Profile if you only want to create/select the profile.
Click Add + Login if you want to create it and immediately open Google Vids login.
If you used Add Profile, select it under Login profile and click Open Login later.
Login with the Google account you want to use.
Return to dashboard and click Refresh
Select that profile as Primary or Fallback
```

CLI equivalent:

```bash
npm run vids:login -- --profile work/google-vids-profile-3
```

Then run using the new profile:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --max-scenes 7 --vids-profiles work/google-vids-profile-3
```

Important:

```text
Use only accounts you own/control.
Do not try to bypass platform limits.
The local state stores profile folder paths, run history, quota notes, and detected account labels.
It does not store your Google password.
```

## Docs Menu

The Basic dashboard has a separate Docs page and the Advanced dashboard has a Docs tab.

Basic docs link:

```text
http://127.0.0.1:4317/docs.html
```

It can read:

```text
README.md
docs/master-automation-doc.md
outputs/free-mode-guide.md
outputs/agent-setup-pack.md
outputs/full-test-report.md
```

Docs controls:

```text
Selected doc -> read one documentation file.
All docs one page -> combine all listed docs into one readable page.
Search docs -> highlights matches and shows a match count.
Sections -> clickable heading list for fast navigation.
Refresh -> reloads latest doc changes from disk.
```

When automation behavior changes, update:

```text
README.md
docs/master-automation-doc.md
```

Then click Refresh in the Docs tab to read the latest instructions.

## Best Daily Workflow

### Option A: Fully Free Local MP4

Use this when you want one ready MP4 without spending Google Vids quota.

Dashboard:

```text
Mode: Local MP4
Row: selected Excel row
Max scenes: 7
Run
```

CLI:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only
```

Change `--row 2` to another Excel row when you want another tool video.

### Option A2: Script And Asset Prep Only

Use this when you want the agent to prepare scripts, screenshots, recordings, prompts, captions, and Excel links but not render a final MP4 yet.

Dashboard:

```text
Mode: Script + Assets
Row: selected Excel row
Run One Video
```

CLI:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --prep-only
```

### Option B: Google Vids With Avatar

Use this when Google Vids quota is available.

Dashboard:

```text
Mode: Google Vids
Primary profile: work/ruvanshi.sahu-anslation.com-automation
Fallback profile: another logged-in profile if available
Select Vids avatar: on
Avatar: auto
Avatar scenes: 1,2,7
Use tool screenshots: on
Screenshot scenes: 3,4,5,6
Run
```

CLI:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --max-scenes 7 --vids-profiles work/google-vids-profile,work/google-vids-profile-2
```

Use second email first:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --max-scenes 7 --vids-profiles work/google-vids-profile-2,work/google-vids-profile
```

Use only second email:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --max-scenes 7 --vids-profiles work/google-vids-profile-2
```

If Google Vids generation limit is hit, the agent falls back to local MP4 unless you disable local fallback.

## Google Vids Login Setup

Login primary profile:

```bash
npm run vids:login -- --profile work/google-vids-profile
```

Login second email in separate profile:

```bash
npm run vids:login -- --profile work/google-vids-profile-2
```

Check primary profile:

```bash
npm run vids:check -- --profile work/google-vids-profile
```

Check second profile:

```bash
npm run vids:check -- --profile work/google-vids-profile-2
```

If the old profile opens, select the profile manually in dashboard or put the intended profile first in `--vids-profiles`.

## One Video Limit

For one row only:

```bash
--row 2 --limit 1
```

`agent:one-video` is designed to create one video from one selected row. `--limit 1` makes that explicit.

For many rows, use batch/prep mode first. But for posting-quality videos, run one row at a time and review output.

## Generated Excel Columns

The prepared workbook gets extra columns at the end:

```text
TRF Full Tool URL
TRF Tool Route
TRF Asset Folder
TRF Scene Plan JSON
TRF Google Vids Prompts CSV
TRF Post Copy
TRF Desktop Screenshot
TRF Mobile Screenshot
TRF Full Page Screenshot
TRF Scroll Recording
TRF Drive Upload Status
TRF Drive Folder Link
TRF Final Reel Voiceover
TRF Scene 1 Voiceover
TRF Scene 2 Voiceover
TRF Scene 3 Voiceover
TRF Scene 4 Voiceover
TRF Scene 5 Voiceover
TRF Scene 6 Voiceover
TRF Scene 7 Voiceover
TRF Scene 1 Vids Prompt
TRF Scene 2 Vids Prompt
TRF Scene 3 Vids Prompt
TRF Scene 4 Vids Prompt
TRF Scene 5 Vids Prompt
TRF Scene 6 Vids Prompt
TRF Scene 7 Vids Prompt
TRF Data Prep Status
TRF Data Prep Note
TRF Google Vids Status
TRF Google Vids Link
TRF Google Vids Primary Profile
TRF Google Vids Fallback Profiles
TRF Google Vids Active Profile
TRF Google Vids Profiles Tried
TRF Vids Clip Cache Folder
TRF Vids Cached Clips
TRF Final MP4 Path
TRF QA Status
TRF Last Automation Run
TRF Final Video Link
TRF Final Video Folder Link
TRF Run Folder Link
TRF Generated Folder
TRF Generated Files
```

Important:

```text
TRF Final Video Link
TRF Final Video Folder Link
TRF Run Folder Link
```

are clickable Excel links when possible.

## Output Folder Structure

Each run creates a folder under:

```text
outputs/runs/
```

Example structure:

```text
outputs/runs/one-video-agent-.../
  one-video-agent-report.json
  prepared-tool-reel-workbook.xlsx
  prepared-tool-reel-workbook-updated.xlsx
  tool-slug/
    manifest.json
    scene-plan.json
    google-vids-prompts.csv
    post-copy.md
    generated/
      README.md
      generated-manifest.json
      agent/
        prepared-tool-reel-workbook.xlsx
        one-video-agent-report.json
      local-render/
        tool-name-local-fallback-reel.mp4
        local-reel-report.json
        reel-quality-report.json
        remotion-props.json
        assets/
      google-vids/
      google-vids-export/
    vids-clips/
      README.md
      cache-manifest.json
      scene-01.mp4
      full-google-vids-export.mp4
    screenshots/
    recordings/
    demo-assets/
  local-render/
    tool-name-local-fallback-reel.mp4
    local-reel-report.json
    reel-quality-report.json
    remotion-props.json
```

## Useful Commands

Start dashboard:

```bash
npm run ui
```

Prepare assets only:

```bash
npm run prep:free:capture -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --limit 1
```

Run one local free video:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only
```

Run one Google Vids video with fallback profiles:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --max-scenes 7 --vids-profiles work/google-vids-profile,work/google-vids-profile-2
```

Dry-run Google Vids without spending generation quota:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --max-scenes 2
```

Operate one scene in Google Vids without generating:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --scene 3 --avatar auto --ingredients auto --ingredients-scenes 3
```

Generate and insert one scene:

```bash
npm run vids:operate -- --tool-dir outputs/runs/prepared-.../tool-folder --scene 3 --avatar auto --ingredients auto --ingredients-scenes 3 --submit --insert --after-submit-wait 120000
```

Render local MP4 from an existing tool folder:

```bash
npm run render:local -- --tool-dir outputs/runs/one-video-agent-.../tool-folder --filename final-tool-reel.mp4
```

Export existing Google Vids file:

```bash
npm run vids:export -- --url "https://docs.google.com/videos/d/YOUR_FILE_ID/edit" --filename final-tool-reel.mp4
```

Update prepared workbook with Vids URL and MP4 path:

```bash
npm run workbook:update -- --workbook outputs/runs/prepared-.../prepared-tool-reel-workbook.xlsx --tool-dir outputs/runs/prepared-.../tool-folder --vids-url "https://docs.google.com/videos/d/YOUR_FILE_ID/edit" --mp4 outputs/runs/.../final-tool-reel.mp4
```

## Other Laptop Setup

Yes, this setup can run on another laptop.

For Windows, the easiest setup is:

```powershell
.\setup-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

This checks/installs Node.js 20+, npm dependencies, Git, Chrome, Playwright Chromium, FFmpeg when available, creates `.env`, and starts the dashboard. Full guide:

```text
docs/windows-setup.md
```

Steps:

1. Copy the project folder.
2. Install Node.js 20 or newer.
3. Open terminal in project folder.
4. Install dependencies:

```bash
npm install
```

5. Install Playwright Chromium if needed:

```bash
npx playwright install chromium
```

6. Update the Excel path because this path is local to your current Mac:

```text
/Users/palsahu/workplace/projects/n learn/Book1.xlsx
```

7. Start dashboard:

```bash
npm run ui
```

8. Open:

```text
http://127.0.0.1:4317
```

9. Login Google Vids profiles again:

```bash
npm run vids:login -- --profile work/google-vids-profile
npm run vids:login -- --profile work/google-vids-profile-2
```

Do not rely on copying Google profile folders between laptops. Google may block or expire copied login sessions. Safer method is login again on the new laptop.

## Free Workflow Recommendation

Most reliable free workflow:

```text
Local MP4 mode
```

Why:

```text
No Google Vids generation quota
No OpenAI API credit needed
Works from Excel row
Uses real tool screenshots
Creates voiceover, music, captions, and MP4 locally
```

Google Vids is useful when you specifically want its AI video/avatar clips, but it depends on account quota and Google UI stability.

## Quality Rules For Reels

Every generated reel should follow:

```text
9:16 vertical
30-60 seconds total
3-6 scenes
10 seconds per scene
realistic SaaS/UGC look
fast cuts
real tool screenshots
clear Hinglish voiceover
short readable captions
fictional/demo data only
final human review before posting
```

Scene structure:

```text
Scene 1: strong avatar hook
Scene 2: optional avatar focus break or product intro
Middle scenes: actual tool demo, workflow, useful output, before-after proof
Last scene: CTA, brand, human review, and safety reminder
```

## Current Tested Status

Passed:

```text
Excel reading from Book1.xlsx
AltF Tool URL resolving
real page screenshot capture
fictional demo interaction
desktop demo WebM capture
mobile scroll WebM capture
7-scene scene-plan generation
Google Vids prompt CSV generation
post copy generation
prepared workbook extra columns
clickable final video/folder links in workbook
dashboard UI smoke test
Google Vids login/profile check
Google Vids avatar picker dry-run
Google Vids auto avatar preset dry-run
Google Vids screenshot ingredient attempt/report dry-run
Google Vids AI panel recovery after avatar/ingredients
compact scene-specific Google Vids prompt fill
Google sign-in/account-chooser blocker detection
partial Google Vids export cache marking
local 70-second Remotion MP4 render
local voiceover WAV generation
local music bed generation
visual QA frames for local MP4
Vids clip cache folder creation
cached Vids clip priority in local MP4 render
rejected Vids cache skip in local MP4 render
generated output archive folder creation
final MP4/report/workbook mirroring into tool folder
```

Latest strong local test:

```text
Tool: Child Photo Privacy Checker
Mode: Local MP4
Result: Passed
```

Latest generated local MP4:

```text
outputs/runs/professional-local-video-fixed-2026-08-19/local-render/child-photo-privacy-checker-local-reel.mp4
```

## Current Limitations

Google Vids:

```text
Google Vids does not provide a stable public API for full automated video creation.
Automation uses browser control, so Google UI changes can break it.
Free Google Vids accounts can hit generation limits.
If quota is over, use another logged-in profile or local MP4 fallback.
Scene clip download uses browser automation, not a public API. The agent saves each exported scene locally, caches it as `vids-clips/scene-XX.mp4`, and then performs the final merge locally.
```

Local MP4:

```text
Voiceover uses macOS `say`/`afconvert` on Mac and PowerShell speech synthesis on Windows when available.
It is good for free draft/usable content, but a premium human/AI voice can improve final quality.
ffmpeg is not installed on this machine, so some video frame extraction checks use Remotion frame rendering instead.
```

AI script quality:

```text
Without OPENAI_API_KEY, the system uses local fallback script generation.
With OPENAI_API_KEY, it can create stronger script rewrites.
```

## Troubleshooting

### Dashboard does not open

Run:

```bash
npm run ui
```

Open:

```text
http://127.0.0.1:4317
```

If port is busy, run with another port:

```bash
npm run ui -- --port 4320
```

### Google Vids opens old account

Use the desired profile explicitly:

```bash
npm run vids:login -- --profile work/ruvanshi.sahu-anslation.com-automation
```

Then run with that profile first:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --generate --max-scenes 7 --vids-profiles work/ruvanshi.sahu-anslation.com-automation
```

If Google opens a sign-in page, account chooser, or password screen, the operator now stops early and tells you which profile needs login again.

### Google Vids quota limit

In the dashboard, the profile card/dropdown will show `LIMIT USED` after a detected quota error. Pick another logged-in profile, or clear the manual marker after the account quota resets.

Use local MP4 mode:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only
```

or try a second profile:

```bash
--vids-profiles work/google-vids-profile-2
```

Use only accounts you control and follow Google Vids limits/terms.

### Final video is not Google Vids footage

Reason:

```text
Google Vids generation/export failed or quota was hit, so the agent created a local fallback MP4.
```

Fix:

```text
Use a profile with available quota.
Keep Use tool screenshots on.
Keep Screenshot scenes as 3,4,5,6.
If Google Vids opens only Drive/Photos and no local file chooser, check `ingredientUploads` in the report; the actual filled prompt will fall back to URL-based real-tool instructions.
Review Google Vids operator report in the output folder.
```

### Tool UI looks fake or wrong

Use screenshot ingredients:

```text
Use tool screenshots: on
Screenshot scenes: 3,4,5,6
```

This tells Google Vids to use real captured tool screens for demo/workflow/output/before-after scenes when the current Google Vids UI accepts them. Local MP4 mode always uses the captured screenshots and recordings directly.

## File Map

Main runner:

```text
src/run-one-video-agent.mjs
```

Dashboard server:

```text
src/ui-server.mjs
```

Dashboard UI:

```text
ui/index.html
ui/app.js
ui/styles.css
```

Capture logic:

```text
src/lib/capture.mjs
```

Script and prompt generation:

```text
src/lib/prompt-builder.mjs
src/lib/fallback.mjs
src/lib/vids-master-prompt.mjs
```

Google Vids browser automation:

```text
src/google-vids-login.mjs
src/google-vids-check.mjs
src/google-vids-operate.mjs
src/google-vids-export.mjs
```

Local video render:

```text
src/render-local-reel.mjs
src/lib/generated-archive.mjs
src/lib/vids-clip-cache.mjs
src/remotion/ReelScene.jsx
src/remotion/Root.jsx
src/remotion/index.jsx
```

Workbook update:

```text
src/update-prepared-workbook.mjs
src/lib/simple-xlsx-writer.mjs
src/lib/link-cells.mjs
```

Config:

```text
config/default.json
```

## Google Drive Sync

Use Google Drive Desktop for a free Drive upload workflow. Add the synced Drive folder in the dashboard `Drive sync folder` field or pass:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --drive-sync-dir "/Users/palsahu/Library/CloudStorage/GoogleDrive-YOUR_ACCOUNT/My Drive/Tool-Reel-Factory"
```

When the final MP4 exists, the agent copies the full tool folder and `final-video.mp4` into:

```text
<Drive sync folder>/<tool-slug>/
```

The workbook row is updated with Drive sync status, Drive video path/link, Drive folder path/link, and final video link. These are local synced Drive links. Google Drive Desktop uploads the files in the background. Public web share links need Drive sharing/API setup.

Default behavior is to write an enriched workbook copy in the run folder. To write the same links back into the original source Excel file, enable `Update source Excel after run` in the dashboard or pass `--update-source-workbook`. The agent creates a backup first under `outputs/runs/.../source-workbook-backups/`.

## AI Media Providers

The dashboard now has an AI + voice + avatar section.

Provider roles:

```text
LLM script:
- OpenAI: set OPENAI_API_KEY, choose openai, model gpt-5-mini or newer.
- Gemini: set GEMINI_API_KEY, choose gemini, model gemini-2.5-pro.

Natural voice:
- Local TTS: free fallback, but robotic.
- Edge TTS Free: install `edge-tts`, provider edge, voice `hi-IN-SwaraNeural`, `hi-IN-MadhurNeural`, `en-IN-NeerjaNeural`, or `en-IN-PrabhatNeural`.
- OpenAI TTS: set OPENAI_API_KEY, provider openai, model gpt-4o-mini-tts, voice verse/marin/cedar/etc.
- ElevenLabs: set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID, provider elevenlabs.

Avatar image/video:
- Add 1-3 own/consented image paths in Avatar images.
- Prompt pack mode creates avatar-generation folders for HeyGen, D-ID, Runway, Veo, and Pika.
- HeyGen API mode needs HEYGEN_API_KEY and HEYGEN_VOICE_ID.
```

Recommended reel structure:

```text
Scene 1: avatar hook clip if available.
Scene 2: avatar/tool intro.
Scene 3-5: real tool screenshots and recordings.
Scene 6: avatar CTA plus safety reminder.
```

Opening presenter style:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --hook-avatar female
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only --hook-avatar male
```

Commands:

```bash
python3 -m pip install edge-tts
npm run voiceover:generate -- --tool-dir outputs/runs/.../tool-folder --provider edge --voice hi-IN-SwaraNeural
npm run voiceover:generate -- --tool-dir outputs/runs/.../tool-folder --provider openai --voice verse
npm run voiceover:generate -- --tool-dir outputs/runs/.../tool-folder --provider elevenlabs --voice YOUR_ELEVENLABS_VOICE_ID
npm run avatar:generate -- --tool-dir outputs/runs/.../tool-folder --provider heygen --scenes 1,2,6 --voice-id YOUR_HEYGEN_VOICE_ID
```

Privacy/safety:

```text
Use only your own image/voice or media where you have clear permission.
Do not use real client/customer data in tool demos.
Final videos still need human review before posting.
```

## Suggested Next Improvements

Best next upgrades:

```text
1. Add a review screen in dashboard to preview scene script before video generation.
2. Add pause/resume persistence for queues after dashboard restart.
3. Add better AI voice provider option for fully automated natural voiceover. Current practical fix: `npm run voiceover:pack` creates scene scripts and the renderer auto-uses `voiceovers/scene-01.mp3`, `scene-02.mp3`, etc. before built-in TTS.
4. Add Google Drive API sharing to produce public web share links automatically.
5. Add automatic Instagram caption export per row.
6. Add manual approval step before spending Google Vids quota.
7. Add retry controls for only failed scenes.
8. Add thumbnail/cover image generator for every reel.
9. Improve quality scoring with deeper blank-frame detection, caption contrast checks, and audio loudness checks.
10. Add automatic scene splitting from cached full Google Vids exports when ffmpeg is installed.
```

## Bulk Script Improvement Prompt

Use this prompt for the next Excel sheet when you want all tool scripts improved into human, understandable 30-50 second viral Hinglish promo scripts:

```text
Mere paas ek Excel sheet hai jisme multiple tools ki details hain. Is sheet ke sabhi tools ke liye existing script ko improve/rewrite karo.

Excel file path:
{Excel_File_Path}

Base website:
https://www.altftool.com/

Goal:
Har tool ke liye Instagram Reel / YouTube Shorts ke liye 30 se 50 seconds ka human, understandable, viral-style Hinglish promotional script banana hai.

Rules:
- Original Excel file overwrite mat karna; new improved Excel output file banao.
- Har row ko usi row ke Tool Name / Idea Name, Tool URL / ROUTES, Short Description, Category, Target Market aur existing script ke basis par process karo.
- Agar existing script wrong/mismatched lage, structured row fields ko source of truth maan kar new script banao.
- Script boring ad jaisi nahi honi chahiye; user scroll roke, tool samjhe, save/share/comment kare.
- AltFTool ka mention har script, caption, and CTA me hona chahiye.
- Real use-case explain karo: open tool, input/demo data, run/action, result/review.
- Fake UI, fake feature, ya real personal data use mat karo.

Add columns:
Improved Script Type, Improved Duration Seconds, Improved Hook, Improved Body, Improved CTA, Improved Scene Breakdown, Improved Reel Script 30-50s, Improved On Screen Text, Improved Instagram Caption, Improved Hashtags, Improved AI Video Prompt, Improved Tool Use Flow, Improvement Notes.

Script format:
Hinglish, 30-50 seconds, Hook 0-5s, Body 5-30/40s, CTA last 5-10s. Scene breakdown 10-second scenes me do. Caption me tool name, benefit, AltFTool link, save/comment CTA, and 10-15 hashtags include karo.

Validation:
total rows processed, empty script count, duration range check, AltFTool mention check, and first 3 sample scripts show karo.
```

Local command:

```bash
node scripts/improve-altf400-scripts.mjs "{Excel_File_Path}" "outputs/script-improvements/improved-scripts-latest.xlsx"
```

The loader now prefers `Improved Reel Script 30-50s` over old `View Script` when importing an improved workbook.

## Recommended Way To Work

For daily production:

```text
1. Add/finish one tool in your website.
2. Add the tool row in Book1.xlsx.
3. Open dashboard.
4. Select the row.
5. First run Local MP4 mode.
6. Review video.
7. If you want Google Vids avatar style, run Google Vids mode.
8. Post only after final human review.
```

Best beginner command:

```bash
npm run agent:one-video -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --row 2 --limit 1 --local-only
```

Best dashboard setting:

```text
Mode: Local MP4
Row: 2
Max scenes: 7
Run
```

Best Google Vids setting:

```text
Mode: Google Vids
Avatar: auto
Avatar scenes: 1,2,7
Use tool screenshots: on
Screenshot scenes: 3,4,5,6
Fallback profile: on
Local fallback: on
```
