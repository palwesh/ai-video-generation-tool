# Windows Setup

Use this on a fresh Windows laptop after cloning or copying the project folder.

## One Command

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

## With Your Excel Path

```powershell
.\setup-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

## Choose Another Port

```powershell
.\setup-windows.bat -Port 4320
```

## Install Only, Do Not Start Dashboard

```powershell
.\setup-windows.bat -SkipStart
```

Then start later:

```powershell
npm run ui -- --port 4317
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

- Windows local voiceover uses PowerShell speech synthesis when available.
- If PowerShell voiceover is unavailable, the render still works with captions and music.
- If Google Vids quota is finished, use Local MP4 mode.
- Do not commit `work/`, `outputs/`, `public/tool-reel-assets/`, `.env`, or generated media.
