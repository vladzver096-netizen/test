# Reels — vertical short-video feed

A short-video viewing UI with vertical swipe navigation (TikTok / Instagram Reels), built in plain vanilla JavaScript, no frameworks or bundlers.

## Run

Opening directly via `file://` may not work because of the autoplay/CORS policy for `<video>`, so you need any local static server:

```bash
npx serve .
```

and open `http://localhost:3000/`.

## How it works

- The feed `#feed` is a container with `overflow-y: scroll` and `scroll-snap-type: y mandatory`. Each slide `.slide` takes up `100vh`/`100%` width and has `scroll-snap-align: start` — swiping works natively both on desktop (mouse wheel) and on mobile (touch swipe), without a single line of JS for the scrolling itself.
- `IntersectionObserver` tracks which slide is currently visible (60% visibility threshold) and makes it "active": starts playback of that video and pauses the rest.
- Lazy loading/unloading: a `<video>` gets its `src` only when the slide is near the active one (the active slide itself + one neighbour above/below). All other videos have no `src` at all (`preload="none"`, the `src` attribute is removed and `video.load()` is called), which saves memory and network/decoder resources — at most 3 video elements out of 11 stay "alive" at any moment.
- Tap/click on the video toggles play/pause; a ▶ icon appears over the video when paused.
- A seek bar at the bottom of each slide lets you scrub through the video.
- The volume control (top left) toggles mute/unmute and sets volume via a slider (muted by default — required by browser autoplay policies).
- Videos loop (`loop`), use `object-fit: contain` to preserve aspect ratio on any screen ratio.

## Structure

- `index.html` — markup (feed container + controls panel)
- `css/style.css` — layout based on scroll-snap, full-screen slides
- `js/app.js` — building slides from the file list in `video/`, IntersectionObserver, lazy loading/pause, volume, seeking
- `icons/` — SVG icons for the controls panel
- `video/` — source videos for the feed
