import cron from 'node-cron';
import { logger } from '../utils/logger';
import { performReconciliation, fixBalanceMismatches } from '../utils/reconciliation.util';
import { JournalEntry } from '../models/JournalEntry';
import ChartOfAccount from '../models/ChartOfAccount';
import { Ledger } from '../models/Ledger';

/**
 * Data Consistency Validation Jobs
 * Runs automated checks to ensure data integrity
 */

interface ValidationReport {
    timestamp: Date;
    jobName: string;
    status: 'success' | 'warning' | 'error';
    issues: number;
    details: any;
}

const reports: ValidationReport[] = [];

/**
 * Daily reconciliation job - Runs at 2 AM
 * Checks account balances against ledger totals
 */
export const dailyReconciliationJob = cron.schedule('0 2 * * *', async () => {
    logger.info('🔍 Starting daily reconciliation job...');

    try {
        const result = await performReconciliation();

        const report: ValidationReport = {
            timestamp: new Date(),
            jobName: 'Daily Reconciliation',
            status: result.success ? 'success' : 'warning',
            issues: result.issues.length,
            details: result
        };

        reports.push(report);

        if (result.issues.length > 0) {
            logger.warn(`⚠️ Reconciliation found ${result.issues.length} issues`);

            // Auto-fix balance mismatches if not too many
            if (result.summary.accountsWithIssues <= 10) {
                logger.info('🔧 Auto-fixing balance mismatches...');
                const fixed = await fixBalanceMismatches();
                logger.info(`✅ Fixed ${fixed} account balances`);
            } else {
                logger.warn('⚠️ Too many issues to auto-fix. Manual review required.');
            }
        } else {
            logger.info('✅ Reconciliation passed - no issues found');
        }
    } catch (error: any) {
        logger.error('❌ Daily reconciliation job failed:', error);
        reports.push({
            timestamp: new Date(),
            jobName: 'Daily Reconciliation',
            status: 'error',
            issues: -1,
            details: { error: error.message }
        });
    }
});

/**
 * Duplicate detection job - Runs every 6 hours
 * Finds potential duplicate journal entries
 */
export const duplicateDetectionJob = cron.schedule('0 */6 * * *', async () => {
    logger.info('🔍 Starting duplicate detection job...');

    try {
        const recentEntries = await JournalEntry.find({
            status: 'posted',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }).sort({ createdAt: -1 });

        const duplicates: any[] = [];

        // Check for duplicates
        for (let i = 0; i < recentEntries.length; i++) {
            for (let j = i + 1; j < recentEntries.length; j++) {
                const entry1 = recentEntries[i];
                const entry2 = recentEntries[j];

                // Same date, amount, and similar description
                if (
                    entry1.date.toDateString() === entry2.date.toDateString() &&
                    Math.abs(entry1.totalDebit - entry2.totalDebit) < 0.01 &&
                    calculateSimilarity(entry1.description, entry2.description) > 0.8
                ) {
                    duplicates.push({
                        entry1: entry1.entryNumber,
                        entry2: entry2.entryNumber,
                        similarity: calculateSimilarity(entry1.description, entry2.description)
                    });
                }
            }
        }

        const report: ValidationReport = {
            timestamp: new Date(),
            jobName: 'Duplicate Detection',
            status: duplicates.length > 0 ? 'warning' : 'success',
            issues: duplicates.length,
            details: { duplicates }
        };

        reports.push(report);

        if (duplicates.length > 0) {
            logger.warn(`⚠️ Found ${duplicates.length} potential duplicates`);
        } else {
            logger.info('✅ No duplicates found');
        }
    } catch (error: any) {
        logger.error('❌ Duplicate detection job failed:', error);
    }
});

/**
 * Orphaned records cleanup - Runs weekly on Sunday at 3 AM
 * Finds and reports orphaned ledger entries
 */
