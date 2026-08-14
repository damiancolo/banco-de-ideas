import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getIp } from "@/lib/request-utils";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Node.js runtime for better compatibility with OpenAI SDK and buffers
export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        // Rate limit: 10 req/min (uses TTS, costly)
        const ip = getIp(req);
        const rateLimit = await checkRateLimit(ip, 'speak', 10, 60);
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Demasiadas solicitudes de audio. Intenta de nuevo en un minuto.' },
                { status: 429 }
            );
        }

        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No se proporcionó texto" }, { status: 400 });
        }

        logger.info(`Generating speech for text: ${text.substring(0, 50)}...`);

        const response = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
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
            { error: "Error al generar audio" },
            { status: 500 }
        );
    }
}
