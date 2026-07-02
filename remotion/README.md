# AI-Trader Remotion Video

A [Remotion](https://www.remotion.dev) project for editing a source video and
layering effects on top of it programmatically.

## Why no video is checked in

This sandbox's network policy blocks direct access to youtube.com, so the
source clip (`youtu.be/5SNMmxOg3xE`) couldn't be downloaded automatically here.
Add it yourself (see below) — video files are also git-ignored so the repo
stays small.

## Setup

```bash
cd remotion
npm install
```

Drop your video in as `remotion/public/input.mp4`. The composition reads its
real duration, fps, and resolution automatically, so no config changes are
needed.

## Preview

```bash
npm start
```

Opens Remotion Studio, where you can scrub through the timeline and tweak
effect parameters live.

## Render

```bash
npm run build
```

Outputs `remotion/out/main-video.mp4`.

## What's in the composition

`src/MainVideo.tsx` layers these effects over the footage (each one lives in
`src/effects/` and is a small, standalone component you can reorder, tweak, or
drop):

- **TitleCard** — spring-animated title card for the first 2 seconds.
- **ColorGrade** — CSS-filter based contrast/saturation/brightness grade.
- **KenBurns** — slow zoom + pan across the whole clip.
- **Glitch** — periodic RGB-channel-split + slice-displacement glitch bursts.
- **FilmGrain** — animated SVG turbulence noise, blended with `overlay`.
- **Vignette** — radial-gradient edge darkening.

Adjust intensities/timings by editing the props passed to each effect in
`MainVideo.tsx`.
