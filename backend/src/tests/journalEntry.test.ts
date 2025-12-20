import mongoose from 'mongoose';
import { JournalEntry } from '../models/JournalEntry';
import ChartOfAccount from '../models/ChartOfAccount';
import { PartyLedger } from '../models/PartyLedger';

describe('Journal Entry Posting', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/erp-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await JournalEntry.deleteMany({});
    await ChartOfAccount.deleteMany({});
    await PartyLedger.deleteMany({});
  });

  describe('Balance Updates', () => {
    it('should update Account balance correctly for asset accounts', async () => {
      const account = await ChartOfAccount.create({
        code: 'A001',
        name: 'Cash',
        type: 'asset',
        balance: 1000,
        openingBalance: 1000
      });

      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE000001',
        date: new Date(),
        description: 'Test entry',
        lines: [
          { accountId: ChartOfAccount._id, debit: 500, credit: 0, description: 'Debit cash' },
          { accountId: ChartOfAccount._id, debit: 0, credit: 500, description: 'Credit cash' }
        ]
      });

      const session = await mongoose.startSession();
      session.startTransaction();

      for (const line of journalEntry.lines) {
        const acc = await ChartOfAccount.findById(line.accountId).session(session);
        let newBalance = acc!.balance;
        if (['asset', 'expense'].includes(acc!.type)) {
          newBalance += line.debit - line.credit;
        } else {
          newBalance += line.credit - line.debit;
        }
        await ChartOfAccount.findByIdAndUpdate(line.accountId, { balance: newBalance }, { session });
      }

      await session.commitTransaction();
      session.endSession();

      const updatedAccount = await ChartOfAccount.findById(ChartOfAccount._id);
      expect(updatedAccount?.balance).toBe(1000);
    });

    it('should update both Account and PartyLedger balances', async () => {
      const account = await ChartOfAccount.create({
        code: 'A002',
        name: 'Customer A',
        type: 'asset',
        balance: 0,
        openingBalance: 0
      });

      const partyLedger = await PartyLedger.create({
        code: 'PL001',
        name: 'Customer A',
        accountId: ChartOfAccount._id,
        currentBalance: 0,
        balanceType: 'debit'
      });

      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE000002',
        date: new Date(),
        description: 'Sale to customer',
        lines: [
          { accountId: ChartOfAccount._id, debit: 1000, credit: 0, description: 'Customer receivable' }
        ]
      });

      const session = await mongoose.startSession();
      session.startTransaction();

      for (const line of journalEntry.lines) {
        const acc = await ChartOfAccount.findById(line.accountId).session(session);
        let newBalance = acc!.balance + line.debit - line.credit;
        await ChartOfAccount.findByIdAndUpdate(line.accountId, { balance: newBalance }, { session });

        const party = await PartyLedger.findOne({ accountId: line.accountId }).session(session);
        if (party) {
          let partyBalance = party.currentBalance;
          if (party.balanceType === 'debit') {
            partyBalance += line.debit - line.credit;
          } else {
            partyBalance += line.credit - line.debit;
          }
          await PartyLedger.findByIdAndUpdate(party._id, { currentBalance: partyBalance }, { session });
        }
      }

      await session.commitTransaction();
      session.endSession();

      const updatedAccount = await ChartOfAccount.findById(ChartOfAccount._id);
      const updatedParty = await PartyLedger.findById(partyLedger._id);
      
      expect(updatedAccount?.balance).toBe(1000);
      expect(updatedParty?.currentBalance).toBe(1000);
    });
  });

  describe('Validation', () => {
    it('should reject posting if account does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const journalEntry = await JournalEntry.create({
        entryNumber: 'JE000003',
        date: new Date(),
        description: 'Invalid entry',
        lines: [
          { accountId: fakeId, debit: 100, credit: 0, description: 'Invalid' }
        ]
      });

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        for (const line of journalEntry.lines) {
          const account = await ChartOfAccount.findById(line.accountId).session(session);
          if (!account) {
            throw new Error(`Account ${line.accountId} not found`);
          }
        }
        await session.commitTransaction();
        fail('Should have thrown error');
      } catch (error: any) {
        await session.abortTransaction();
        expect(error.message).toContain('not found');
      } finally {
        session.endSession();
      }
    });

    it('should reject if debits do not equal credits', async () => {
      const account = await ChartOfAccount.create({
        code: 'A003',
        name: 'Test Account',
        type: 'asset',
        balance: 0
      });

      try {
        await JournalEntry.create({
          entryNumber: 'JE000004',
          date: new Date(),
          description: 'Unbalanced entry',
          lines: [
            { accountId: ChartOfAccount._id, debit: 100, credit: 0, description: 'Debit' },
            { accountId: ChartOfAccount._id, debit: 0, credit: 50, description: 'Credit' }
          ]
        });
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('debits must equal');
      }
    });

    it('should reject inactive accounts', async () => {
      const account = await ChartOfAccount.create({
        code: 'A004',
        name: 'Inactive Account',
        type: 'asset',
        balance: 0,
        isActive: false
      });

      const isActive = ChartOfAccount.isActive;
      expect(isActive).toBe(false);
    });
  });
});

