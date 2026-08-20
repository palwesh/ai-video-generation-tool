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
10. Create an enriched workbook copy with output columns for asset paths, reel script files, Vids status, Drive sync status, Drive video/folder links, final MP4 path, and QA.

## Google Vids Reality

Google Vids supports prompt-based AI clips and MP4 download, but a stable public API for creating a full Vid from prompts is not clearly available. The current reliable plan is:

- Generate prompts automatically.
- Use a persistent browser profile logged in with the second email.
- Use Playwright browser automation to fill scene prompts in Google Vids.
- Attach captured tool screenshots as Ingredients on proof-heavy scenes when Google Vids exposes a selectable upload route.
- Submit, insert, and export one generated Google Vids scene at a time.
- Save each scene export under `vids-generated-scenes/scene-XX/` and cache it as `vids-clips/scene-XX.mp4`.
- Merge final MP4 locally from cached Vids scene clips plus real tool screenshots/recordings.
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
- Free local 30-60 second MP4 rendering works with real screenshots/recording, captions, voiceover, and music.

## Future V2

- Google Sheets sync.
- Human review dashboard.
- Batch retry/resume for Google Vids scene generation.
- Auto-download MP4 from Drive when the Vids file ID is available.
