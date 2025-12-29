import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No se proporcionó texto" }, { status: 400 });
        }

        logger.info(`Generating speech for text: ${text.substring(0, 50)}...`);

        const response = await openai.audio.speech.create({
            model: "tts-1",
            voice: "shimmer", // A pleasant secondary voice
            input: text,
        });

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    } catch (error: unknown) {
        logger.error("TTS error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Error al generar audio" },
            { status: 500 }
        );
    }
}
