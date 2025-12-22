/**
 * API service for Banco de Ideas
 * Centralizes all API calls to avoid duplication
 */

import type { AnalyzeRequest, AnalyzeResponse, SavedIdea } from '@/types';

/**
 * Analyzes an idea using the AI backend
 */
export async function analyzeIdea(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Saves an idea (fire and forget - doesn't wait for response)
 */
export function saveIdeaAsync(idea: string): void {
    fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', idea }),
    }).catch(err => {
        console.error('Failed to save idea:', err);
    });
}

/**
 * Gets all ideas from the database
 */
export async function getIdeas(category?: 'user' | 'bisociation'): Promise<SavedIdea[]> {
    const url = category ? `/api/ideas?category=${category}` : '/api/ideas';
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.statusText}`);
    }

    const data = await response.json();
    return data.ideas || [];
}

/**
 * Deletes an idea by ID
 */
export async function deleteIdea(id: string): Promise<boolean> {
    const response = await fetch(`/api/ideas?id=${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete idea');
    }

    return true;
}
