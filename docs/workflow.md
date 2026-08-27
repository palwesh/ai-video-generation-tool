# Automation Workflow

## V1 Pipeline

1. Read Excel or CSV rows.
2. Normalize each tool row.
3. Resolve AltF Tool relative routes with `https://www.altftool.com/` when needed.
4. Optionally open the tool URL with Playwright.
5. Capture desktop screenshot, full-page screenshot, fictional demo assets, real tool demo before/after screenshots, a desktop demo WebM recording, mobile screenshot, and a short mobile scroll WebM recording.
6. Generate or improve a compact Hinglish Hook-Body-CTA reel script.
7. Convert the script into 3-6 scenes of 10 seconds each; default is 6 scenes / 60 seconds.
8. Save Google Vids-ready scene prompts and `vids-generated-scenes/scene-XX/` folders.
9. Save post caption and hashtags.
10. Render or merge the final Reel, then create `reel-quality-report.json` with avatar hook, real demo proof, voiceover, captions, CTA, and duration checks.
11. Create an enriched workbook copy with output columns for asset paths, reel script files, Vids status, primary/fallback/active/tried Vids profiles, Drive sync status, Drive video/folder links, final MP4 path, QA status, quality score, and quality report.
12. Refresh `outputs/work-tracker/tool-work-tracker.xlsx` as the master tracker with one row per tool idea plus detail sheets for scripts, captions, hashtags, avatar clips, final videos, profiles, and quality reports.

## Basic Dashboard Flow

Use `http://127.0.0.1:4317` for the simplest one-video workflow.

For same Wi-Fi usage, run the dashboard from one main Windows/server machine with `.\run-windows.bat -Lan` and let other users open the printed Same Wi-Fi URL. Generated assets, videos, Google Vids downloads, tracker workbooks, and final reels are saved on the server machine, not on each user's laptop. Keep it on trusted private Wi-Fi only; add PIN/password protection before exposing it beyond your own network.

Runner agent shortcuts:

- `npm run agent -- --dashboard` starts the dashboard.
- `npm run agent -- --one --row 2 --mode local` creates one free/local Reel from the saved/default Excel.
- `npm run agent -- --queue --rows 2,3,4 --mode local --continue-on-error` runs selected rows one by one.
- `npm run agent -- --one --row 2 --mode google-hook --profiles work/shejal.sahu-anslation.com-profile` uses Google Vids only for the hook/avatar clip, then local merge.

