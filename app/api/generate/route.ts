import { Client } from "@gradio/client";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { prompt, genre, bpm } = await req.json();

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const client = await Client.connect("ronantakizawa/sampleflip");

    const result = await client.predict("/generate_beat", {
      prompt,
      genre_override: genre || "auto",
      bpm_override: bpm || 0,
    });

    const data = result.data as any[];
    const audioData = data[0];
    const logs = data[1] as string;

    let audioUrl = "";
    if (audioData && typeof audioData === "object" && audioData.url) {
      audioUrl = audioData.url;
    } else if (typeof audioData === "string") {
      audioUrl = audioData;
    }

    return NextResponse.json({ audioUrl, logs });
  } catch (error: any) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}
