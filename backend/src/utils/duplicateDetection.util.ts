import { JournalEntry } from '../models/JournalEntry';
import { logger } from '../utils/logger';

/**
 * Detect duplicate journal entries by checking:
 * - Same date
 * - Same total amount
 * - Same description (fuzzy match)
 * - Posted within last 5 minutes
 */
export async function detectDuplicateEntry(entry: {
    date: Date;
    description: string;
    totalDebit: number;
    totalCredit: number;
}): Promise<boolean> {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const duplicates = await JournalEntry.find({
            date: entry.date,
            $or: [
                { totalDebit: entry.totalDebit },
                { totalCredit: entry.totalCredit }
            ],
            createdAt: { $gte: fiveMinutesAgo },
            status: { $ne: 'cancelled' }
        });

        // Check for fuzzy description match
        for (const dup of duplicates) {
            const similarity = calculateStringSimilarity(
                entry.description.toLowerCase(),
                dup.description.toLowerCase()
            );

            if (similarity > 0.8) { // 80% similar
                logger.warn(`Potential duplicate detected: ${dup.entryNumber}`);
                return true;
            }
        }

        return false;
    } catch (error) {
        logger.error('Error detecting duplicates:', error);
        return false; // Don't block on error
    }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,     // deletion
                matrix[i][j - 1] + 1,     // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);

    return 1 - distance / maxLength;
}

/**
 * Check for anomalies in journal entry amounts
 */
export function detectAnomalousAmount(amount: number, accountHistory: number[]): {
    isAnomalous: boolean;
    reason?: string;
} {
    if (accountHistory.length < 5) {
        return { isAnomalous: false }; // Not enough data
    }

    // Calculate mean and standard deviation
    const mean = accountHistory.reduce((sum, val) => sum + val, 0) / accountHistory.length;
    const variance = accountHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accountHistory.length;
    const stdDev = Math.sqrt(variance);

    // Check if amount is more than 3 standard deviations from mean
    const zScore = Math.abs((amount - mean) / stdDev);

    if (zScore > 3) {
        return {
            isAnomalous: true,
            reason: `Amount ${amount} is ${zScore.toFixed(2)} standard deviations from the mean (${mean.toFixed(2)})`
        };
    }

    return { isAnomalous: false };
}
