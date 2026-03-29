"use client";

import { useState } from "react";

const GENRES = [
  { value: "auto", label: "Auto (AI picks)" },
  { value: "trap", label: "Trap" },
  { value: "drill", label: "UK Drill" },
  { value: "boombap", label: "Boom Bap" },
  { value: "jazzhouse", label: "Jazz House" },
  { value: "progressive_house", label: "Progressive House" },
  { value: "rnb", label: "R&B" },
  { value: "melodic_trap", label: "Melodic Trap" },
  { value: "techno", label: "Techno" },
  { value: "2hollis", label: "2Hollis / Hyperpop" },
  { value: "breakcore", label: "Breakcore" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("auto");
  const [bpm, setBpm] = useState(0);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setAudioUrl(null);
    setLogs("Starting generation...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, genre, bpm }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      setAudioUrl(data.audioUrl);
      setLogs(data.logs);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            Sample<span className="text-purple-400">Flip</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Describe a beat, get a beat.
          </p>
        </div>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g. "dark trap beat with sad piano melody"'
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
            disabled={loading}
          />

          <div className="flex gap-3">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              disabled={loading}
            >
              {GENRES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 flex-1">
              <label className="text-zinc-400 text-sm whitespace-nowrap">
                BPM: {bpm === 0 ? "Auto" : bpm}
              </label>
              <input
                type="range"
                min={0}
                max={200}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="flex-1 accent-purple-500"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Generating..." : "Generate Beat"}
          </button>
        </div>

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 mt-3">
              Searching for samples and generating your beat...
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              This usually takes about 60 seconds
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {audioUrl && (
          <div className="mt-8 space-y-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Your Beat</h2>
              <audio controls src={audioUrl} className="w-full" />
              <a
                href={audioUrl}
                download
                className="inline-block mt-4 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Download MP3
              </a>
            </div>
          </div>
        )}

        {logs && (
          <details className="mt-4">
            <summary className="text-zinc-500 text-sm cursor-pointer hover:text-zinc-400">
              Generation Log
            </summary>
            <pre className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap">
              {logs}
            </pre>
          </details>
        )}

        <div className="mt-12 grid grid-cols-2 gap-2">
          {[
            "dark trap beat with sad piano melody",
            "jazzy house with saxophone",
            "aggressive UK drill with orchestral strings",
            "chill lo-fi boom bap",
          ].map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              disabled={loading}
              className="text-left text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
