# Free Mode

Use free mode when you want the system to run without OpenAI API credits.

## What Works For Free

- Read Excel/CSV tool list.
- Visit public tool links.
- Capture screenshots.
- Capture short WebM scroll recording.
- Generate a basic Hinglish 7-scene reel plan.
- Generate Google Vids prompts.
- Generate post caption and hashtags.

## Command

```bash
npm run free:capture -- --input inputs/your-tools.xlsx
```

For the current AltF Tool workbook:

```bash
npm run prep:free:capture -- --input "/Users/palsahu/workplace/projects/n learn/Book1.xlsx" --limit 1
```

## Google Vids Account

Use the Google account that has Google Vids access:

```bash
npm run vids:login
```

Log in with your second email in the opened Chrome window.

## Limits

Google Vids access and AI generation limits depend on the Google account and plan. If the account does not show AI options inside Vids, the automation can still prepare prompts, screenshots, and scripts, but clips must be generated with whatever video tool is available in that account.

## Best Free Workflow

1. Put Excel file in `inputs/`.
2. Run `npm run free:capture -- --input inputs/your-tools.xlsx`.
3. Open each tool output folder.
4. Use `google-vids-prompts.csv` in Google Vids.
5. Generate 7 clips of 10 seconds each.
6. Merge/export/download from Google Vids.
