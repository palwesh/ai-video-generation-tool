# Multi-Agent Stack For Tool Reel Automation

This file describes the roles that can later become separate Workspace Agents, API workers, or queued jobs.

## 1. Intake Agent

Reads Excel/CSV rows and normalizes:

- tool name
- tool URL
- topic
- description
- existing script
- target user
- main benefit
- language

Output:

- normalized tool record
- missing field warnings

## 2. Website Capture Agent

Opens the actual tool URL with Playwright and captures:

- desktop screenshot
- mobile screenshot
- full-page screenshot
- short vertical WebM scroll recording
- visible page text summary

Rules:

- Use the real website only.
- Use fictional/demo data only.
- Do not bypass login, CAPTCHA, or paid access.

## 3. Reel Script Agent

Improves the raw script for:

- hook
- public engagement
- clear user problem
- practical value
- concise Hinglish voiceover
- safe claims

Rules:

- Do not invent features.
- Do not use fake proof.
- Keep it useful, not only promotional.

## 4. Scene Director Agent

Converts the script into:

- exactly 7 scenes
- exactly 10 seconds per scene
- 70 seconds total
- realistic visual direction
- on-screen text
- Google Vids prompt per scene

Scene 3 must reference the actual Tool URL.

## 5. Google Vids Operator Agent

Uses each scene prompt in Google Vids:

- open Google Vids with the second email profile
- set Portrait/Vertical 9:16
- generate each scene
- insert the clip into the Vid
- keep scene order correct

Current note:
This is prepared as a browser workflow because a stable public Google Vids creation API is not clearly available.

## 6. Export Manager Agent

Downloads final MP4:

- through Google Vids UI, or
- through Google Drive API `files.download` when file ID and access token are available

Output:

- ready-to-post MP4
- post caption
- hashtags
- source manifest

## 7. Human Review Agent

Final QA before posting:

- verify captions
- verify no private data
- verify no fake UI or unsupported claims
- verify brand/tool name and URL
- approve for Instagram Reel/Shorts publishing
