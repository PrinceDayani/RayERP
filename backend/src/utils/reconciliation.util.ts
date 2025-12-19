import { Account } from '../models/Account';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
import { logger } from '../utils/logger';

interface ReconciliationResult {
    success: boolean;
    issues: ReconciliationIssue[];
    summary: {
        totalAccounts: number;
        accountsWithIssues: number;
        totalEntries: number;
        unbalancedEntries: number;
    };
}

interface ReconciliationIssue {
    type: 'BALANCE_MISMATCH' | 'UNBALANCED_ENTRY' | 'MISSING_LEDGER' | 'ORPHANED_ENTRY';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    accountCode?: string;
    accountName?: string;
    entryNumber?: string;
    expected?: number;
    actual?: number;
    message: string;
}

/**
 * Perform automated reconciliation checks
 * - Verify account balances match ledger totals
 * - Check for unbalanced journal entries
 * - Detect orphaned ledger entries
 */
export async function performReconciliation(): Promise<ReconciliationResult> {
    logger.info('Starting automated reconciliation...');

    const issues: ReconciliationIssue[] = [];
    let totalAccounts = 0;
    let accountsWithIssues = 0;
    let totalEntries = 0;
    let unbalancedEntries = 0;

    try {
        // Check 1: Verify account balances
        const accounts = await Account.find({ isActive: true });
        totalAccounts = accounts.length;

        for (const account of accounts) {
            const ledgerEntries = await Ledger.find({ accountId: account._id });

            const calculatedBalance = ledgerEntries.reduce(
                (sum, entry) => sum + entry.debit - entry.credit,
                0
            );

            const balanceDiff = Math.abs(account.balance - calculatedBalance);

            if (balanceDiff > 0.01) { // Allow 1 paisa tolerance for rounding
                accountsWithIssues++;
                issues.push({
                    type: 'BALANCE_MISMATCH',
                    severity: balanceDiff > 1000 ? 'HIGH' : balanceDiff > 10 ? 'MEDIUM' : 'LOW',
                    accountCode: account.code,
                    accountName: account.name,
                    expected: calculatedBalance,
                    actual: account.balance,
                    message: `Account balance mismatch: Expected ${calculatedBalance}, Actual ${account.balance}`
                });
            }
        }

        // Check 2: Verify journal entries are balanced
        const journalEntries = await JournalEntry.find({ status: 'posted' });
        totalEntries = journalEntries.length;

        for (const entry of journalEntries) {
            const debitTotal = entry.lines?.reduce((sum: number, line: any) => sum + (line.debit || 0), 0) || 0;
            const creditTotal = entry.lines?.reduce((sum: number, line: any) => sum + (line.credit || 0), 0) || 0;

            const diff = Math.abs(debitTotal - creditTotal);

            if (diff > 0.01) {
                unbalancedEntries++;
                issues.push({
                    type: 'UNBALANCED_ENTRY',
                    severity: 'HIGH',
                    entryNumber: entry.entryNumber,
                    expected: debitTotal,
                    actual: creditTotal,
                    message: `Unbalanced journal entry: Debit ${debitTotal}, Credit ${creditTotal}`
                });
            }
        }

        // Check 3: Detect orphaned ledger entries (entries without account)
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
            },
            {
                $limit: 100
            }
        ]);

        orphanedLedgers.forEach((ledger) => {
            issues.push({
                type: 'ORPHANED_ENTRY',
                severity: 'MEDIUM',
                message: `Orphaned ledger entry found: ${ledger._id}`,
            });
        });

        logger.info(`Reconciliation complete: ${issues.length} issues found`);

        return {
            success: issues.length === 0,
            issues,
            summary: {
                totalAccounts,
                accountsWithIssues,
                totalEntries,
                unbalancedEntries
            }
        };
    } catch (error: any) {
        logger.error('Reconciliation error:', error);
        throw new Error(`Reconciliation failed: ${error.message}`);
    }
}

/**
 * Fix account balance mismatches by recalculating from ledger
 */
export async function fixBalanceMismatches(accountIds?: string[]): Promise<number> {
    let query: any = { isActive: true };
    if (accountIds && accountIds.length > 0) {
        query._id = { $in: accountIds };
    }

    const accounts = await Account.find(query);
    let fixed = 0;

    for (const account of accounts) {
        const ledgerEntries = await Ledger.find({ accountId: account._id });

        const calculatedBalance = ledgerEntries.reduce(
            (sum, entry) => sum + entry.debit - entry.credit,
            0
        );

        if (Math.abs(account.balance - calculatedBalance) > 0.01) {
            account.balance = calculatedBalance;
            await account.save();
            fixed++;
            logger.info(`Fixed balance for account ${account.code}: ${calculatedBalance}`);
        }
    }

    return fixed;
}
