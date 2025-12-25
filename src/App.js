import React from "react";
import Hls from "hls.js";
import { parseM3U } from "./utils/m3uParser";
import { groupBy } from "./utils/groupBy";

const STORAGE_KEY = "iptv-player:last-url";
const SETTINGS_KEY = "iptv-player:settings";
const PLAYLISTS_KEY = "iptv-player-playlists";
const EXTRAS_KEY = "iptv-player-extras";
const LAST_CHANNEL_KEY = "iptv-player-last-channel";
const MAX_HISTORY = 10;
const DEFAULT_PLAYLIST_URL = "https://iptv-org.github.io/iptv/index.m3u";
const FALLBACK_LOGO = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop stop-color='%2323b9ff' offset='0%'/><stop stop-color='%235a38ff' offset='100%'/></linearGradient></defs><rect width='96' height='96' rx='18' fill='%23142030'/><rect x='8' y='8' width='80' height='80' rx='16' fill='url(%23g)' opacity='0.28'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-size='26' fill='%23e8f7ff' font-weight='700'>TV</text></svg>`;
const PAGE_SIZE = 32;

const SAMPLE_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="sintel.demo" tvg-logo="https://i.imgur.com/1xm4ZtL.jpg" group-title="Featured",Sintel Demo
https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8
#EXTINF:-1 tvg-id="bbb.demo" tvg-logo="https://storage.googleapis.com/shaka-demo-assets/bbb-dark.png" group-title="Featured",Big Buck Bunny
https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8
#EXTINF:-1 tvg-id="angel.demo" tvg-logo="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/poster.png" group-title="Featured",Angel One
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8
`;

const readSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const readPlaylists = () => {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readExtras = () => {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export default function App() {
  const videoRef = React.useRef(null);
  const playerShellRef = React.useRef(null);
  const hlsRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const initialSettings = React.useMemo(() => readSettings(), []);
  const initialPlaylists = React.useMemo(() => readPlaylists(), []);
  const initialExtras = React.useMemo(() => readExtras(), []);

  const [playlistUrl, setPlaylistUrl] = React.useState(DEFAULT_PLAYLIST_URL);
  const [playlistMeta, setPlaylistMeta] = React.useState({ name: "IPTV playlist", source: "Remote" });
  const [channels, setChannels] = React.useState([]);
  const [groupFilter, setGroupFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const [currentChannel, setCurrentChannel] = React.useState(null);
  const [playing, setPlaying] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [viewMode, setViewMode] = React.useState("side"); // 'side' or 'bottom'
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const [editingName, setEditingName] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [selectedGroups, setSelectedGroups] = React.useState([]);
  const [showGroupFilter, setShowGroupFilter] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [streamLoading, setStreamLoading] = React.useState(false);
  const [autoplay, setAutoplay] = React.useState(initialSettings.autoplay ?? true);
  const [playlists, setPlaylists] = React.useState(initialPlaylists);
  const [showUrlSuggestions, setShowUrlSuggestions] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [perPage, setPerPage] = React.useState(initialSettings.perPage || PAGE_SIZE);
  const [playerError, setPlayerError] = React.useState("");
  const [loadLastOnStart, setLoadLastOnStart] = React.useState(initialSettings.loadLastOnStart ?? false);
  const [resumeLastChannel, setResumeLastChannel] = React.useState(initialSettings.resumeLastChannel ?? false);
  const initialLoadRef = React.useRef(false);
  const loadedLastThisSessionRef = React.useRef(false);
  const [showIconsOnly, setShowIconsOnly] = React.useState(initialSettings.showIconsOnly ?? false);
  const [progress, setProgress] = React.useState({ time: 0, duration: 0, buffered: 0 });
  const [extrasMap, setExtrasMap] = React.useState(initialExtras);
  const [manualName, setManualName] = React.useState("");
  const [manualUrl, setManualUrl] = React.useState("");
  const [groupSearch, setGroupSearch] = React.useState("");
  const [showDisclaimer, setShowDisclaimer] = React.useState(true);
  const [volume, setVolume] = React.useState(() => {
    try {
      const stored = localStorage.getItem("iptv-player:volume");
      return stored ? parseFloat(stored) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [isMuted, setIsMuted] = React.useState(false);
  const formatTime = (t = 0) => {
    if (!t || Number.isNaN(t) || !isFinite(t)) return "0:00";
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const upsertPlaylistMeta = React.useCallback((url, name) => {
    if (!url) return;
    setPlaylists((prev) => {
      const existing = prev.find((p) => p.url === url);
      const now = Date.now();
      const nextEntry = existing
        ? { ...existing, name: name || existing.name || url, updatedAt: now, lastAccessed: now }
        : { url, name: name || url, createdAt: now, updatedAt: now, lastAccessed: now };
      const filtered = prev.filter((p) => p.url !== url);
      const next = [nextEntry, ...filtered]
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
        .slice(0, 50);
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const persistExtras = React.useCallback((nextMap) => {
    setExtrasMap(nextMap);
    localStorage.setItem(EXTRAS_KEY, JSON.stringify(nextMap));
  }, []);

  const setPlaylistFromParsed = React.useCallback(
    (parsed, meta, opts = {}) => {
      const sourceKey = meta?.source || meta?.name || "";
      let finalName = meta?.name || sourceKey || "Playlist";
      if (sourceKey) {
        const existing = playlists.find((p) => p.url === sourceKey);
        finalName = opts.fallbackName || meta.name || existing?.name || sourceKey;
        upsertPlaylistMeta(sourceKey, finalName);
        setPlaylistMeta({ name: finalName, source: sourceKey });
      } else {
        setPlaylistMeta(meta);
      }

      // merge extras for this source
      let merged = parsed;
      if (sourceKey && extrasMap[sourceKey]?.length) {
        const offset = parsed.length;
        const extraWithIndex = extrasMap[sourceKey].map((ch, idx) => ({ ...ch, index: offset + idx }));
        merged = [...parsed, ...extraWithIndex];
      }

      setChannels(merged);
      setGroupFilter("All");
      setSearch("");
      setPlayerError("");

      let nextChannel = parsed[0] || null;
      if (opts.preferredUrl) {
        const found = parsed.find((c) => c.url === opts.preferredUrl);
        if (found) nextChannel = found;
      }

      setCurrentChannel(nextChannel);
      setPlaying(autoplay && Boolean(nextChannel));
      setError(parsed.length ? "" : "Playlist has no playable channels.");
    },
    [autoplay, playlists, upsertPlaylistMeta]
  );

  const loadFallbackSample = React.useCallback(() => {
    const parsed = parseM3U(SAMPLE_M3U);
    setPlaylistFromParsed(parsed, { name: "Included playlist", source: "Local sample" });
  }, [setPlaylistFromParsed]);

  const loadPlaylistFromUrl = React.useCallback(async (url, silent = false, options = {}) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a playlist URL first.");
      return;
    }
    setLoading(true);
    setStatus("Fetching playlist...");
    setError("");
    try {
      const res = await fetch(trimmed);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const text = await res.text();
      const parsed = parseM3U(text);
      let host = options.fallbackName || "Remote playlist";
      try {
        host = new URL(trimmed).hostname || host;
      } catch (_) {}
      const nameFromStore = playlists.find((p) => p.url === trimmed)?.name;
      const nameForHistory = options.fallbackName || nameFromStore || host;
      setPlaylistFromParsed(parsed, { name: nameForHistory, source: trimmed }, options);
      localStorage.setItem(STORAGE_KEY, trimmed);
      upsertPlaylistMeta(trimmed, nameForHistory);
    } catch (err) {
      setError(err.message || "Unable to load playlist.");
      if (!silent) {
        setStatus("Falling back to included playlist");
        loadFallbackSample();
      } else {
        setStatus("");
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  }, [setPlaylistFromParsed, loadFallbackSample, upsertPlaylistMeta]);

  const handleFileLoad = React.useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setStatus("Reading playlist file...");
    setError("");
    try {
      const text = await file.text();
      const parsed = parseM3U(text);
      setPlaylistFromParsed(parsed, { name: file.name, source: file.name });
      localStorage.removeItem(STORAGE_KEY);
      upsertPlaylistMeta(file.name, file.name);
    } catch (err) {
      setError(err.message || "Unable to read playlist file.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }, [setPlaylistFromParsed, upsertPlaylistMeta]);

  React.useEffect(() => {
    if (initialLoadRef.current) return;
    // Load settings
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (typeof parsed.autoplay === "boolean") setAutoplay(parsed.autoplay);
        if (parsed.viewMode) setViewMode(parsed.viewMode);
        if (typeof parsed.sidebarVisible === "boolean") setSidebarVisible(parsed.sidebarVisible);
        if (parsed.perPage) setPerPage(parsed.perPage);
        if (typeof parsed.showIconsOnly === "boolean") setShowIconsOnly(parsed.showIconsOnly);
          setLoadLastOnStart(parsed.loadLastOnStart);
          
        if (typeof parsed.resumeLastChannel === "boolean") setResumeLastChannel(parsed.resumeLastChannel);
      } catch (_) {
        console.log('error parsing settings', _);
      }
    }

    // Load playlists
    const storedPlaylists = localStorage.getItem(PLAYLISTS_KEY);
    if (storedPlaylists) {
      try {
        const parsedList = JSON.parse(storedPlaylists);
        if (Array.isArray(parsedList)) setPlaylists(parsedList);
      } catch (_) {}
    }
    // Load extras
    const storedExtras = localStorage.getItem(EXTRAS_KEY);
    if (storedExtras) {
      try {
        const parsed = JSON.parse(storedExtras);
        if (parsed && typeof parsed === "object") setExtrasMap(parsed);
      } catch (_) {}
    }
    initialLoadRef.current = true;
    // Start with last playlist if opted-in, else built-in sample
    const lastUrlFromList = loadLastOnStart && Array.isArray(playlists) && playlists.length ? playlists[0].url : null;
    const lastNameFromList = loadLastOnStart && Array.isArray(playlists) && playlists.length ? playlists[0].name : null;
    const lastUrl = lastUrlFromList || localStorage.getItem(STORAGE_KEY);

    if (loadLastOnStart &&lastUrl) {
      setPlaylistUrl(lastUrl);
      const lastChannel = localStorage.getItem(LAST_CHANNEL_KEY);
      const preferredUrl = resumeLastChannel && lastChannel ? JSON.parse(lastChannel)?.url : undefined;
      loadPlaylistFromUrl(lastUrl, false, { preferredUrl, fallbackName: lastNameFromList || undefined });
      loadedLastThisSessionRef.current = true;
    } else {
      setPlaylistUrl(DEFAULT_PLAYLIST_URL);
      loadFallbackSample();
    }
  }, [loadFallbackSample, loadLastOnStart, resumeLastChannel, loadPlaylistFromUrl, playlists]);

  React.useEffect(() => {
    if (!initialLoadRef.current) return;
    if (!loadLastOnStart) return;
    if (loadedLastThisSessionRef.current) return;
    const lastUrl = Array.isArray(playlists) && playlists.length ? playlists[0].url : localStorage.getItem(STORAGE_KEY);
    if (!lastUrl) return;
    const lastName = Array.isArray(playlists) && playlists.length ? playlists[0].name : undefined;
    const lastChannel = localStorage.getItem(LAST_CHANNEL_KEY);
    const preferredUrl = resumeLastChannel && lastChannel ? JSON.parse(lastChannel)?.url : undefined;
    loadedLastThisSessionRef.current = true;
    setPlaylistUrl(lastUrl);
    loadPlaylistFromUrl(lastUrl, false, { preferredUrl, fallbackName: lastName });
  }, [loadLastOnStart, playlists, resumeLastChannel, loadPlaylistFromUrl]);

  React.useEffect(() => {
    if (!initialLoadRef.current) return;
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ autoplay, viewMode, sidebarVisible, perPage, loadLastOnStart, resumeLastChannel, showIconsOnly })
    );
  }, [autoplay, viewMode, sidebarVisible, perPage, loadLastOnStart, resumeLastChannel, showIconsOnly]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!currentChannel || !video) return;
    if (resumeLastChannel) {
      localStorage.setItem(LAST_CHANNEL_KEY, JSON.stringify({ url: currentChannel.url, name: currentChannel.name }));
    }
      setStreamLoading(true);
    setPlayerError("");
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const src = currentChannel.url;
    const canNativeHls = video.canPlayType && video.canPlayType("application/vnd.apple.mpegurl");
    if (src && src.includes(".m3u8") && Hls.isSupported() && !canNativeHls) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) {
          setError("Playback error. Try another channel.");
          setStreamLoading(false);
          setPlayerError("Stream failed to load. Try another channel.");
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => setStreamLoading(false));
    } else {
      video.src = src;
      video.load();
    }
    const attemptPlay = async () => {
      try {
        if (autoplay) {
          await video.play();
          setPlaying(true);
        } else {
          setPlaying(false);
          setStreamLoading(false);
        }
      } catch {
        setPlaying(false);
        setStreamLoading(false);
        setStatus("Autoplay was blocked. Click play to start.");
      }
    };
    attemptPlay();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel, autoplay]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateProgress = () => {
      const rawDuration = video.duration;
      const duration = rawDuration && isFinite(rawDuration) ? rawDuration : 0;
      const time = video.currentTime || 0;
      let buffered = 0;
      try {
        if (video.buffered && video.buffered.length) {
          buffered = video.buffered.end(video.buffered.length - 1);
        }
      } catch (_) {}
      if (!duration || !isFinite(duration)) {
        setProgress({ time, duration: 0, buffered: 0 });
      } else {
        setProgress({ time, duration, buffered });
      }
    };
    const onCanPlay = () => {
      setStreamLoading(false);
      updateProgress();
    };
    const onPlaying = () => {
      setPlayerError("");
      setStatus("");
      setStreamLoading(false);
      updateProgress();
    };
    const onPause = () => {
      setStreamLoading(false);
      updateProgress();
    };
    const onEnded = () => {
      setStreamLoading(false);
      updateProgress();
    };
    const onError = () => {
      setStreamLoading(false);
      setPlayerError("Stream failed to play. Try another channel.");
    };
    const onTime = () => updateProgress();
    const onProgressEv = () => updateProgress();
    const onLoaded = () => updateProgress();

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("progress", onProgressEv);
    video.addEventListener("loadedmetadata", onLoaded);

    if (playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("progress", onProgressEv);
      video.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [playing]);

  React.useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    const el = playerShellRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Close settings on outside click
  const settingsRef = React.useRef(null);
  React.useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  const groupedChannels = React.useMemo(() => groupBy(channels), [channels]);
  const groupNames = React.useMemo(
    () => Object.keys(groupedChannels).sort((a, b) => a.localeCompare(b)),
    [groupedChannels]
  );
  const filteredGroupNames = React.useMemo(() => {
    if (!groupSearch.trim()) return groupNames;
    const term = groupSearch.toLowerCase();
    return groupNames.filter((g) => g.toLowerCase().includes(term));
  }, [groupSearch, groupNames]);

  const filteredChannels = React.useMemo(() => {
    let list = channels;
    if (selectedGroups.length) {
      const set = new Set(selectedGroups);
      list = list.filter((ch) => set.has(ch.group));
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((ch) => (ch.name || "").toLowerCase().includes(term));
    }
    return list;
  }, [channels, selectedGroups, search]);

  React.useEffect(() => {
    setPage(1);
  }, [search, selectedGroups, channels.length]);

  React.useEffect(() => {
    setPage((p) => {
      const next = Math.min(Math.max(1, p), Math.max(1, Math.ceil(filteredChannels.length / perPage)));
      return next;
    });
  }, [filteredChannels.length, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / perPage));
  const paginatedChannels = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredChannels.slice(start, start + perPage);
  }, [filteredChannels, page, perPage]);

  const handleNext = React.useCallback(() => {
    if (!filteredChannels.length || !currentChannel) return;
    const idx = filteredChannels.findIndex((ch) => ch.url === currentChannel.url && ch.index === currentChannel.index);
    const next = filteredChannels[(idx + 1) % filteredChannels.length];
    setStreamLoading(true);
    setPlayerError("");
    setCurrentChannel(next);
  }, [filteredChannels, currentChannel]);

  const handlePrev = React.useCallback(() => {
    if (!filteredChannels.length || !currentChannel) return;
    const idx = filteredChannels.findIndex((ch) => ch.url === currentChannel.url && ch.index === currentChannel.index);
    const prev = filteredChannels[(idx - 1 + filteredChannels.length) % filteredChannels.length];
    setStreamLoading(true);
    setPlayerError("");
    setCurrentChannel(prev);
  }, [filteredChannels, currentChannel]);

  const handleSelectChannel = React.useCallback(
    (ch) => {
      setStreamLoading(true);
      setPlayerError("");
      setPlaying(autoplay);
      setCurrentChannel(ch);
    },
    [autoplay]
  );

  const renderChannelCard = (ch, compact = false) => {
    const active = currentChannel && ch.url === currentChannel.url && ch.index === currentChannel.index;
    if (showIconsOnly) {
      return (
        <button
          key={`${ch.index}-${ch.url}`}
          onClick={() => handleSelectChannel(ch)}
          className={`relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-2 flex flex-col items-center justify-center hover:border-cyan-300/50 transition-colors min-w-[72px] ${
            active ? "ring-2 ring-cyan-300/70" : ""
          }`}
          title={`${ch.name || "Channel"} • ${ch.group || "Uncategorized"}`}
        >
          <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
            <img
              src={ch.logo || FALLBACK_LOGO}
              alt={ch.name || "Channel"}
              className="w-full h-full object-contain"
              onError={(e) => {
                if (e.target.dataset.fallback) return;
                e.target.dataset.fallback = "1";
                e.target.src = FALLBACK_LOGO;
              }}
            />
          </div>
          <div className="mt-1 text-[11px] text-white/80 truncate max-w-[90px] text-center leading-tight">
            {ch.name?.trim() || "Channel"}
          </div>
        </button>
      );
    }
    return (
      <button
        key={`${ch.index}-${ch.url}`}
        onClick={() => handleSelectChannel(ch)}
        className={`relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-300/50 transition-all text-left ${
          active ? "ring-2 ring-cyan-300/70 shadow-[0_10px_30px_-18px_rgba(0,255,255,0.4)]" : "shadow-[0_8px_24px_-18px_rgba(0,0,0,0.6)]"
        } ${compact ? "w-full" : ""}`}
      >
        <div className="flex gap-3 p-3 items-center">
          <div className="h-12 w-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={ch.logo || FALLBACK_LOGO}
              alt={ch.name || "Channel"}
              className="w-full h-full object-contain"
              onError={(e) => {
                if (e.target.dataset.fallback) return;
                e.target.dataset.fallback = "1";
                e.target.src = FALLBACK_LOGO;
              }}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="font-semibold leading-tight truncate text-white">
              {ch.name?.trim() || "Channel"}
            </div>
            <div className="text-xs text-cyan-100/80 truncate">
              {ch.group?.trim() || "Uncategorized"}
            </div>
          </div>
        </div>
      </button>
    );
  };

  const infoPanel = (
    <aside className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-lg flex flex-col gap-4 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.8)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Playlist</div>
          <div className="flex items-center gap-2 mt-1">
            {editingName ? (
              <input
                autoFocus
                defaultValue={playlistMeta.name}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  const nextName = val || playlistMeta.name;
                  setPlaylistMeta((prev) => ({ ...prev, name: nextName }));
                  if (playlistMeta.source) {
                    upsertPlaylistMeta(playlistMeta.source, nextName);
                  }
                  setEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    e.currentTarget.value = playlistMeta.name;
                  }
                }}
                className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-sm text-white w-full outline-none"
              />
            ) : (
              <>
                <div className="text-lg font-semibold truncate">{playlistMeta.name}</div>
                <button
                  onClick={() => setEditingName(true)}
                  className="h-8 w-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:border-cyan-300/50"
                  title="Rename playlist"
                >
                  ✎
                </button>
              </>
            )}
          </div>
          <div className="text-xs text-white/60 mt-1 truncate">{playlistMeta.source}</div>
        </div>
        <div className="text-[11px] bg-cyan-500/20 text-cyan-100 border border-cyan-400/30 px-3 py-1 rounded-full whitespace-nowrap">
          {channels.length} channels
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cyan-200">
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.5 14.5 5 5m-8.5-2A6.5 6.5 0 1 1 16 8.5 6.5 6.5 0 0 1 11 17.5Z"
            />
          </svg>
          <input
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/50"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowGroupFilter((v) => !v)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:border-cyan-300/60 transition-colors w-full text-left flex items-center justify-between shadow-[0_6px_20px_-12px_rgba(0,0,0,0.6)]"
          >
            <span className="text-white/80">Categories</span>
            <span className="text-[11px] text-white/60">
              {selectedGroups.length ? `${selectedGroups.length} selected` : "All"}
            </span>
          </button>
          {showGroupFilter && (
            <div className="absolute mt-2 z-30 w-full rounded-2xl border border-white/12 bg-[#0d1725] shadow-[0_16px_50px_-22px_rgba(0,0,0,0.85)] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 text-xs text-white/70 bg-white/3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-200" viewBox="0 0 24 24" fill="none">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.5 14.5 5 5m-8.5-2A6.5 6.5 0 1 1 16 8.5 6.5 6.5 0 0 1 11 17.5Z"
                  />
                </svg>
                <input
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50"
                  placeholder="Search categories..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                />
                <button
                  className="text-cyan-200 hover:text-white text-[11px]"
                  onClick={() => setSelectedGroups([])}
                >
                  Clear
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredGroupNames.length === 0 && (
                  <div className="text-xs text-white/60 px-4 py-3">No groups detected</div>
                )}
                {filteredGroupNames.map((g) => {
                  const count = groupedChannels[g]?.length || 0;
                  const checked = selectedGroups.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        setSelectedGroups((prev) =>
                          checked ? prev.filter((x) => x !== g) : [...prev, g]
                        );
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between border-b border-white/8 last:border-b-0 transition-colors ${
                        checked ? "bg-cyan-500/15 text-white" : "text-white/80 hover:bg-white/6"
                      }`}
                    >
                      <span className="truncate">{g}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/60">{count}</span>
                        <span
                          className={`h-3 w-3 rounded-full border ${
                            checked ? "bg-cyan-400 border-cyan-200" : "border-white/30"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3 grid grid-cols-2 gap-2">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/70 col-span-2">Add channel</div>
          <input
            className="w-full bg-white/10 border border-white/15 rounded-lg px-2 py-2 text-sm text-white outline-none col-span-2"
            placeholder="Channel name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
          <input
            className="w-full bg-white/10 border border-white/15 rounded-lg px-2 py-2 text-sm text-white outline-none col-span-2"
            placeholder="Stream URL (m3u8/mpd)"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
          <div className="col-span-2 flex justify-end">
            <button
              onClick={() => {
                const url = manualUrl.trim();
                if (!url) return;
                const name = manualName.trim() || url;
                const sourceKey = playlistMeta.source || playlistMeta.name || STORAGE_KEY;
                const newCh = {
                  index: channels.length,
                  name,
                  url,
                  logo: "",
                  group: "Manual",
                };
                const nextExtras = { ...extrasMap };
                const list = nextExtras[sourceKey] ? [...nextExtras[sourceKey]] : [];
                list.push({ ...newCh, index: list.length });
                nextExtras[sourceKey] = list;
                persistExtras(nextExtras);
                setChannels((prev) => [...prev, { ...newCh, index: prev.length }]);
                setManualName("");
                setManualUrl("");
              }}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-semibold hover:bg-cyan-400"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  const playerCard = (
    <div
      ref={playerShellRef}
      className="relative h-[60vh] w-full overflow-hidden rounded-3xl bg-black/70 shadow-[0_25px_90px_-40px_rgba(0,0,0,0.8)] border border-white/5"
    >
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            controls={false}
            muted={isMuted}
        onClick={() => {
          if (streamLoading) return;
          setPlaying((p) => !p);
          setStatus("");
          setPlayerError("");
        }}
      />
      {streamLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] pointer-events-none">
          <div className="h-14 w-14 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px] px-6 text-center">
          <div className="space-y-3 text-white">
            <div className="text-sm font-semibold">Playback issue</div>
            <div className="text-xs text-white/70">{playerError}</div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setPlayerError("");
                  setStreamLoading(false);
                }}
                className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setPlayerError("");
                  setStreamLoading(true);
                  setPlaying(false);
                  setCurrentChannel((prev) => {
                    if (!prev || !filteredChannels.length) return prev;
                    const idx = filteredChannels.findIndex((c) => c.url === prev.url && c.index === prev.index);
                    const next = filteredChannels[(idx + 1) % filteredChannels.length];
                    return next;
                  });
                }}
                className="px-3 py-1.5 rounded-full bg-cyan-500/80 text-black text-xs font-semibold"
              >
                Try next
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden flex items-center justify-center bg-white/5">
              {currentChannel?.logo ? (
                <img
                  src={currentChannel.logo}
                  alt="Brand"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="text-[11px] font-semibold text-white/80">TV</div>
              )}
            </div>
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-cyan-100/80">Now playing</div>
          <div className="text-lg font-semibold max-w-[60vw] truncate">{currentChannel?.name || "Select a channel"}</div>
        </div>
      </div>

      <div className="absolute top-6 right-6 text-xs bg-white/10 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white font-semibold truncate" title={playlistMeta.source}>{playlistMeta.name}</span>
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur-lg shadow-[0_10px_40px_-15px_rgba(0,0,0,0.8)]">
          <button
            onClick={handlePrev}
            className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:border-cyan-300/60"
            title="Previous channel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
            <button
            onClick={() => setPlaying((p) => !p)}
            disabled={streamLoading || Boolean(playerError)}
            className={`relative h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(0,255,255,0.6)] transition-opacity ${
              streamLoading
                ? "bg-white/10 border border-white/20 opacity-60 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-400 to-blue-500"
            }`}
            title={playing ? "Pause" : "Play"}
          >
            {streamLoading ? (
              <div className="h-5 w-5 border-2 border-white/40 border-t-white animate-spin rounded-full" />
            ) : playing ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" rx="1.2" />
                <rect x="14" y="4" width="4" height="16" rx="1.2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7cf2ff] pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3.87c0-1.54 1.64-2.5 3-1.73l11.12 6.13c1.37.75 1.37 2.71 0 3.46L8 17.86c-1.36.75-3-.2-3-1.73V3.87Z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleNext}
            className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:border-cyan-300/60"
            title="Next channel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            </button>
          <div className="flex-1 px-2 flex items-center gap-2 min-w-0">
            <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
              <div
                className="absolute top-0 left-0 h-full bg-cyan-500/40 z-0"
                style={{
                  width:
                    progress.duration && progress.buffered
                      ? `${Math.min(100, (progress.buffered / progress.duration) * 100)}%`
                      : "0%",
                }}
              />
              <div
                className="absolute top-0 left-0 h-full bg-cyan-400 z-10"
                style={{
                  width:
                    progress.duration && progress.time
                      ? `${Math.min(100, (progress.time / progress.duration) * 100)}%`
                      : "0%",
                }}
              />
            </div>
            <div className="text-[10px] text-white/70 whitespace-nowrap shrink-0">
              {formatTime(progress.time)} / {formatTime(progress.duration || 0)}
            </div>
          </div>
          <button
            onClick={() => {
              if (!currentChannel?.url) return;
              navigator.clipboard?.writeText(currentChannel.url).catch(() => {});
              setStatus("Stream link copied");
            }}
            className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:border-cyan-300/60 shrink-0"
            title={currentChannel?.url || "No channel selected"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.42 1.41" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-2.83 2.83a5 5 0 0 0 7.07 7.07l1.42-1.41" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                } else if (volume > 0) {
                  setIsMuted(true);
                } else {
                  setVolume(0.5);
                  setIsMuted(false);
                }
              }}
              className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:border-cyan-300/60 shrink-0"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <div className="flex items-center w-14">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  setIsMuted(newVolume === 0);
                  localStorage.setItem("iptv-player:volume", newVolume.toString());
                }}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                style={{
                  background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:border-cyan-300/60 shrink-0"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9V5h4" />
              <path d="M20 9V5h-4" />
              <path d="M4 15v4h4" />
              <path d="M20 15v4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-tr from-[#040912] via-[#0c192b] to-[#122a4e] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(130,87,229,0.14),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(0,255,180,0.1),transparent_35%)]" />

      <section className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-24 flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="text-[12px] uppercase tracking-[0.4em] text-cyan-100/70">IPTV Player</div>
            <h1 className="text-3xl font-semibold">Betty IPTV Player</h1>
            {showDisclaimer && (
              <div className="flex items-start gap-2 max-w-3xl bg-amber-500/12 border border-amber-300/50 rounded-xl px-3 py-2 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]">
                <span className="text-[12px] font-semibold text-amber-200 flex-1">
                  Disclaimer: we do not host or provide any streams; the player only opens URLs supplied by users.
                </span>
                <button
                  onClick={() => {
                    setShowDisclaimer(false);
                    setStatus("Disclaimer dismissed");
                  }}
                  className="text-[11px] text-amber-100/70 hover:text-amber-50"
                  aria-label="Close disclaimer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[420px]">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 shadow-lg shadow-black/20">
                  <span className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">URL</span>
                  <input
                    className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
                    placeholder={DEFAULT_PLAYLIST_URL}
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    onFocus={() => setShowUrlSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowUrlSuggestions(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadPlaylistFromUrl(playlistUrl);
                    }}
                  />
                </div>
                {showUrlSuggestions && playlists.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 z-40 rounded-2xl bg-[#0b1526] border border-white/10 shadow-[0_18px_50px_-25px_rgba(0,0,0,0.9)] max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 text-[11px] text-white/60 border-b border-white/10">
                      <span>Saved playlists</span>
                      <button
                        onMouseDown={() => {
                          setPlaylists([]);
                          localStorage.removeItem(PLAYLISTS_KEY);
                        }}
                        className="text-cyan-200 hover:text-white"
                      >
                        Clear all
                      </button>
                    </div>
                    {playlists.map((item) => (
                      <div
                        key={item.url}
                        role="button"
                        tabIndex={0}
                        onMouseDown={() => {
                          setPlaylistUrl(item.url);
                          loadPlaylistFromUrl(item.url, false, { fallbackName: item.name });
                        }}
                        className="w-full text-left px-3 py-3 text-sm text-white/85 hover:bg-white/5 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold truncate">{item.name || item.url}</span>
                          <span className="text-[11px] text-white/50 truncate">{item.url}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/40">{item.lastAccessed ? new Date(item.lastAccessed).toLocaleDateString() : ""}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setPlaylists((prev) => {
                                const next = prev.filter((p) => p.url !== item.url);
                                localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(next));
                                return next;
                              });
                            }}
                            className="h-7 w-7 rounded-full bg-white/10 border border-white/10 text-white/70 hover:border-red-300/60 flex items-center justify-center"
                            title="Remove"
                          >
                            ✕
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => loadPlaylistFromUrl(playlistUrl)}
                className="h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-semibold shadow-[0_10px_40px_-15px_rgba(0,255,255,0.8)] border border-white/10 hover:scale-[1.01] transition-transform disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Loading..." : "Load playlist"}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-sm hover:border-cyan-300/60 transition-colors"
              >
                Upload .m3u
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".m3u,.m3u8"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileLoad(file);
                  e.target.value = "";
                }}
              />
              <div className="relative ml-auto" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:border-cyan-300/60 transition-colors flex items-center gap-2 shadow-lg shadow-black/30"
                >
                  Settings
                  <span className="text-[10px] text-white/60">▼</span>
                </button>
            {showSettings && (
                  <div className="absolute right-0 z-40 mt-3 w-72 rounded-2xl border border-white/10 bg-[#0d1727] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.85)] p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/60">Preferences</div>
                      <button
                        className="text-[11px] text-cyan-200 hover:text-white"
                        onClick={() => setShowSettings(false)}
                      >
                        Close
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <div className="text-sm text-white/80">Autoplay first channel</div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={autoplay}
                            onChange={(e) => setAutoplay(e.target.checked)}
                          />
                          <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-cyan-500 transition-all relative">
                            <div className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white transition-all ${autoplay ? "translate-x-5" : ""}`} />
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <div className="text-sm text-white/80">Show details panel</div>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={sidebarVisible}
                            onChange={(e) => setSidebarVisible(e.target.checked)}
                          />
                          <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-cyan-500 transition-all relative">
                            <div className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white transition-all ${sidebarVisible ? "translate-x-5" : ""}`} />
                          </div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <div className="text-sm text-white/80">Layout</div>
                        <select
                          value={viewMode}
                          onChange={(e) => setViewMode(e.target.value)}
                          className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-sm text-white"
                        >
                          <option value="side">Side panel</option>
                          <option value="bottom">Below player</option>
                        </select>
                      </div>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <div className="text-sm text-white/80">Channels per page</div>
                      <input
                        type="number"
                        min={6}
                        max={200}
                        value={perPage}
                        onChange={(e) => setPerPage(Math.min(200, Math.max(6, Number(e.target.value) || PAGE_SIZE)))}
                        className="w-20 bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-sm text-white text-right"
                      />
                    </div>
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <div className="text-sm text-white/80">Show icons only</div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showIconsOnly}
                        onChange={(e) => setShowIconsOnly(e.target.checked)}
                      />
                      <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-cyan-500 transition-all relative">
                        <div className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white transition-all ${showIconsOnly ? "translate-x-5" : ""}`} />
                      </div>
                    </label>
                  </div>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <div className="text-sm text-white/80">Load last playlist on start</div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={loadLastOnStart}
                          onChange={(e) => setLoadLastOnStart(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-cyan-500 transition-all relative">
                          <div className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white transition-all ${loadLastOnStart ? "translate-x-5" : ""}`} />
                        </div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <div className="text-sm text-white/80">Resume last channel on start</div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={resumeLastChannel}
                          onChange={(e) => setResumeLastChannel(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:bg-cyan-500 transition-all relative">
                          <div className={`absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white transition-all ${resumeLastChannel ? "translate-x-5" : ""}`} />
                        </div>
                      </label>
                    </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* layout and details moved into Settings dropdown */}
          </div>
        </header>

        {(error || status) && (
          <div className="grid gap-2">
            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
            {status && (
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
                {status}
            </div>
            )}
          </div>
        )}

        {viewMode === "side" ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
            {playerCard}
            <div className="flex flex-col gap-4">
              {sidebarVisible && infoPanel}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-3 backdrop-blur-lg shadow-[0_18px_50px_-35px_rgba(0,0,0,0.8)] max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/60">Channels</div>
                  <div className="flex items-center gap-2 text-[11px] text-white/60">
                    <span>{filteredChannels.length} available</span>
                    <span className="text-white/30">|</span>
                    <span>Page {page} / {totalPages}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-[11px] text-white/60">{Math.min(PAGE_SIZE, paginatedChannels.length)} shown</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white/70 disabled:opacity-40"
                      title="Previous page"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white/70 disabled:opacity-40"
                      title="Next page"
                    >
                      ›
                    </button>
                  </div>
                </div>
                {!filteredChannels.length ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    No channels match your filter. Try another group or search term.
                  </div>
                ) : (
                  <>
                    {!paginatedChannels.length ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                        No channels on this page. Resetting…
                        <button
                          onClick={() => setPage(1)}
                          className="ml-2 underline text-cyan-200"
                        >
                          Go to first page
                        </button>
                      </div>
                    ) : (
                      <div
                        className={
                          showIconsOnly
                            ? "grid grid-cols-3 sm:grid-cols-4 gap-2"
                            : "flex flex-col gap-2"
                        }
                      >
                        {paginatedChannels.map((ch) => renderChannelCard(ch, true))}
                      </div>
                    )}
                  </>
                )}
          </div>
        </div>
          </section>
        ) : (
          <>
            <section className={`grid gap-6 ${sidebarVisible ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
              <div className={sidebarVisible ? "lg:col-span-2" : "lg:col-span-1"}>{playerCard}</div>
              {sidebarVisible && infoPanel}
            </section>

            <section className="flex flex-col gap-3">
          <div className="flex items-center gap-3 px-1">
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs text-white/70">
              ▶
            </div>
            <div className="uppercase text-[12px] tracking-[0.35em] text-slate-200/60">Channels</div>
          </div>
              {!filteredChannels.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                  No channels match your filter. Try another group or search term.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 text-[11px] text-white/60">
                    <span>{filteredChannels.length} available</span>
                    <div className="flex items-center gap-2">
                      <span>Page {page} / {totalPages}</span>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white/70 disabled:opacity-40"
                        title="Previous page"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-white/70 disabled:opacity-40"
                        title="Next page"
                      >
                        ›
              </button>
          </div>
        </div>
                  {!paginatedChannels.length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
                      No channels on this page. <button onClick={() => setPage(1)} className="underline text-cyan-200">Go to first page</button>
                    </div>
                  ) : (
                    <div
                      className={
                        showIconsOnly
                          ? "grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8"
                          : "grid gap-4 md:grid-cols-3 sm:grid-cols-2"
                      }
                    >
                      {paginatedChannels.map((ch) => renderChannelCard(ch, false))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