- The dashboard opens in `Basic` mode and remembers the last Excel path, row, mode, avatar style, duration, Drive folder, and active tab.
- The Basic dashboard has separate tabs for `Tool Promotion`, `General Script Video`, and `Profiles`. The `Profiles` tab is global, so the same primary/fallback Google Vids accounts are used across every flow.
- `Vids Flow` is a separate focused page at `http://127.0.0.1:4317/vids-flow.html`, similar to `Open Version 1`. Use it when you want the Google Vids hook/avatar flow without the full Basic dashboard controls.
- The Basic page keeps docs separate at `http://127.0.0.1:4317/docs.html` so the workflow stays clean. The docs page supports selected-doc mode, all-docs mode, search, refresh, and section links.
- The `Tool idea name` dropdown now has compact filters: ready tools only, no video yet, and P0 priority. Rows with saved final videos show a video-ready tag and folder link directly in the list.
- `Credit Safe` is ON by default. In this mode Google Vids avatar/voiceover buttons are locked, and paid/API voice choices are switched back to free voice. Turn it off only when you intentionally want Google Vids generation; the dashboard asks you to type `VIDS` before starting any credit-spending action.
- `Low-credit Vids` is ON by default. When Credit Safe is OFF, avatar generation creates only the 10-second hook clip in Google Vids; the body and CTA are rendered locally from real tool screenshots/recordings, local voice, captions, and AltFTool branding. Turn it OFF only when you intentionally want the full hook/focus/CTA avatar pack.
- Campaign Run shows an estimated Google Vids clip count before starting, so you can see credit risk before running multiple rows.
- `Prepare Assets` runs the quota-free preparation stage: real website capture, asset brief, improved Hook-Body-CTA script, 3-6 scene plan, Google Vids prompts, free provider prompts, and workbook links.
- `Edit Script` opens the saved script in the dashboard. Update Hook, Body, CTA, caption, hashtags, or scene voiceover/on-screen text, then click `Save Update`; the saved script files are updated before avatar or final render.
- The script engine now scores hooks on clarity, curiosity, relatability, tool relevance, and length. The editor shows a hook score, tool-type template, and three selectable variants: Problem Hook, POV Hook, and Before/After Hook.
- If you select a hook variant or edit the hook manually, click `Save Update`; the saved script JSON/Markdown is re-scored and avatar/final render use the edited hook.
- The main `Edit Script` panel is the source of truth. If you edit Hook/Body/CTA there, the dashboard auto-saves those edits before avatar generation, Google Vids voiceover, Quick Preview, and Final Render. The avatar review panel stays synced from the main script unless you manually edit that avatar-specific panel after the main script edit.
- The selected `Tool idea name` row is also locked as the workflow source. Assets, script, avatar clips, Vids voiceover, and final render only reuse folders from the same selected row; changing the row clears old step outputs so one tool's content cannot leak into another tool's video.
- `Create Quality Reel` runs the recommended production path. If the mode is not a final-render mode, it switches to `Hook Vids + Local` automatically.
- The avatar photo control supports built-in female/male AltFTool presenters and a custom PNG/JPG/WebP upload. Uploaded photos are stored in `work/avatar-references/`, remembered in `work/ui-state.json`, passed to Google Vids prompts as a reference when possible, and used directly by the local final reel renderer.
- The saved default AltFTool female/male avatar images live in `public/avatar/`; if no custom image is selected, the presenter choice automatically uses the matching default image for prompt packs and Google Vids avatar prompts.
- `Vids size` lets Google Vids avatar clips use `Vertical 9:16`, `Landscape 16:9`, or `Square 1:1`. Keep `Vertical 9:16` for Instagram Reels; landscape/square are useful for general videos or reuse outside reels.
- If automation stops in the middle, select the same row again. The existing-work strip can reuse old assets/script/avatar, show when only an avatar prompt pack exists, jump directly to `Avatar Step` when avatar video generation failed, or jump to `Final Step` to render from saved assets.
- The Final Reel step includes a pre-render checklist for row, real assets, script, avatar, voice, profile readiness, and final QA. This checklist updates after loading old work, generating new assets/script/avatar, or changing profile/voice settings.
- Final render also has caption style presets: `Trending word pop`, `Clean SaaS`, and `Minimal bold`. Use Trending for Instagram retention, Clean SaaS for professional demos, and Minimal when the tool screenshot must stay very readable.
- After `Build Assets`, the dashboard shows an `Asset Quality` score with checks for live tool URL, readable page capture, fictional input demo, result/output capture, screen recording, and workflow notes. If page/result/readable assets are missing, recapture before rendering.
- `Quick Preview` in the Final Reel step creates a short 15-second local MP4 from saved hook/demo assets before the full render. It does not call Google Vids or paid/API voice providers, so it is safe for pacing and readability checks.
- `Generate Avatar Pack` prepares or generates Google Vids avatar clips. In `Low-credit Vids` mode this becomes `Generate Hook Only` and uses only Scene 1. In full mode it can generate Scene 1 hook, Scene 2 focus break, and the last-scene CTA.
- Avatar generation now has a `Review / Edit Avatar Script` step. Click prepare first, edit Hook / Focus / CTA lines, then generate; the edited lines are passed to Google Vids. If an avatar MP4 already exists, the dashboard asks for `REGEN` before creating another clip so accidental duplicates do not spend credits.
- Google Vids prompts now enforce the selected video size, first-2-second hooks, real AltFTool/tool proof, readable screen references, natural Hinglish voice, no fake UI, and clear CTA wording.
- `Hook Vids + Local` uses downloaded Vids clips when available, caches them under `vids-clips/scene-XX.mp4`, then merges the final MP4 locally with real tool screenshots/recordings, voiceover, captions, music, and CTA. With `Low-credit Vids` ON, this should normally spend only one Vids clip per reel.
- `Render Final Reel` can still run locally in `Credit Safe` mode even if no Google Vids profile is currently available. Profiles are required only when generating avatar or Google Vids voiceover clips.
- If Step 6 Google Vids Voiceover exists for the selected row, `Render Final Reel` uses that saved Vids voiceover first. Screenshot/demo body scenes are hard-locked to that full Vids voiceover track, so local/free per-scene TTS is not generated or mixed over the real tool footage.
- On the separate `Vids Flow` page, full `Render Final Reel` requires the saved Step 6 Google Vids voiceover. If it is missing, the run stops and asks you to generate Vids Voiceover first instead of silently using local/free voice.
- All downloaded avatar/focus/CTA clips render full-screen in the final Reel and do not get extra local captions, because Google Vids avatar clips can already contain their own captions/audio.
- Body voiceover is automatically split around avatar/focus/CTA clips, so extra narration does not play on top of avatar videos. If the final CTA is an avatar clip, the AltFTool brand end card is added only after the avatar clip fully finishes, not as an overlay on top of the avatar.
- Tool demo scenes keep the captured AltFTool screenshots and recordings as the full-screen proof layer. For readable screenshots, local captions switch to a smaller one-word lower strip and URLs are shortened in the caption layer so the real tool text stays visible.
- Body visuals are selected from the captured assets according to voiceover meaning: workflow lines show screen recording, output lines show result screenshots, before-after lines show comparison screens, and share/review lines show mobile or safety/result screens.
- Readable screenshots and demo recordings are captured in a portrait-friendly viewport and rendered near full screen, with smaller overlays so the tool UI remains visible behind the voiceover captions.
- Asset capture saves `desktop-demo-inputs.png` immediately after filling visible inputs with fictional demo values; local workflow/demo scenes prefer this screenshot before the result screen.
- Asset capture now saves a `toolUseGuide` in the asset manifest. Script/body scenes use it to explain what the tool does and how to use it: open the real link, show input/upload, click the visible action, then review the output.
- `Local MP4 Free` skips Google Vids quota entirely and creates the Reel locally from real assets and local generated presenter-style visuals.
- The Basic terminal is scrollable and mirrors the Advanced terminal logs.
- Use `Open Tracker Excel` or `Download Tracker` to get the latest master Excel. It regenerates before opening/downloading and keeps tool idea, tool link, hook/body/CTA, final script, captions, hashtags, SEO keywords, assets, avatar clips, final MP4s, Vids profile usage, and quality warnings in one workbook.