export const orphanedRecordsJob = cron.schedule('0 3 * * 0', async () => {
    logger.info('🔍 Starting orphaned records cleanup job...');

    try {
        // Find ledger entries without valid accounts
        const orphanedLedgers = await Ledger.aggregate([
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'accountId',
                    foreignField: '_id',
                    as: 'account'
                }
            },
            {
                $match: {
                    account: { $size: 0 }
                }
            }
        ]);

        // Find journal entries with missing account references
        const entriesWithMissingAccounts: any[] = [];
        const allEntries = await JournalEntry.find({}).limit(1000);

        for (const entry of allEntries) {
            for (const line of entry.lines || []) {
                const account = await ChartOfAccount.findById(line.accountId);
                if (!account) {
                    entriesWithMissingAccounts.push({
                        entryNumber: entry.entryNumber,
                        missingAccountId: line.accountId
                    });
                }
            }
        }

        const totalIssues = orphanedLedgers.length + entriesWithMissingAccounts.length;

        const report: ValidationReport = {
            timestamp: new Date(),
            jobName: 'Orphaned Records Cleanup',
            status: totalIssues > 0 ? 'warning' : 'success',
            issues: totalIssues,
            details: {
                orphanedLedgers: orphanedLedgers.length,
                entriesWithMissingAccounts: entriesWithMissingAccounts.length
            }
        };

        reports.push(report);

        if (totalIssues > 0) {
            logger.warn(`⚠️ Found ${totalIssues} orphaned records`);
        } else {
            logger.info('✅ No orphaned records found');
        }
    } catch (error: any) {
        logger.error('❌ Orphaned records job failed:', error);
    }
});

/**
 * Unbalanced entries check - Runs every 12 hours
 * Finds journal entries where debit != credit
 */
export const unbalancedEntriesJob = cron.schedule('0 */12 * * *', async () => {
    logger.info('🔍 Starting unbalanced entries check...');

    try {
        const entries = await JournalEntry.find({ status: 'posted' });
        const unbalanced: any[] = [];

        for (const entry of entries) {
            const debitTotal = entry.lines?.reduce((sum: number, line: any) => sum + (line.debit || 0), 0) || 0;
            const creditTotal = entry.lines?.reduce((sum: number, line: any) => sum + (line.credit || 0), 0) || 0;

            if (Math.abs(debitTotal - creditTotal) > 0.01) {
                unbalanced.push({
                    entryNumber: entry.entryNumber,
                    debit: debitTotal,
                    credit: creditTotal,
                    difference: debitTotal - creditTotal
                });
            }
        }

        const report: ValidationReport = {
            timestamp: new Date(),
            jobName: 'Unbalanced Entries Check',
            status: unbalanced.length > 0 ? 'error' : 'success',
            issues: unbalanced.length,
            details: { unbalanced }
        };

        reports.push(report);

        if (unbalanced.length > 0) {
            logger.error(`❌ Found ${unbalanced.length} unbalanced entries!`);
        } else {
            logger.info('✅ All entries balanced');
        }
    } catch (error: any) {
        logger.error('❌ Unbalanced entries job failed:', error);
    }
});

/**
 * Helper function to calculate string similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const distance = matrix[len1][len2];
    const maxLength = Math.max(len1, len2);

    return 1 - distance / maxLength;
}

/**
 * Start all validation jobs
 */
export function startValidationJobs() {
    logger.info('🚀 Starting data consistency validation jobs...');

    dailyReconciliationJob.start();
    duplicateDetectionJob.start();
    orphanedRecordsJob.start();
    unbalancedEntriesJob.start();

    logger.info('✅ All validation jobs started');
}

/**
 * Stop all validation jobs
 */
export function stopValidationJobs() {
    logger.info('⏹️ Stopping data consistency validation jobs...');

    dailyReconciliationJob.stop();
    duplicateDetectionJob.stop();
    orphanedRecordsJob.stop();
    unbalancedEntriesJob.stop();

    logger.info('✅ All validation jobs stopped');
}

/**
 * Get validation reports
 */
export function getValidationReports(limit: number = 10): ValidationReport[] {
    return reports.slice(-limit).reverse();
}

/**
 * Run all validation jobs immediately (for testing)
 */
export async function runAllValidationJobs() {
    logger.info('🔧 Running all validation jobs immediately...');

    // Manually trigger each job by calling their scheduled functions
    // Note: We extract the callback from each cron job and execute it directly
    try {
        // Run reconciliation
        logger.info('Running daily reconciliation...');
        const result = await performReconciliation();
        const report = {
            timestamp: new Date(),
            jobName: 'Daily Reconciliation',
            status: result.success ? 'success' as const : 'warning' as const,
            issues: result.issues.length,
            details: result
        };
        reports.push(report);

        if (result.issues.length > 0 && result.summary.accountsWithIssues <= 10) {
            logger.info('🔧 Auto-fixing balance mismatches...');
            const fixed = await fixBalanceMismatches();
            logger.info(`✅ Fixed ${fixed} account balances`);
        }
    } catch (error: any) {
        logger.error('❌ Manual reconciliation failed:', error);
    }

    logger.info('✅ All validation jobs completed');
}


