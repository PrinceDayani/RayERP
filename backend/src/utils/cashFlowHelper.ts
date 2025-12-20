import ChartOfAccount from '../models/ChartOfAccount';
import { CashFlowRule } from '../models/CashFlowRule';

interface CategoryResult {
  category: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NON_CASH';
  confidence: number;
  needsReview: boolean;
  matchedRule?: string;
}

/**
 * Determines cash flow category with confidence scoring
 */
export const determineCashFlowCategory = async (
  accountId: string,
  description: string,
  sourceType?: string,
  amount?: number
): Promise<CategoryResult | undefined> => {
  const account = await ChartOfAccount.findById(accountId);
  
  if (!account) return undefined;

  // Only categorize if it's a cash/bank account
  if (ChartOfAccount.type !== 'asset' || ChartOfAccount.subType !== 'cash') {
    return undefined;
  }

  // Check custom rules first (highest priority)
  const rules = await CashFlowRule.find({ isActive: true }).sort({ priority: -1 });
  for (const rule of rules) {
    if (matchesRule(rule, accountId, description, sourceType, amount)) {
      rule.lastAppliedAt = new Date();
      rule.applicationCount += 1;
      await rule.save();
      
      return {
        category: rule.category,
        confidence: 1.0,
        needsReview: false,
        matchedRule: rule.name
      };
    }
  }

  // Fallback to keyword-based detection
  const desc = description.toLowerCase();
  let category: 'OPERATING' | 'INVESTING' | 'FINANCING' | 'NON_CASH' = 'OPERATING';
  let confidence = 0.5;
  let needsReview = true;

  // FINANCING - High confidence keywords
  const financingKeywords = ['loan received', 'loan repayment', 'dividend paid', 'capital contribution', 'equity investment', 'share issue'];
  if (financingKeywords.some(kw => desc.includes(kw))) {
    category = 'FINANCING';
    confidence = 0.9;
    needsReview = false;
  } else if (desc.includes('loan') || desc.includes('borrow') || desc.includes('dividend')) {
    category = 'FINANCING';
    confidence = 0.7;
    needsReview = true;
  }

  // INVESTING - High confidence keywords
  const investingKeywords = ['equipment purchase', 'asset purchase', 'asset sale', 'property purchase', 'machinery purchase'];
  if (investingKeywords.some(kw => desc.includes(kw))) {
    category = 'INVESTING';
    confidence = 0.9;
    needsReview = false;
  } else if (desc.includes('equipment') || desc.includes('investment') || desc.includes('property')) {
    category = 'INVESTING';
    confidence = 0.7;
    needsReview = true;
  }

  // OPERATING - High confidence
  const operatingKeywords = ['customer payment', 'supplier payment', 'salary', 'rent payment', 'utility payment'];
  if (operatingKeywords.some(kw => desc.includes(kw)) || sourceType === 'INVOICE' || sourceType === 'PAYROLL') {
    category = 'OPERATING';
    confidence = 0.85;
    needsReview = false;
  } else if (desc.includes('sales') || desc.includes('expense') || desc.includes('payment')) {
    category = 'OPERATING';
    confidence = 0.6;
    needsReview = true;
  }

  return { category, confidence, needsReview };
};

function matchesRule(
  rule: any,
  accountId: string,
  description: string,
  sourceType?: string,
  amount?: number
): boolean {
  const cond = rule.conditions;
  
  if (cond.accountIds?.length && !cond.accountIds.some((id: any) => id.toString() === accountId)) {
    return false;
  }
  
  if (cond.sourceTypes?.length && (!sourceType || !cond.sourceTypes.includes(sourceType))) {
    return false;
  }
  
  if (cond.descriptionContains?.length) {
    const desc = description.toLowerCase();
    if (!cond.descriptionContains.some((kw: string) => desc.includes(kw.toLowerCase()))) {
      return false;
    }
  }
  
  if (cond.descriptionRegex) {
    const regex = new RegExp(cond.descriptionRegex, 'i');
    if (!regex.test(description)) {
      return false;
    }
  }
  
  if (amount !== undefined) {
    if (cond.amountMin !== undefined && amount < cond.amountMin) return false;
    if (cond.amountMax !== undefined && amount > cond.amountMax) return false;
  }
  
  return true;
}

/**
 * Check if transaction is non-cash
 */
export const isNonCashTransaction = (description: string, sourceType?: string): boolean => {
  const desc = description.toLowerCase();
  
  return (
    desc.includes('depreciation') ||
    desc.includes('amortization') ||
    desc.includes('accrual') ||
    desc.includes('provision') ||
    sourceType === 'DEPRECIATION' ||
    sourceType === 'ACCRUAL'
  );
};


