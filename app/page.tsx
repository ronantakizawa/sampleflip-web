"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const GENRES = [
  { value: "auto", label: "Auto", icon: "✨" },
  { value: "trap", label: "Trap", icon: "🔥" },
  { value: "drill", label: "UK Drill", icon: "🗡" },
  { value: "boombap", label: "Boom Bap", icon: "📻" },
  { value: "jazzhouse", label: "Jazz House", icon: "🎷" },
  { value: "progressive_house", label: "Prog House", icon: "🌊" },
  { value: "rnb", label: "R&B", icon: "💜" },
  { value: "melodic_trap", label: "Melodic Trap", icon: "🎹" },
  { value: "techno", label: "Techno", icon: "⚡" },
  { value: "2hollis", label: "Hyperpop", icon: "💥" },
  { value: "breakcore", label: "Breakcore", icon: "🥁" },
];

const EXAMPLES = [
  { text: "dark trap beat with sad piano melody", genre: "trap" },
  { text: "jazzy house with warm saxophone", genre: "jazzhouse" },
  { text: "aggressive UK drill with orchestral strings", genre: "drill" },
  { text: "chill lo-fi boom bap with vinyl", genre: "boombap" },
  { text: "melodic trap like Gunna with guitar", genre: "melodic_trap" },
  { text: "deep house with vocal chops", genre: "jazzhouse" },
];

const STEPS = [
  "Planning beat...",
  "Searching YouTube for samples...",
  "AI picking best sample...",
  "Downloading sample...",
  "Analyzing BPM, key, chords...",
  "Generating drum pattern...",
  "Programming bass...",
  "Arranging & mixing...",
  "Mastering to -14 LUFS...",
  "Exporting MP3...",
];

interface Beat {
  audioUrl: string;
  logs: string;
  prompt: string;
  genre: string;
  bpm: number;
  timestamp: number;
}

function WaveformPlayer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!containerRef.current || !url) return;

    let ws: any;
    import("wavesurfer.js").then((WaveSurfer) => {
      ws = WaveSurfer.default.create({
        container: containerRef.current!,
        waveColor: "#6b21a8",
        progressColor: "#a855f7",
        cursorColor: "#d8b4fe",
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 80,
        url: url,
      });

      ws.on("ready", () => {
        setDuration(formatTime(ws.getDuration()));
      });
      ws.on("audioprocess", () => {
        setCurrentTime(formatTime(ws.getCurrentTime()));
      });
      ws.on("finish", () => setPlaying(false));
      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));

      wsRef.current = ws;
    });

    return () => {
      ws?.destroy();
    };
  }, [url]);

  const toggle = () => {
    wsRef.current?.playPause();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-500 rounded-full transition-colors shrink-0"
        >
          {playing ? (
            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="white" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div ref={containerRef} />
        </div>
      </div>
      <div className="flex justify-between text-xs text-zinc-500 font-mono px-16">
        <span>{currentTime}</span>
        <span>{duration}</span>
      </div>
    </div>
  );
}

function ProgressSteps({ step }: { step: number }) {
  return (
    <div className="space-y-2">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          {i < step ? (
            <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                />
              </svg>
            </div>
          ) : i === step ? (
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border border-zinc-700 shrink-0" />
          )}
          <span className={i <= step ? "text-zinc-200" : "text-zinc-600"}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("auto");
  const [bpm, setBpm] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [beats, setBeats] = useState<Beat[]>([]);
  const [activeBeat, setActiveBeat] = useState<Beat | null>(null);

  const generate = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setStep(0);

    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 6000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, genre, bpm }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      const beat: Beat = {
        audioUrl: data.audioUrl,
        logs: data.logs,
        prompt,
        genre: genre === "auto" ? "auto" : genre,
        bpm,
        timestamp: Date.now(),
      };

      setBeats((prev) => [beat, ...prev]);
      setActiveBeat(beat);
      setStep(STEPS.length);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [prompt, genre, bpm, loading]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar — History */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold">
            Sample<span className="text-purple-400">Flip</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">AI Beat Generator</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {beats.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center mt-8">
              No beats yet
            </p>
          ) : (
            beats.map((b, i) => (
              <button
                key={i}
                onClick={() => setActiveBeat(b)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeBeat === b
                    ? "bg-purple-900/30 border border-purple-700"
                    : "hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <div className="text-zinc-200 truncate">{b.prompt}</div>
                <div className="text-zinc-500 text-xs mt-0.5">
                  {b.genre} {b.bpm > 0 ? `${b.bpm} BPM` : ""}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="text-center mb-10 md:hidden">
              <h1 className="text-4xl font-bold">
                Sample<span className="text-purple-400">Flip</span>
              </h1>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    generate();
                  }
                }}
                placeholder="Describe the beat you want..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none text-lg"
                rows={2}
                disabled={loading}
              />

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGenre(g.value)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      genre === g.value
                        ? "bg-purple-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {g.icon} {g.label}
                  </button>
                ))}
              </div>

              {/* BPM + Generate */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                  <span className="text-zinc-400 text-sm font-mono w-20">
                    {bpm === 0 ? "BPM: Auto" : `BPM: ${bpm}`}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-24 accent-purple-500"
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={generate}
                  disabled={loading || !prompt.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-lg"
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Loading Progress */}
            {loading && (
              <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <ProgressSteps step={step} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Active Beat Player */}
            {activeBeat && !loading && (
              <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Your Beat</h2>
                    <p className="text-zinc-400 text-sm mt-0.5 max-w-md truncate">
                      {activeBeat.prompt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                      {activeBeat.genre}
                    </span>
                    {activeBeat.bpm > 0 && (
                      <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400 font-mono">
                        {activeBeat.bpm} BPM
                      </span>
                    )}
                  </div>
                </div>

                <WaveformPlayer url={activeBeat.audioUrl} />

                <div className="flex gap-2">
                  <a
                    href={activeBeat.audioUrl}
                    download
                    className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download MP3
                  </a>
                </div>

                <details>
                  <summary className="text-zinc-500 text-xs cursor-pointer hover:text-zinc-400">
                    Generation Log
                  </summary>
                  <pre className="mt-2 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-500 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {activeBeat.logs}
                  </pre>
                </details>
              </div>
            )}

            {/* Example Prompts */}
            {!loading && !activeBeat && (
              <div className="mt-12">
                <p className="text-zinc-500 text-sm mb-3">Try an example:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.text}
                      onClick={() => {
                        setPrompt(ex.text);
                        setGenre(ex.genre);
                      }}
                      className="text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 transition-colors group"
                    >
                      <p className="text-zinc-300 text-sm group-hover:text-white transition-colors">
                        {ex.text}
                      </p>
                      <p className="text-zinc-600 text-xs mt-1">{ex.genre}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
