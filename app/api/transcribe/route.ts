import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo de audio" }, { status: 400 });
        }

        logger.info(`Transcribing audio file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

        // Convert File to a readable format for OpenAI
        const buffer = Buffer.from(await file.arrayBuffer());

        // Extract extension from filename or default to webm
        const extension = file.name.split('.').pop() || 'webm';
        const filename = `audio.${extension}`;

        // Use OpenAI Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: await OpenAI.toFile(buffer, filename),
            model: "whisper-1",
            language: "es", // Specify Spanish for better accuracy as per plan
        });

        logger.info(`Transcription successful: ${transcription.text.substring(0, 50)}...`);

        return NextResponse.json({ text: transcription.text });
    } catch (error: unknown) { // Explicitly type error as unknown
        logger.error("Transcription error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Error al transcribir el audio" },
            { status: 500 }
        );
    }
}
