/**
 * Intent detection utility
 * Determines user intent from their message
 */

import { KEYWORDS } from '@/lib/constants';
import type { ApiAction } from '@/types';

/**
 * Detects the user's intent from their message
 * @param message - User's message text
 * @returns The detected action type
 */
export function detectIntent(message: string): ApiAction {
    const lowerText = message.toLowerCase();

    // Check for "similar ideas" intent
    if (KEYWORDS.SIMILAR.some(keyword => lowerText.includes(keyword))) {
        return 'similar';
    }

    // Check for "analysis" intent
    if (KEYWORDS.ANALYSIS.some(keyword => lowerText.includes(keyword))) {
        return 'analysis';
    }

    // Default to chat mode
    return 'chat';
}
