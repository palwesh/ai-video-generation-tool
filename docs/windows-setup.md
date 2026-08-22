# Windows Setup

Use this on a fresh Windows laptop after cloning or copying the project folder.

## One-Time Setup

Open PowerShell in the project folder and run:

```powershell
.\setup-windows.bat
```

The script checks or installs:

- Node.js LTS with Node 20+
- npm dependencies
- Git
- Google Chrome
- Playwright Chromium
- FFmpeg when available through winget
- `.env`
- local folders for `outputs/`, `work/`, and Remotion assets

Then it starts the dashboard:

```text
http://127.0.0.1:4317
```

## Daily Run

After setup is complete, use this command every time you want to start the dashboard:

```powershell
.\run-windows.bat
```

This reuses saved `.env` settings, Google Vids profile folders, installed dependencies, and generated output folders.

## With Your Excel Path

```powershell
.\setup-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

This path is saved into `.env` as `TRF_DEFAULT_INPUT`, so it stays as the dashboard default.

You can update the saved path during daily run too:

```powershell
.\run-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

## Choose Another Port

```powershell
.\setup-windows.bat -Port 4320
```

The chosen port is saved, so `.\run-windows.bat` will reuse it. To override later:

```powershell
.\run-windows.bat -Port 4317
```

## Install Only, Do Not Start Dashboard

```powershell
.\setup-windows.bat -SkipStart
```

Then start later:

```powershell
.\run-windows.bat
```

Advanced direct command:

```powershell
npm run ui -- --port 4317
```

## Google Drive Sync Folder

If you use Google Drive Desktop on Windows, pass your local Drive folder once:

```powershell
.\setup-windows.bat -DriveSyncDir "G:\My Drive\Tool-Reel-Factory"
```

Or update it during daily run:

```powershell
.\run-windows.bat -DriveSyncDir "G:\My Drive\Tool-Reel-Factory"
```

The folder is saved in `.env` as `TRF_DRIVE_SYNC_DIR`.

## Start Without Opening Browser

```powershell
.\run-windows.bat -NoBrowser
```

## Google Vids Login On Windows

Google profiles are local to each laptop. Login again on the Windows machine:

```powershell
npm run vids:login -- --profile work/google-vids-profile
```

For another account:

```powershell
npm run vids:login -- --profile work/google-vids-profile-2
```

Use only accounts you control and follow Google Vids limits.

## Free Local Video

No Google Vids quota:

```powershell
npm run agent:one-video -- --input "C:\Users\YOUR_NAME\Documents\Book1.xlsx" --row 2 --limit 1 --local-only
```

## Google Vids Scene Clips

When quota is available:

```powershell
npm run agent:one-video -- --input "C:\Users\YOUR_NAME\Documents\Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6 --vids-profiles work/google-vids-profile
```

The agent saves scene exports inside:

```text
vids-generated-scenes\scene-XX\
vids-clips\scene-XX.mp4
```

Then it merges the final Reel locally.

## Free Provider Clips

Without Google Vids quota, prepare prompt folders for free/free-trial tools:

```powershell
npm run agent:one-video -- --input "C:\Users\YOUR_NAME\Documents\Book1.xlsx" --row 2 --limit 1 --prep-only --free-video-providers all
```

This creates:

```text
free-video-providers\
```

Use CapCut, Pika, Runway, Canva, D-ID, or Shotstack prompts from that folder. After downloading a clip, put it here:

```text
vids-clips\scene-01.mp4
```

Then run Local MP4 mode; it will use cached provider clips first.

## Notes

- `setup-windows.bat` is for first-time setup or dependency repair.
- `run-windows.bat` is for normal daily use.
- ALTF logo is included in the repo at `public/brand/altf-logo.png` and `ui/assets/altf-logo.png`, so dashboard branding and final Reel end cards work on Windows too.
- Windows local voiceover uses PowerShell speech synthesis when available.
- For a free neural Hindi/Hinglish voice, install Edge TTS with `py -m pip install edge-tts`, then run `npm run voiceover:generate -- --tool-dir path\to\tool-folder --provider edge --voice hi-IN-SwaraNeural`.
- For a more natural final voice, run `npm run voiceover:pack -- --tool-dir path\to\tool-folder`, record `scene-01.mp3`, `scene-02.mp3`, etc. in the created `voiceovers` folder, then render with `--voiceover-dir path\to\tool-folder\voiceovers`.
- If API keys are configured, run `npm run voiceover:generate -- --tool-dir path\to\tool-folder --provider openai` or `--provider elevenlabs` to generate scene MP3 files automatically.
- To use your own avatar image, add its Windows path in the dashboard Avatar images field. The agent creates `avatar-references` and `avatar-generation` prompt folders.
- If PowerShell voiceover is unavailable, the render still works with captions and music.
- If Google Vids quota is finished, use Local MP4 mode.
- Do not commit `work/`, `outputs/`, `public/tool-reel-assets/`, `.env`, or generated media.
