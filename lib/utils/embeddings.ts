import OpenAI from 'openai';
import { logger } from '@/lib/logger';

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client singleton
 */
export function getClient(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY no está configurada');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

/**
 * Generate embedding vector for a text using OpenAI's text-embedding-3-small model
 * @param text - Text to generate embedding for
 * @returns Array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const client = getClient();

    try {
        const response = await client.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.trim(),
        });

        return response.data[0].embedding;
    } catch (error) {
        logger.error('Error generating embedding:', error);
        throw error;
    }
}

/**
 * Calculate cosine similarity between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
}
