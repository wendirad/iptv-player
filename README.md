# IPTV Player React SPA

A modern, production-ready IPTV Web Player built with React and Material-UI. Supports M3U/M3U8 playlist loading, adaptive HLS/DASH playback, EPG timelines, channel grouping/favorites, and advanced interactive features. Designed for all devices (responsive), with a modular, scalable codebase ready for future enhancements (DRM, ads, recording, analytics, etc).

## Features
- M3U/M3U8 playlist import via URL or file
- Adaptive HLS.js and DASH.js playback (up to 8K)
- Video.js player controls (quality, speed, PiP, full/mini/theater mode)
- Channel grouping, search & favorites
- EPG timeline integration
- Multi-audio, subtitles/CC (WebVTT, TTML, 608/708, etc)
- Xtream Codes and Stalker API (extendable)
- Favorites & last-channel memory
- Modern, responsive Material-UI design

## Planned/Extendable
- Chromecast, AirPlay, catch-up/record, DRM, custom themes, remote/PWA, ads, and more!

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Installation
```bash
npm install
```

### Running The App
```bash
npm start
```
The app will launch at http://localhost:3000.

### Building For Production
```bash
npm run build
```

## Folder Structure
See the codebase for `/src/components` (player, playlist, channel list, EPG, etc), `/src/context` for state, `/src/utils` for parsers.

## Contribution & License
PRs/discussion welcome—the project is MIT licensed.

## Roadmap
See the Issues/Project boards for advanced features: DVR/recording, cast, DRM, ads, analytics...
