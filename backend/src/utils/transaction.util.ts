import mongoose from 'mongoose';
import { logger } from '../utils/logger';

interface TransactionOptions {
    session?: mongoose.ClientSession;
    retries?: number;
}

/**
 * Execute a function within a MongoDB transaction with automatic rollback on error
 */
export async function withTransaction<T>(
    callback: (session: mongoose.ClientSession) => Promise<T>,
    options: TransactionOptions = {}
): Promise<T> {
    const maxRetries = options.retries || 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            logger.info(`Transaction attempt ${attempt}/${maxRetries}`);

            // Execute the callback with the session
            const result = await callback(session);

            // Commit the transaction
            await session.commitTransaction();
            logger.info(`Transaction committed successfully on attempt ${attempt}`);

            return result;
        } catch (error: any) {
            // Abort the transaction on error
            await session.abortTransaction();
            logger.error(`Transaction aborted on attempt ${attempt}:`, error.message);

            lastError = error;

            // Retry on transient errors
            if (
                error.hasErrorLabel &&
                error.hasErrorLabel('TransientTransactionError') &&
                attempt < maxRetries
            ) {
                logger.info(`Retrying transaction due to transient error...`);
                await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Exponential backoff
                continue;
            }

            // Don't retry on other errors
            break;
        } finally {
            await session.endSession();
        }
    }

    // If we get here, all retries failed
    throw new Error(`Transaction failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Rollback helper for manual transaction management
 */
export async function rollbackTransaction(session: mongoose.ClientSession, error: any) {
    try {
        await session.abortTransaction();
        logger.error('Transaction rolled back due to error:', error.message);
    } catch (rollbackError) {
        logger.error('Failed to rollback transaction:', rollbackError);
    } finally {
        await session.endSession();
    }
}

/**
 * Example usage in a controller:
 * 
 * const result = await withTransaction(async (session) => {
 *   const account = await Account.create([{ name: 'Test' }], { session });
 *   const entry = await JournalEntry.create([{ ... }], { session });
 *   return { account, entry };
 * });
 */
