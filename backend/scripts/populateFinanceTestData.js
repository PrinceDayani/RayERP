const mongoose = require('mongoose');
require('dotenv').config();

const populateFinanceTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get existing projects and departments
    const projects = await db.collection('projects').find({}).limit(20).toArray();
    const departments = await db.collection('departments').find({}).limit(20).toArray();
    
    if (projects.length === 0) {
      console.log('⚠️  No projects found. Creating sample projects...');
      const projectData = [];
      for (let i = 0; i < 20; i++) {
        projectData.push({
          name: `Project ${String.fromCharCode(65 + i)}`,
          description: `Sample project ${i + 1}`,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      const insertedProjects = await db.collection('projects').insertMany(projectData);
      projects.push(...Object.values(insertedProjects.insertedIds).map((id, i) => ({ _id: id, name: projectData[i].name })));
    }

    if (departments.length === 0) {
      console.log('⚠️  No departments found. Creating sample departments...');
      const deptData = [];
      const deptNames = ['Finance', 'HR', 'IT', 'Sales', 'Marketing', 'Operations', 'R&D', 'Admin', 'Legal', 'Support'];
      for (let i = 0; i < 10; i++) {
        deptData.push({
          name: deptNames[i],
          description: `${deptNames[i]} department`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      const insertedDepts = await db.collection('departments').insertMany(deptData);
      departments.push(...Object.values(insertedDepts.insertedIds).map((id, i) => ({ _id: id, name: deptData[i].name })));
    }

    // 1. Create 10 Account Groups
    console.log('\n📁 Creating 10 Account Groups...');
    const groupData = [];
    const groupTypes = ['assets', 'liabilities', 'income', 'expenses'];
    const groupNames = ['Current Assets', 'Fixed Assets', 'Current Liabilities', 'Long-term Liabilities', 'Equity',
      'Operating Revenue', 'Non-Operating Revenue', 'Operating Expenses', 'Administrative Expenses', 'Financial Expenses'];
    
    for (let i = 0; i < 10; i++) {
      groupData.push({
        code: `AG${String(i + 1).padStart(3, '0')}`,
        name: groupNames[i],
        type: groupTypes[i % 4],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    const groups = await db.collection('accountgroups').insertMany(groupData);
    console.log(`✅ Created ${groups.insertedCount} groups`);
    const groupIds = Object.values(groups.insertedIds);

    // 2. Create nested Sub-Groups (Level 1: 10 per group, Level 2: 5 per L1, Level 3: 2 per L2)
    console.log('\n📂 Creating nested Sub-Groups...');
    const subGroupData = [];
    const subGroupBaseNames = ['Cash & Bank', 'Receivables', 'Inventory', 'Investments', 'Prepaid', 
      'Machinery', 'Vehicles', 'Buildings', 'Equipment', 'Furniture'];
    
    // Level 1: 10 sub-groups per group
    for (let g = 0; g < 10; g++) {
      for (let s = 0; s < 10; s++) {
        subGroupData.push({
          code: `ASG${String(g * 10 + s + 1).padStart(3, '0')}`,
          name: `${groupNames[g]} - ${subGroupBaseNames[s]}`,
          groupId: groupIds[g],
          parentSubGroupId: null,
          level: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    const level1SubGroups = await db.collection('accountsubgroups').insertMany(subGroupData);
    console.log(`✅ Created ${level1SubGroups.insertedCount} level-1 sub-groups`);
    const level1Ids = Object.values(level1SubGroups.insertedIds);
    
    // Level 2: 5 sub-groups per level-1 (500 total)
    const level2Data = [];
    for (let i = 0; i < level1Ids.length; i++) {
      for (let j = 0; j < 5; j++) {
        level2Data.push({
          code: `ASG2-${String(i * 5 + j + 1).padStart(4, '0')}`,
          name: `Sub-Level 2.${j + 1}`,
          groupId: groupIds[Math.floor(i / 10)],
          parentSubGroupId: level1Ids[i],
          level: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    const level2SubGroups = await db.collection('accountsubgroups').insertMany(level2Data);
    console.log(`✅ Created ${level2SubGroups.insertedCount} level-2 sub-groups`);
    const level2Ids = Object.values(level2SubGroups.insertedIds);
    
    // Level 3: 2 sub-groups per level-2 (1000 total)
    const level3Data = [];
    for (let i = 0; i < level2Ids.length; i++) {
      for (let j = 0; j < 2; j++) {
        level3Data.push({
          code: `ASG3-${String(i * 2 + j + 1).padStart(4, '0')}`,
          name: `Sub-Level 3.${j + 1}`,
          groupId: groupIds[Math.floor(i / 50)],
          parentSubGroupId: level2Ids[i],
          level: 3,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    const level3SubGroups = await db.collection('accountsubgroups').insertMany(level3Data);
    console.log(`✅ Created ${level3SubGroups.insertedCount} level-3 sub-groups`);
    const level3Ids = Object.values(level3SubGroups.insertedIds);
    
    const subGroupIds = [...level1Ids, ...level2Ids, ...level3Ids];

    // 3. Create 2 Ledgers per deepest Sub-Group (2000 total)
    console.log('\n📒 Creating 2 Ledgers per level-3 Sub-Group (2000 total)...');
    const ledgerData = [];
    
    for (let sg = 0; sg < level3Ids.length; sg++) {
      for (let l = 0; l < 2; l++) {
        ledgerData.push({
          code: `AL${String(sg * 2 + l + 1).padStart(5, '0')}`,
          name: `Ledger ${sg + 1}-${l + 1}`,
          subGroupId: level3Ids[sg],
          openingBalance: Math.floor(Math.random() * 100000) + 10000,
          currentBalance: Math.floor(Math.random() * 100000) + 10000,
          balanceType: l % 2 === 0 ? 'debit' : 'credit',
          currency: 'INR',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    const ledgers = await db.collection('accountledgers').insertMany(ledgerData);
    console.log(`✅ Created ${ledgers.insertedCount} ledgers`);
    const ledgerIds = Object.values(ledgers.insertedIds);

    // 4. Create Journal Entries (40 entries)
    console.log('\n📝 Creating Journal Entries (40 entries)...');
    const journalData = [];
    const descriptions = ['Sales Transaction', 'Payment to Supplier', 'Salary Payment', 'Rent Payment', 'Utility Payment',
      'Equipment Purchase', 'Loan Repayment', 'Customer Payment', 'Service Revenue', 'Interest Income',
      'Marketing Expense', 'Travel Expense', 'Office Supplies', 'Insurance Payment', 'Tax Payment',
      'Dividend Payment', 'Asset Sale', 'Inventory Purchase', 'Consulting Fees', 'Maintenance Expense',
      'Commission Payment', 'Bonus Distribution', 'Advance Payment', 'Refund Received', 'Discount Given',
      'Bank Charges', 'Loan Interest', 'Depreciation Entry', 'Bad Debt Write-off', 'Provision Entry',
      'Capital Investment', 'Drawings', 'Purchase Return', 'Sales Return', 'Freight Charges',
      'Customs Duty', 'Professional Fees', 'License Renewal', 'Software Purchase', 'Training Expense'];
    
    for (let i = 0; i < 40; i++) {
      const amount = Math.floor(Math.random() * 50000) + 10000;
      journalData.push({
        entryNumber: `JE${String(i + 1).padStart(3, '0')}`,
        date: new Date(2024, i % 12, (i % 28) + 1),
        reference: `REF-${String(i + 1).padStart(3, '0')}`,
        description: descriptions[i],
        lines: [
          { ledgerId: ledgerIds[i % ledgerIds.length], debit: amount, credit: 0, description: descriptions[i] },
          { ledgerId: ledgerIds[(i + 1) % ledgerIds.length], debit: 0, credit: amount, description: descriptions[i] }
        ],
        totalDebit: amount,
        totalCredit: amount,
        isPosted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    const journalEntries = await db.collection('journalentries').insertMany(journalData);
    console.log(`✅ Created ${journalEntries.insertedCount} journal entries`);

    // 5. Create Budget Templates (40 entries)
    console.log('\n📋 Creating Budget Templates (40 entries)...');
    const templateData = [];
    const templateNames = ['Annual Budget', 'Quarterly Budget', 'Monthly Budget', 'Project Budget', 'Department Budget',
      'Sales Budget', 'Marketing Budget', 'Operations Budget', 'IT Budget', 'HR Budget',
      'Finance Budget', 'Admin Budget', 'R&D Budget', 'Capital Budget', 'Cash Flow Budget',
      'Revenue Budget', 'Expense Budget', 'Zero-Based Budget', 'Flexible Budget', 'Master Budget',
      'Production Budget', 'Purchase Budget', 'Labor Budget', 'Overhead Budget', 'Sales Forecast',
      'Cost Budget', 'Investment Budget', 'Working Capital Budget', 'Performance Budget', 'Program Budget',
      'Activity Budget', 'Incremental Budget', 'Rolling Budget', 'Static Budget', 'Kaizen Budget',
      'Value Proposition Budget', 'Priority Budget', 'Line Item Budget', 'Functional Budget', 'Comprehensive Budget'];
    
    for (let i = 0; i < 40; i++) {
      templateData.push({
        name: templateNames[i],
        description: `${templateNames[i]} template for planning`,
        categories: [
          { name: 'Revenue', type: 'income', accounts: [] },
          { name: 'Expenses', type: 'expense', accounts: [] }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    const budgetTemplates = await db.collection('budgettemplates').insertMany(templateData);
    console.log(`✅ Created ${budgetTemplates.insertedCount} budget templates`);

    // 6. Create Budgets linked to Projects/Departments (40 entries)
    console.log('\n💰 Creating Budgets (40 entries, linked to projects/departments)...');
    const budgetData = [];
    const statuses = ['draft', 'pending', 'approved', 'active', 'closed'];
    const budgetTypes = ['project', 'department'];
    
    for (let i = 0; i < 40; i++) {
      const totalBudget = Math.floor(Math.random() * 500000) + 100000;
      const actualSpent = Math.floor(totalBudget * (Math.random() * 0.7));
      const isProjectBudget = i % 2 === 0;
      
      budgetData.push({
        projectId: isProjectBudget ? projects[i % projects.length]._id : null,
        departmentId: !isProjectBudget ? departments[i % departments.length]._id : null,
        projectName: isProjectBudget ? projects[i % projects.length].name : departments[i % departments.length].name,
        fiscalYear: 2024,
        fiscalPeriod: `Q${(i % 4) + 1}`,
        totalBudget,
        actualSpent,
        remainingBudget: totalBudget - actualSpent,
        utilizationPercentage: (actualSpent / totalBudget) * 100,
        currency: 'INR',
        status: statuses[i % statuses.length],
        budgetType: budgetTypes[i % 2],
        categories: [
          { 
            name: 'Labor', 
            type: 'labor', 
            allocatedAmount: totalBudget * 0.4, 
            spentAmount: actualSpent * 0.4,
            items: [{ name: 'Staff Cost', quantity: 1, unitCost: totalBudget * 0.4, totalCost: totalBudget * 0.4 }]
          },
          { 
            name: 'Materials', 
            type: 'materials', 
            allocatedAmount: totalBudget * 0.3, 
            spentAmount: actualSpent * 0.3,
            items: [{ name: 'Raw Materials', quantity: 1, unitCost: totalBudget * 0.3, totalCost: totalBudget * 0.3 }]
          },
          { 
            name: 'Equipment', 
            type: 'equipment', 
            allocatedAmount: totalBudget * 0.2, 
            spentAmount: actualSpent * 0.2,
            items: [{ name: 'Tools & Equipment', quantity: 1, unitCost: totalBudget * 0.2, totalCost: totalBudget * 0.2 }]
          },
          { 
            name: 'Overhead', 
            type: 'overhead', 
            allocatedAmount: totalBudget * 0.1, 
            spentAmount: actualSpent * 0.1,
            items: [{ name: 'Miscellaneous', quantity: 1, unitCost: totalBudget * 0.1, totalCost: totalBudget * 0.1 }]
          }
        ],
        approvals: [],
        createdBy: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    const budgets = await db.collection('budgets').insertMany(budgetData);
    console.log(`✅ Created ${budgets.insertedCount} budgets`);

    console.log('\n🎉 All finance test data populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Account Groups: ${groups.insertedCount}`);
    console.log(`   - Account Sub-Groups: ${subGroups.insertedCount} (10 per group)`);
    console.log(`   - Account Ledgers: ${ledgers.insertedCount} (40 per sub-group)`);
    console.log(`   - Journal Entries: ${journalEntries.insertedCount}`);
    console.log(`   - Budget Templates: ${budgetTemplates.insertedCount}`);
    console.log(`   - Budgets: ${budgets.insertedCount} (linked to projects/departments)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

populateFinanceTestData();