## LAN / Multi-User Operating Rules

Use these rules when a team is using the dashboard from the same Wi-Fi network.

- One computer should be the main server. All `outputs/`, `work/`, uploads, screenshots, voiceovers, Google Vids downloads, and final MP4s stay on that server.
- Client users should use the browser UI only. They download a final MP4/tracker when needed.
- Script review and row selection can be done by multiple users, but asset capture, Google Vids generation, voiceover export, and final rendering should run through a queue.
- Google Vids profiles should be locked while a job is using them. If profile 1 is busy or limit-used, the queue should try profile 2/3/4.
- Final render should usually be one job at a time on a laptop. On a stronger Windows desktop, use at most 2 local renders at a time.
- Use `Quick Preview` before full render to save time and avoid wasting Google Vids/API credits.
- Share the LAN URL only with trusted same Wi-Fi users. Do not expose it to public internet without authentication.
- If multiple users create videos for the same tool, keep every version. Timestamp output folders and the `Video Versions` sheet make old and new reels trackable.

## Bulk Script Improvement Prompt

Use this when a new Excel sheet has many tool ideas and you want every row's script rewritten into a better 30-50 second Reel script.

Prompt:

```text
Mere paas ek Excel sheet hai jisme multiple tools ki details hain. Is sheet ke sabhi tools ke liye existing script ko improve/rewrite karo.

Excel file path:
{Excel_File_Path}

Base website:
https://www.altftool.com/

Goal:
Har tool ke liye Instagram Reel / YouTube Shorts ke liye 30 se 50 seconds ka human, understandable, viral-style Hinglish promotional script banana hai.

Important:
- Original Excel file overwrite mat karna.
- Ek new improved Excel output file banao.
- Har row ko usi row ke Tool Name / Idea Name, Tool URL / ROUTES, Short Description, Category, Target Market aur existing script ke basis par process karo.
- Agar existing script wrong/mismatched lage, to structured row fields ko source of truth maan kar new script banao.
- Script boring ad jaisi nahi honi chahiye. Reel aisi ho ki user scroll rok de, tool samjhe, save/share/comment kare.
- AltFTool ka proper mention har script/caption/CTA me hona chahiye.
- Tool ka real use-case explain hona chahiye: open tool, input/demo data, run/action, result/review.
- Fake UI ya fake feature invent mat karna.
- Personal/real sensitive data use mat karna, only demo/fictional data.

Har row me ye new columns add karo:
1. Improved Script Type
2. Improved Duration Seconds
3. Improved Hook
4. Improved Body
5. Improved CTA
6. Improved Scene Breakdown
7. Improved Reel Script 30-50s
8. Improved On Screen Text
9. Improved Instagram Caption
10. Improved Hashtags
11. Improved AI Video Prompt
12. Improved Tool Use Flow
13. Improvement Notes

Script format:
- Language: Hinglish
- Duration: 30-50 seconds
- Structure:
  - Hook: 0-5 sec, strong scroll-stopping line
  - Body: 5-30/40 sec, tool ka problem-solution demo workflow
  - CTA: last 5-10 sec, "Try this on AltFTool, link caption me hai", "Save this", "Comment TOOL"
- Scene breakdown 10-second scenes me do.
- Caption me tool ka name, benefit, AltFTool link, save/comment CTA aur hashtags include karo.
- Hashtags 10-15 hon: #AltFTool, #AITools, #ProductivityHacks, #ToolDemo, #OnlineTools etc.

Output:
- New Excel file generate karo.
- Console me validation show karo:
  - total rows processed
  - improved script empty rows count
  - duration range check
  - AltFTool mention check
  - sample first 3 scripts
```

