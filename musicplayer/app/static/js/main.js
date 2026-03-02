document.addEventListener("DOMContentLoaded", () => {
    const LYRICS_OFFSET_SECONDS = 3.0;

    const audio = document.getElementById("audio");
    const playBtn = document.getElementById("play");
    const playIcon = document.getElementById("playIcon");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const songSelect = document.getElementById("songSelect");

    const seekBar = document.getElementById("seekBar");
    const current = document.getElementById("current");
    const duration = document.getElementById("duration");

    const volume = document.getElementById("volume");
    const fullscreenBtn = document.getElementById("fullscreen");
    const lyricsContainer = document.getElementById("lyricsContainer");
    const lyricsRaw = document.getElementById("lyricsRaw");

    if (!audio) {
        return;
    }

    let lyricsData = [];
    let lyricWordSpans = [];
    let lastActiveLineIndex = -1;
    let syncFrameId = null;

    if (lyricsContainer) {
        const rawLyricsText = lyricsRaw?.value || lyricsContainer.dataset.lyrics || "[]";
        lyricsData = parseLyrics(rawLyricsText);
        lyricWordSpans = renderLyrics(lyricsData, lyricsContainer);
    }

    audio.load();

    audio.addEventListener("loadedmetadata", () => {
        duration.textContent = formatTime(audio.duration);
    });

    playBtn?.addEventListener("click", () => {
        if (!audio.duration) {
            return;
        }

        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });

    prevBtn?.addEventListener("click", () => {
        navigateSong(-1);
    });

    nextBtn?.addEventListener("click", () => {
        navigateSong(1);
    });

    audio.addEventListener("play", () => {
        if (playIcon) {
            playIcon.innerHTML = "&#9208;";
        }
        playBtn?.classList.add("playing");
        startLyricsSyncLoop();
    });

    audio.addEventListener("pause", () => {
        if (playIcon) {
            playIcon.innerHTML = "&#9654;";
        }
        playBtn?.classList.remove("playing");
        stopLyricsSyncLoop();
    });

    audio.addEventListener("ended", () => {
        stopLyricsSyncLoop();
        audio.currentTime = 0;
        if (seekBar) {
            seekBar.value = 0;
            setSeekFill(0);
        }
        updateLyrics(0 + LYRICS_OFFSET_SECONDS);
    });

    audio.addEventListener("timeupdate", () => {
        if (!audio.duration) {
            return;
        }

        const percent = (audio.currentTime / audio.duration) * 100;
        if (seekBar) {
            seekBar.value = percent;
            setSeekFill(percent);
        }

        if (current) {
            current.textContent = formatTime(audio.currentTime);
        }
    });

    seekBar?.addEventListener("input", () => {
        if (!audio.duration) {
            return;
        }

        const seekTime = (Number(seekBar.value) / 100) * audio.duration;
        audio.currentTime = seekTime;
        updateLyrics(seekTime + LYRICS_OFFSET_SECONDS);
    });

    volume?.addEventListener("input", () => {
        audio.volume = Number(volume.value);
    });

    fullscreenBtn?.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    document.querySelectorAll(".premium-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            btn.style.transform = "scale(0.9)";
            setTimeout(() => {
                btn.style.transform = "";
            }, 120);
        });
    });

    function setSeekFill(percent) {
        if (!seekBar) {
            return;
        }
        seekBar.style.background = `linear-gradient(to right, white ${percent}%, #374151 ${percent}%)`;
    }

    function startLyricsSyncLoop() {
        if (syncFrameId !== null) {
            cancelAnimationFrame(syncFrameId);
        }

        const tick = () => {
            if (!audio.paused && !audio.ended) {
                updateLyrics(audio.currentTime + LYRICS_OFFSET_SECONDS);
                syncFrameId = requestAnimationFrame(tick);
            } else {
                syncFrameId = null;
            }
        };

        syncFrameId = requestAnimationFrame(tick);
    }

    function stopLyricsSyncLoop() {
        if (syncFrameId !== null) {
            cancelAnimationFrame(syncFrameId);
            syncFrameId = null;
        }
    }

    function navigateSong(direction) {
        if (!songSelect || !songSelect.form || songSelect.options.length === 0) {
            return;
        }

        const currentIndex = songSelect.selectedIndex;
        let nextIndex = currentIndex + direction;

        if (nextIndex < 0) {
            nextIndex = songSelect.options.length - 1;
        } else if (nextIndex >= songSelect.options.length) {
            nextIndex = 0;
        }

        songSelect.selectedIndex = nextIndex;
        songSelect.form.submit();
    }

    function parseLyrics(rawLyrics) {
        const text = String(rawLyrics || "").trim();
        if (!text) {
            return [];
        }

        const parseAttempts = [];
        parseAttempts.push(text);
        parseAttempts.push(
            text
                .replace(/&quot;/g, "\"")
                .replace(/&#x27;|&#39;/g, "'")
                .replace(/&amp;/g, "&")
                .replace(/[\u2018\u2019]/g, "'")
                .replace(/[\u201C\u201D]/g, "\"")
        );

        // Common Python-style payload fallback.
        parseAttempts.push(
            text
                .replace(/\bNone\b/g, "null")
                .replace(/\bTrue\b/g, "true")
                .replace(/\bFalse\b/g, "false")
                .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
                .replace(/:\s*'([^']*)'/g, ': "$1"')
        );

        for (const candidate of parseAttempts) {
            try {
                const parsed = JSON.parse(candidate);
                if (Array.isArray(parsed)) {
                    return normalizeLyrics(parsed);
                }
            } catch (error) {
                // Continue trying fallbacks.
            }
        }

        // Last-resort parser for JS-literal-like text.
        try {
            const parsed = Function(`"use strict"; return (${text});`)();
            if (Array.isArray(parsed)) {
                return normalizeLyrics(parsed);
            }
        } catch (error) {
            // Continue to pattern-based extraction below.
        }

        return parseLyricsByPattern(text);
    }

    function normalizeLyrics(items) {
        return items
            .map((item) => ({
                time_seconds: Number(item.time_seconds),
                timestamp: item.timestamp || "",
                lyrics: typeof item.lyrics === "string" ? item.lyrics.trim() : ""
            }))
            .filter((item) => Number.isFinite(item.time_seconds) && item.lyrics.length > 0)
            .sort((a, b) => a.time_seconds - b.time_seconds);
    }

    function parseLyricsByPattern(text) {
        // Fallback for near-JSON payloads with small syntax mistakes.
        // First try entry-level extraction from full text.
        const entries = [];
        const entryPattern = /["']time_seconds["']\s*:\s*([0-9]+(?:\.[0-9]+)?)[\s\S]*?["']lyrics["']\s*:\s*["']([\s\S]*?)(?=["']\s*,\s*["']language["'])/g;
        let match = entryPattern.exec(text);
        while (match) {
            const lyricText = String(match[2] || "")
                .replace(/\\"/g, "\"")
                .replace(/\\n/g, " ")
                .replace(/\s+/g, " ")
                .replace(/"\s*$/, "")
                .trim();

            entries.push({
                time_seconds: Number(match[1]),
                timestamp: "",
                lyrics: lyricText
            });
            match = entryPattern.exec(text);
        }

        if (entries.length > 0) {
            return normalizeLyrics(entries);
        }

        const objectChunks = text.match(/\{[\s\S]*?\}/g) || [];

        objectChunks.forEach((chunk) => {
            const timeMatch = chunk.match(/["']time_seconds["']\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
            const lyricsMatch = chunk.match(/["']lyrics["']\s*:\s*["']([\s\S]*?)["']/);

            if (!timeMatch || !lyricsMatch) {
                return;
            }

            const lyricText = lyricsMatch[1]
                .replace(/\\"/g, "\"")
                .replace(/\\n/g, " ")
                .replace(/\s+/g, " ")
                .replace(/"\s*$/, "")
                .trim();

            entries.push({
                time_seconds: Number(timeMatch[1]),
                timestamp: "",
                lyrics: lyricText
            });
        });

        return normalizeLyrics(entries);
    }

    function renderLyrics(items, container) {
        container.innerHTML = "";

        if (!items.length) {
            const empty = document.createElement("p");
            empty.className = "text-gray-400 text-xl";
            empty.textContent = "Lyrics not available.";
            container.appendChild(empty);
            return [];
        }

        const spansByLine = [];

        items.forEach((entry, lineIndex) => {
            const line = document.createElement("p");
            line.className = "lyric-line";
            line.dataset.time = String(entry.time_seconds);
            line.dataset.index = String(lineIndex);

            const words = entry.lyrics.split(/\s+/).filter(Boolean);
            const lineWordSpans = [];

            words.forEach((word, wordIndex) => {
                const span = document.createElement("span");
                span.className = "lyric-word lyric-word--future";
                span.dataset.wordIndex = String(wordIndex);
                span.textContent = word + (wordIndex < words.length - 1 ? " " : "");
                line.appendChild(span);
                lineWordSpans.push(span);
            });

            container.appendChild(line);
            spansByLine.push(lineWordSpans);
        });

        return spansByLine;
    }

    function updateLyrics(currentTime) {
        if (!lyricsData.length || !lyricsContainer) {
            return;
        }

        let activeIndex = -1;
        for (let i = 0; i < lyricsData.length; i += 1) {
            if (currentTime >= lyricsData[i].time_seconds) {
                activeIndex = i;
            } else {
                break;
            }
        }

        const lines = lyricsContainer.querySelectorAll(".lyric-line");
        lines.forEach((line, index) => {
            line.classList.toggle("active", index === activeIndex);
        });

        lyricWordSpans.forEach((wordSpans, lineIndex) => {
            wordSpans.forEach((wordSpan) => {
                wordSpan.classList.remove("lyric-word--done", "lyric-word--active", "lyric-word--future");
                wordSpan.classList.add("lyric-word--future");
            });

            if (lineIndex !== activeIndex) {
                return;
            }

            const lineStart = lyricsData[lineIndex].time_seconds;
            const nextLine = lyricsData[lineIndex + 1];
            const lineEnd = nextLine
                ? nextLine.time_seconds
                : lineStart + Math.max(2, wordSpans.length * 0.35);

            const lineDuration = Math.max(0.1, lineEnd - lineStart);
            const progress = Math.min(1, Math.max(0, (currentTime - lineStart) / lineDuration));
            const completedCount = Math.floor(progress * wordSpans.length);

            wordSpans.forEach((wordSpan, wordIndex) => {
                if (wordIndex < completedCount) {
                    wordSpan.classList.remove("lyric-word--future");
                    wordSpan.classList.add("lyric-word--done");
                } else if (wordIndex === completedCount && progress < 1) {
                    wordSpan.classList.remove("lyric-word--future");
                    wordSpan.classList.add("lyric-word--active");
                }
            });
        });

        if (activeIndex !== -1 && activeIndex !== lastActiveLineIndex) {
            lines[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
            lastActiveLineIndex = activeIndex;
        }
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
});
