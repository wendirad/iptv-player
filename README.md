<div align="center">

# 📺 IPTV Player

**A modern, browser-based IPTV player for watching live TV streams**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

*Load your playlists, browse channels, and start watching—all in your browser*

[Quick Start](#-quick-start) • [Features](#-features) • [Usage](#-how-to-use) • [FAQ](#-faq)

</div>

---

## ✨ Features

### 🎬 Playback
- **HLS streaming** with adaptive quality support
- **Playback controls**: play/pause, next/previous channel, fullscreen
- **Progress tracking** with buffer visualization
- **Stream URL copying** for external players

### 📋 Playlist Management
- **Load from URL** or upload `.m3u`/`.m3u8` files
- **Auto-fallback** to bundled sample playlist
- **Playlist history** with quick access to recent lists
- **Rename playlists** for easy organization
- **Manual channel addition** per playlist

### 🔍 Browsing & Discovery
- **Search channels** by name
- **Group filtering** with multi-select categories
- **Pagination** for large playlists
- **Icons-only grid** mode for compact viewing
- **Channel grouping** by category

### ⚙️ Personalization
- **Autoplay** first channel on load
- **Resume last channel** on startup
- **Layout options**: side panel or bottom list
- **Customizable** channels per page (6-200)
- **Toggle details panel** visibility
- **Persistent settings** saved in browser storage

### 💾 Smart Memory
- Remembers your last playlist
- Saves last watched channel
- Stores manual channels per playlist
- Persists all preferences

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd iptv-player

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

---

## 📖 How to Use

### 1️⃣ **Load a Playlist**

**Option A: From URL**
- Paste your M3U/M3U8 playlist URL in the input field
- Click **"Load playlist"**
- If the URL fails, the sample playlist loads automatically

**Option B: Upload File**
- Click **"Upload .m3u"**
- Select your `.m3u` or `.m3u8` file
- The playlist loads instantly

### 2️⃣ **Browse Channels**

- **Search**: Type in the search box to filter by channel name
- **Filter by groups**: Click "Categories" to select specific groups
- **Navigate**: Use pagination controls to browse large lists
- **Grid view**: Toggle "Show icons only" in Settings for compact grid

### 3️⃣ **Watch Content**

- **Select channel**: Click any channel card to start playback
- **Controls**: 
  - ⏯️ Play/Pause button
  - ⏮️ Previous channel
  - ⏭️ Next channel
  - 📋 Copy stream URL
  - ⛶ Fullscreen mode

### 4️⃣ **Customize Experience**

Open **Settings** (⚙️ icon) to adjust:
- ✅ Autoplay first channel
- ✅ Resume last channel on start
- ✅ Load last playlist on start
- 📐 Layout: Side panel or Bottom list
- 👁️ Show/hide details panel
- 📊 Channels per page (6-200)
- 🎨 Icons-only mode

### 5️⃣ **Add Manual Channels**

- Enter channel name and stream URL
- Click **"Add"**
- Manual channels are saved per playlist source

---

## 💡 Tips & Tricks

> 💡 **Autoplay blocked?** Click play once and your preference will be remembered

> 📋 **Copy stream URL**: Use the copy button next to the progress bar to get the current stream link

> ⚡ **Quick resume**: Enable "Load last playlist" and "Resume last channel" to jump back in instantly

> 🎯 **Faster browsing**: Use icons-only mode for a compact grid view

> 🔄 **Reset everything**: Clear your browser's localStorage to start fresh

---

## ❓ FAQ

<details>
<summary><b>Does it include channels?</b></summary>

No. Only a small demo playlist is bundled to showcase the UI. You need to provide your own playlist URLs or files.
</details>

<details>
<summary><b>Where is my data stored?</b></summary>

All data (settings, playlists, favorites, last channel) is stored in your browser's `localStorage`. Clear your browser data to reset everything.
</details>

<details>
<summary><b>What video formats are supported?</b></summary>

HLS (`.m3u8`) streams are fully supported. Other formats depend on your browser's native video support.
</details>

<details>
<summary><b>Can I cast to Chromecast or AirPlay?</b></summary>

Not yet—casting support is planned for a future release. Check the roadmap below.
</details>

<details>
<summary><b>Does it work on mobile?</b></summary>

Yes! The player is fully responsive and works great on mobile devices and tablets.
</details>

<details>
<summary><b>Can I use it offline?</b></summary>

Once loaded, previously accessed playlists are cached, but you'll need an internet connection to load new playlists and stream content.
</details>

---

## 🗺️ Roadmap

- [ ] **Casting support** - Chromecast & AirPlay integration
- [ ] **EPG integration** - Rich electronic program guide overlay
- [ ] **DVR features** - Recording and catch-up functionality
- [ ] **PWA support** - Install as app, offline capabilities
- [ ] **Themes** - Dark/light mode and custom themes
- [ ] **Keyboard shortcuts** - Power user controls
- [ ] **Multi-audio tracks** - Language selection
- [ ] **Subtitles** - WebVTT and TTML support

---

## 🛠️ Development

### Available Scripts

```bash
npm start      # Run development server
npm run build  # Create production build
npm test       # Run test suite
```

### Project Structure

```
src/
├── components/     # React components
├── context/        # State management
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── App.js          # Main application
```

---

## ⚠️ Disclaimer

**This player does not host, provide, or endorse any IPTV streams.**

You are responsible for:
- The content you load and watch
- Complying with applicable laws and regulations
- Respecting content providers' terms of service
- Using legitimate streaming sources only

The player is a tool for viewing content—you must provide your own playlists and ensure you have the right to access the streams you load.

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

<div align="center">

**Made with ❤️ for IPTV enthusiasts**

[Report Bug](https://github.com/yourusername/iptv-player/issues) • [Request Feature](https://github.com/yourusername/iptv-player/issues) • [Contribute](https://github.com/yourusername/iptv-player/pulls)

</div>