Current local command:

```bash
node scripts/improve-altf400-scripts.mjs "{Excel_File_Path}" "outputs/script-improvements/improved-scripts-latest.xlsx"
```

Important loader note:

```text
When an improved workbook has `Improved Reel Script 30-50s`, the dashboard uses that as the primary script before old `View Script`, so mismatched old scripts do not drive the reel.
```

## Work Tracker Excel

Run this any time:

```bash
npm run workbook:tracker
```

Output:

```text
outputs/work-tracker/tool-work-tracker.xlsx
```

Important sheets:

- `Work Tracker`: main row-by-row status sheet for every tool idea.
- `Post Copy`: Instagram caption, hashtags, hook, keywords, CTA, and tool link.
- `Generated Scripts`: full Hook-Body-CTA script, final reel script, scene voiceovers, on-screen text, and video prompts.
- `Generated Assets`: real screenshots/recordings and asset manifest links.
- `Hook Avatars`: hook/focus/CTA avatar clips, Google Vids URL, profile tried, and prompt files.
- `Video Versions`: all saved reels per tool, with version number, final MP4, folder, profile, source, and quality status. Re-rendering a tool creates a new timestamp folder; older videos are kept.
- `Video Runs`, `Video Files`, `Quality Reports`, `Profiles Limits`: run history, MP4 links, QA status, and profile/quota records.

## Saved Versions And Resume

- After selecting a tool row, the Basic dashboard checks old work for that row.
- The `Saved versions` dropdown shows old Assets, Scripts, Avatar packs, and Final Reel versions. Latest is listed first, older versions stay available.
- Select any saved version and click `Load Selected` to restore that step into the dashboard.
- After loading old assets or script, you can continue from Avatar Step, Vids Voiceover, or Final Render without regenerating earlier work.
- After loading an old avatar pack, the final renderer uses that hook/CTA/focus avatar clip unless you generate a newer one.
- After loading an old final video, the preview and final folder are restored, but you can still change profile selection and re-render to create a new video version.
- Use `Open Folder` to inspect the selected saved version files.
- Google Vids profile selection remains global. You can load old assets/script/avatar, choose a different primary/fallback profile, and generate only the missing avatar/voiceover/final step.

## General Script Video Flow

This flow is separate from the AltFTool promotion workflow. Use it when you already have a normal script and want a Google Vids avatar video from that script.

