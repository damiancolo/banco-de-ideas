import RateLimit from './models/RateLimit';
import { connectDB } from './mongodb';
import { logger } from './logger';

/**
 * Checks if an action is allowed for a given IP based on rate limits.
 * Uses MongoDB to store counts with simple sliding window via TTL.
 * 
 * @param ip - The IP address of the requester
 * @param action - The action identifier (e.g., 'comment', 'new-idea')
 * @param limit - Max allowed actions per window (default: 10)
 * @param windowSeconds - Window duration in seconds (default: 60)
 * @returns Object with success boolean and remaining quota
 */
export async function checkRateLimit(
    ip: string,
    action: string,
    limit: number = 10,
    windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number }> {
    try {
        await connectDB();

        const now = new Date();
        const windowStart = new Date(now.getTime() - windowSeconds * 1000);

        // Find existing record or create new
        // Note: For simplicity and to avoid race conditions with upsert,
        // we'll just check the count and increment.
        // A more robust implementation might use specific time windows.
        // Here we use a document that expires to represent the window.

        let record = await RateLimit.findOne({ ip, action });

        if (!record) {
            // New window for this user/action
            const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
            await RateLimit.create({
                ip,
                action,
                count: 1,
                expiresAt
            });
            return { success: true, remaining: limit - 1 };
        }

        // Check if limit exceeded
        if (record.count >= limit) {
            return { success: false, remaining: 0 };
        }

        // Increment count
        record.count += 1;
        // Extend window? No, kept strict fixed window from creation for simplicity
        await record.save();

        return { success: true, remaining: limit - record.count };

    } catch (error) {
        logger.error('Rate limit check error:', error);
        // Fail open to avoid blocking legit users on DB error, but log it
        return { success: true, remaining: 1 };
    }
}
