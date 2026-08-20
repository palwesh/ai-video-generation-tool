# Free Video Providers

This project creates a free/free-trial provider pack for every tool row.

Folder:

```text
free-video-providers/
```

Default providers:

```text
capcut,pika,runway,canva,did,shotstack
```

## Why This Exists

Google Vids quota can finish. These providers can still help create scene clips:

- CapCut: free/manual script-to-video and social editing flow.
- Pika: free monthly credits for AI clips.
- Runway: free starter credits for AI clips.
- Canva: limited AI video clips when your account supports them.
- D-ID: trial/avatar clips.
- Shotstack: free developer sandbox for cloud render/edit tests.

Most of these tools do not provide a fully free public API for unlimited automated generation, so the safe workflow is:

1. Agent prepares prompt folders automatically.
2. You generate/download a scene clip from the provider.
3. Put the clip in `vids-clips/scene-XX.mp4`.
4. Run Local MP4 mode.
5. Local render uses the provider clip first, then screenshots/recordings if no clip is found.

## Dashboard Mode

Use:

```text
Mode: Free Clip Pack
```

This creates scripts, screenshots, scene plans, and provider prompts without using Google Vids quota.

## CLI

All default providers:

```bash
npm run agent:one-video -- --input "/path/to/Book1.xlsx" --row 2 --limit 1 --prep-only --free-video-providers all
```

Only selected providers:

```bash
npm run agent:one-video -- --input "/path/to/Book1.xlsx" --row 2 --limit 1 --prep-only --free-video-providers capcut,pika,did
```

## Output Structure

```text
tool-folder/
  free-video-providers/
    README.md
    all-free-provider-prompts.csv
    free-video-provider-manifest.json
    capcut/
      README.md
      capcut-scene-prompts.csv
      scene-01/
        prompt.txt
        voiceover.txt
        caption.txt
        notes.md
    pika/
    runway/
    canva/
    did/
    shotstack/
  vids-clips/
    scene-01.mp4
    scene-02.mp4
```

## Important Rule

For final render reuse, save approved clips here:

```text
vids-clips/scene-01.mp4
vids-clips/scene-02.mp4
```

The local editor will automatically use those clips in the final Reel.
