# ⚡ Enhanced Journal Entry - Quick Start Guide

## 🎯 Get Started in 5 Minutes

### 1. Access Journal Entry
```
Navigate to: Dashboard → Finance → Journal Entry
```

### 2. Create Your First Entry with Template

**Option A: Use Quick Template**
1. Click **"Quick Actions"** tab
2. Select "Depreciation", "Accrual", or "Payroll"
3. Fill in account numbers and amounts
4. Click **"Create Entry"**

**Option B: Load Saved Template**
1. Click **"Templates"** button (top right)
2. Browse template library
3. Click on template to load
4. Adjust amounts as needed
5. Click **"Create Entry"**

### 3. Add Attachments (Optional)
1. Scroll to **"Attachments"** section
2. Click upload area or drag files
3. Supported: PDF, JPG, PNG, DOC, DOCX
4. Max 10MB per file
5. Remove unwanted files with X button

### 4. Real-time Validation
Watch for automatic alerts:
- 🟡 **Yellow Alert**: Similar entry detected
- 🔴 **Red Alert**: Budget exceeded
- 🟢 **Green Badge**: Entry balanced

### 5. Save as Template
1. Fill out entry form
2. Click **"Save as Template"** button
3. Enter template name
4. Template saved for future use

### 6. Batch Import (Advanced)
1. Click **"Batch Import"** button
2. Download CSV template
3. Fill with your data:
```csv
entryDate,description,lines
2024-01-01,"Rent Payment","[{\"accountId\":\"601\",\"debit\":5000,\"credit\":0,\"description\":\"Rent expense\"},{\"accountId\":\"101\",\"debit\":0,\"credit\":5000,\"description\":\"Cash payment\"}]"
```
4. Upload completed CSV
5. Review import results

### 7. Duplicate Recent Entry
1. Click **"Recent Entries"** tab
2. Find entry to copy
3. Click **"Duplicate"** button
4. Modify date/amounts
5. Submit new entry

## 🎨 UI Overview

```
┌─────────────────────────────────────────────────────┐
│  Enhanced Journal Entry                             │
│  [Templates] [Batch Import] [Save as Template]      │
├─────────────────────────────────────────────────────┤
│  [New Entry] [Quick Actions] [Recent Entries]       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ⚠️ Similar entry found in recent transactions      │
│                                                      │
│  Date: [____] Reference: [____] Description: [____] │
│                                                      │
│  Journal Lines:                                      │
│  Account          Debit    Credit   Description     │
│  [Select...]      [0.00]   [0.00]   [________]      │
│  [Select...]      [0.00]   [0.00]   [________]      │
│  [+ Add Line]                                        │
│                                                      │
│  📎 Attachments:                                     │
│  [Click to upload or drag and drop]                 │
│  • invoice.pdf (245 KB) [X]                         │
│                                                      │
│  Total Debits: $1,000.00                            │
│  Total Credits: $1,000.00                           │
│  Status: ✅ Balanced                                │
│                                                      │
│  [Reset] [Create Entry]                             │
└─────────────────────────────────────────────────────┘
```

## 💡 Pro Tips

### Keyboard Shortcuts
- **Tab**: Navigate between fields
- **Enter**: Submit form (when balanced)
- **Esc**: Close dialogs

### Best Practices
1. **Use Templates**: Save 80% of time on recurring entries
2. **Attach Documents**: Always attach supporting documents
3. **Check Warnings**: Review budget alerts before submitting
4. **Duplicate Wisely**: Use duplicate for similar transactions
5. **Batch Import**: Use for month-end bulk entries

### Common Workflows

**Monthly Depreciation:**
1. Load "Depreciation" quick template
2. Enter asset accounts and amounts
3. Attach depreciation schedule
4. Submit

**Expense Accrual:**
1. Load "Accrual" quick template
2. Select expense and liability accounts
3. Enter accrual amount
4. Attach vendor invoice
5. Submit

**Payroll Entry:**
1. Load "Payroll" quick template
2. Enter salary accounts
3. Attach payroll report
4. Submit

**Bulk Month-End:**
1. Prepare CSV with all entries
2. Click "Batch Import"
3. Upload CSV
4. Review imported entries

## 🔍 Troubleshooting

### Entry Not Balanced
- Check all debit/credit amounts
- Ensure no empty fields
- Verify decimal places

### Template Not Loading
- Refresh page
- Check internet connection
- Verify template exists

### File Upload Failed
- Check file size (max 10MB)
- Verify file type (PDF, JPG, PNG, DOC, DOCX)
- Try different file

### CSV Import Error
- Download template again
- Check JSON format in lines column
- Verify account IDs exist
- Ensure dates are YYYY-MM-DD

### Budget Warning Showing
- Review budget allocation
- Check if warning is expected
- Contact finance manager if needed
- Warning is informational (can still submit)

## 📊 Feature Comparison

| Feature | Basic Entry | Enhanced Entry |
|---------|-------------|----------------|
| Manual Entry | ✅ | ✅ |
| Templates | ❌ | ✅ |
| Quick Actions | ❌ | ✅ |
| Attachments | ❌ | ✅ |
| Real-time Validation | ❌ | ✅ |
| Duplicate Detection | ❌ | ✅ |
| Budget Warnings | ❌ | ✅ |
| Batch Import | ❌ | ✅ |
| Recent Entry Duplication | ❌ | ✅ |

## 🎓 Training Resources

### Video Tutorials (Coming Soon)
- Creating your first entry
- Using templates effectively
- Batch import walkthrough
- Attachment best practices

### Sample Data
Use these for testing:
```
Account 101 - Cash
Account 201 - Accounts Payable
Account 401 - Revenue
Account 501 - Rent Expense
Account 601 - Salary Expense
```

## 📞 Need Help?

- **In-App Help**: Hover over ? icons
- **Documentation**: See JOURNAL_ENTRY_ENHANCED.md
- **Support**: Contact system administrator
- **Training**: Request training session

## ✅ Quick Checklist

Before submitting an entry:
- [ ] All fields filled correctly
- [ ] Debits equal credits (green badge)
- [ ] Supporting documents attached
- [ ] Budget warnings reviewed
- [ ] Duplicate warning checked
- [ ] Description is clear
- [ ] Date is correct
- [ ] Reference number added

## 🚀 Next Steps

1. **Create 3 entries** using different methods
2. **Save 2 templates** for common transactions
3. **Try batch import** with sample CSV
4. **Explore recent entries** tab
5. **Practice duplication** feature

---

**Time to Master**: 15 minutes
**Difficulty**: Easy
**Prerequisites**: Basic accounting knowledge

**Ready to start?** Navigate to Finance → Journal Entry now! 🎉