- Open the `General Script Video` tab on the Basic dashboard.
- Paste the script, choose title/topic, language, duration, presenter, Google Vids avatar, primary profile, and fallback profile.
- Click `Optimize Script` first. This is credit-safe and creates `outputs/script-videos/{title}_{timestamp}/` with `input-script.txt`, `optimized-script.md`, `scene-plan.json`, `manifest.json`, and Google Vids scene prompts.
- Turn `Credit Safe` off only when you are ready to spend Google Vids credits. The dashboard asks for `VIDS` before generation.
- Click `Generate in Google Vids`. It opens Google Vids with the selected browser profile and selected video size, generates 10-second avatar scenes, inserts them, exports the MP4, and saves `final_script_video.mp4` in the same folder.
- If the primary profile has login/quota issues, the fallback profile is tried automatically when enabled.

## Global Profiles

- Open the `Profiles` tab to add, login, rename, remove, refresh, and select Google Vids browser profiles.
- The selected primary/fallback profile is synced into Tool Promotion, Hook Avatar, Final Reel, batch automation, and General Script Video.
- Profile choices are saved in `work/ui-state.json` and mirrored into `work/google-vids-profiles.xlsx` with profile name, expected email/login ID, detected email, enabled/disabled, priority, status, and quota usage.
- Added but login-needed profiles can be selected for Primary, Fallback, and Campaign Run. Disabled or limit-used profiles stay blocked. When generation starts with a login-needed profile, Google Vids may stop on the login screen so you can sign in, then rerun the same step.
- The Profile Excel file can be opened from the Profiles tab. It is safe for email/profile metadata only; Google passwords are never stored by the app.
- The CLI runner reads the same registry when `--profiles` is not passed, and skips disabled or limit-used profiles before trying fallback accounts.

## Google Vids Reality

Google Vids supports prompt-based AI clips and MP4 download, but a stable public API for creating a full Vid from prompts is not clearly available. The current reliable plan is:

- Generate prompts automatically.
- Use a persistent browser profile logged in with the second email.
- Use Playwright browser automation to fill scene prompts in Google Vids.
- Attach captured tool screenshots as Ingredients on proof-heavy scenes when Google Vids exposes a selectable upload route.
- Submit, insert, and export one generated Google Vids scene at a time.
- Save each scene export under `vids-generated-scenes/scene-XX/` and cache it as `vids-clips/scene-XX.mp4`.
- Merge final MP4 locally from cached Vids scene clips plus real tool screenshots/recordings.
- Recommended hybrid option: generate short Google Vids avatar clips only where they improve retention: hook first, optional middle focus break, and CTA. Cache them as `vids-clips/scene-01.mp4`, `vids-clips/scene-02.mp4`, and the last scene clip, then let local rendering use real screenshots and demo recordings for the rest.
- Cached avatar/focus clips keep their own audio. Local voiceover is skipped on those scenes to avoid double voice.
- If `--drive-sync-dir` is provided, copy the final MP4 and tool folder into the Google Drive Desktop synced folder and write the Drive video/folder links into the workbook.

Tested browser automation status:

- Login/profile check works with `npm run vids:check`.
- Single-scene prompt fill works with `npm run vids:operate -- --scene 1`.
- Scene 1 generate + insert works with `--submit --insert`.
- Appending Scene 2 to an existing Vids file works with `--new-scene-first --skip-portrait`.
- Screenshot Ingredients are attempted and reported for Scene 3/4. If the current Google Vids UI opens only Drive/Photos and no local chooser, prompts fall back to URL-based real-tool instructions.
- AI Video panel recovery works after Ingredients and Avatar changes.
- Compact prompts are used in Google Vids, so each 10-second clip stays focused and easier to generate.
- Google sign-in/account-chooser pages fail fast with a clear login/profile error instead of silently filling the wrong page.
- MP4 export/download works with `npm run vids:export`.
- Free local 30-60 second MP4 rendering works with real screenshots/recording, captions, voiceover, music, and automated quality reporting.

## Future V2

- Google Sheets sync.
- Human review dashboard.
- Batch retry/resume for Google Vids scene generation.
- Auto-download MP4 from Drive when the Vids file ID is available.
