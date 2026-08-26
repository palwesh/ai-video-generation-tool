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

Python install hona required nahi hai. Large Excel import ke time agar Windows me `python was not found` aaye, dashboard ab automatically Node fallback se workbook load karega.

Setup complete hone ke baad dashboard open hoga:

```text
http://127.0.0.1:4317
```

## 3. Daily Run

Setup complete hone ke baad normal use ke liye bas ye command chalao:

```powershell
.\run-windows.bat
```

Agar browser auto-open nahi chahiye:

```powershell
.\run-windows.bat -NoBrowser
```

Same Wi-Fi par other users ko access dena ho to server mode me run karo:

```powershell
.\run-windows.bat -Lan
```

Terminal me links wahi dikh jayenge:

```text
Local URL: http://127.0.0.1:4317
Same Wi-Fi URLs:
  http://192.168.1.25:4317
Docs: http://127.0.0.1:4317/docs.html
Vids Flow: http://127.0.0.1:4317/vids-flow.html
```

Other users ko `Same Wi-Fi URLs` wala link dena hai. Agar open nahi hota, Windows Firewall me port `4317` allow karo.

## 4. Excel File Ke Saath Run

Agar Excel file ka path pehle se set karna hai:

```powershell
.\setup-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

Ye path `.env` me save ho jayega. Baad me path change karna ho to:

```powershell
.\run-windows.bat -ExcelPath "C:\Users\YOUR_NAME\Documents\Book1.xlsx"
```

Dashboard open hone ke baad Excel input field me bhi path change kar sakte ho.

## Render Final Reel Fix

Agar Windows me `Render Final Reel` click karne par render start nahi hota ya terminal me `Remotion` / browser / dependency error aaye, project folder me PowerShell open karke ye run karo:

```powershell
.\setup-windows.bat -SkipStart
.\run-windows.bat
```

Ye Node/npm dependencies repair karega. Final renderer Windows par pehle local `node_modules\.bin\remotion.cmd` use karta hai, isliye setup ke baad naya PowerShell window open karke dashboard run karna best hai.

Direct render dependency check ke liye:

```powershell
Test-Path .\node_modules\.bin\remotion.cmd
npm run render:local -- --tool-dir "PASTE_TOOL_OUTPUT_FOLDER_HERE"
```

Dashboard ke right-side terminal me jo red error aaye, usko copy karke debug karo.

## 5. Dashboard Use

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

## 6. Google Vids Login

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

## 7. One Video Command

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

## 8. Output Kaha Milega

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

## 9. Common Problems

If dashboard open nahi hota:

```powershell
.\run-windows.bat
```

If port busy hai:

```powershell
.\run-windows.bat -Port 4320
```

If Google Vids limit used hai:

```text
Local MP4 mode use karo, ya another logged-in profile select karo.
```

If setup script block ho:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

## 10. Logo Aur Branding

ALTF logo project ke andar included hai:

```text
public\brand\altf-logo.png
ui\assets\altf-logo.png
```

Dashboard me top-left logo show hoga. Final Reel ke end card me bhi actual `Alt F` logo show hoga, initials badge nahi.

## 11. Best Workflow

Start simple:

1. Run `.\setup-windows.bat`.
2. Next time se `.\run-windows.bat` use karo.
3. Excel path set karo.
4. Row `2`, Limit `1`, Mode `Local MP4`.
5. Video check karo.
6. Google Vids profile login karo.
7. Vids Clips mode try karo jab quota available ho.

Is workflow me pehle free/local output confirm hota hai, phir avatar/Vids clips add karte hain.
