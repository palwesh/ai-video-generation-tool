# Windows Run Guide

Ye file Windows laptop par project run karne ke liye simple step-by-step guide hai.

## 1. Project Download

Windows laptop par Git install ho to PowerShell me run karo:

```powershell
git clone https://github.com/palwesh/ai-video-generation-tool.git
cd ai-video-generation-tool
```

Agar zip download kiya hai, to zip extract karo, phir extracted folder me PowerShell open karo.

## 2. One Command Setup

Fresh Windows laptop par ye command run karo:

```powershell
.\setup-windows.bat
```

Ye script automatically check/install karega:

- Node.js 20+
- npm packages
- Git
- Google Chrome
- Playwright Chromium
- FFmpeg, agar winget se available hua
- `.env`
- `outputs/`, `work/`, aur render folders

Setup complete hone ke baad dashboard open hoga:

```text
http://127.0.0.1:4317
```

## 3. Excel File Ke Saath Run

Agar Excel file ka path pehle se set karna hai:

```powershell
.\setup-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

Dashboard open hone ke baad Excel input field me bhi path change kar sakte ho.

## 4. Dashboard Use

Dashboard URL:

```text
http://127.0.0.1:4317
```

Recommended first run:

```text
Mode: Local MP4
Row: 2
Limit: 1
Scenes: 6
```

Local MP4 mode free hai. Isme Google Vids quota use nahi hota.

Google Vids quota ke bina provider prompts chahiye to:

```text
Mode: Free Clip Pack
```

Ye CapCut, Pika, Runway, Canva, D-ID, aur Shotstack ke scene prompts `free-video-providers\` me save karta hai.

## 5. Google Vids Login

Google Vids/avatar clips chahiye to Windows laptop par profile login karna padega:

```powershell
npm run vids:login -- --profile work/google-vids-profile
```

Browser me Google login complete karo. Phir dashboard me `Refresh` click karo.

Second account ke liye:

```powershell
npm run vids:login -- --profile work/google-vids-profile-2
```

Use only accounts you control and Google Vids limits follow karo.

## 6. One Video Command

Free local video:

```powershell
npm run agent:one-video -- --input "C:\Users\YOUR_NAME\Documents\Book1.xlsx" --row 2 --limit 1 --local-only
```

Google Vids scene clips plus local merge:

```powershell
npm run agent:one-video -- --input "C:\Users\YOUR_NAME\Documents\Book1.xlsx" --row 2 --limit 1 --generate --scene-count 6 --max-scenes 6 --vids-profiles work/google-vids-profile
```

Free provider prompt pack:

```powershell
npm run agent:one-video -- --input "C:\Users\YOUR_NAME\Documents\Book1.xlsx" --row 2 --limit 1 --prep-only --free-video-providers all
```

## 7. Output Kaha Milega

Final videos aur assets yaha save honge:

```text
outputs\runs\
```

Har tool folder ke andar important files:

```text
reel-script.md
scene-plan.json
post-copy.md
screenshots\
recordings\
vids-generated-scenes\
free-video-providers\
vids-clips\
generated\
```

Final MP4 usually `generated\local-render\` ke andar milega.

## 8. Common Problems

If dashboard open nahi hota:

```powershell
npm run ui -- --port 4317
```

If port busy hai:

```powershell
npm run ui -- --port 4320
```

If Google Vids limit used hai:

```text
Local MP4 mode use karo, ya another logged-in profile select karo.
```

If setup script block ho:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

## 9. Best Workflow

Start simple:

1. Run `.\setup-windows.bat`.
2. Dashboard open karo.
3. Excel path set karo.
4. Row `2`, Limit `1`, Mode `Local MP4`.
5. Video check karo.
6. Google Vids profile login karo.
7. Vids Clips mode try karo jab quota available ho.

Is workflow me pehle free/local output confirm hota hai, phir avatar/Vids clips add karte hain.
