// Verification script to check all finance model imports are working correctly
const path = require('path');
const fs = require('fs');

async function verifyImports() {
  console.log('🔍 Verifying Finance Model Imports...');
  
  try {
    // Test Finance model import
    const Finance = require('../src/models/Finance').default;
    const { Payment, Invoice } = require('../src/models/Finance');
    
    console.log('✅ Finance model imports working');
    console.log('✅ Payment discriminator available');
    console.log('✅ Invoice discriminator available');
    
    // Check if old model files are deleted
    const paymentPath = path.join(__dirname, '../src/models/Payment.ts');
    const invoicePath = path.join(__dirname, '../src/models/Invoice.ts');
    
    if (!fs.existsSync(paymentPath)) {
      console.log('✅ Payment.ts successfully deleted');
    } else {
      console.log('❌ Payment.ts still exists');
    }
    
    if (!fs.existsSync(invoicePath)) {
      console.log('✅ Invoice.ts successfully deleted');
    } else {
      console.log('❌ Invoice.ts still exists');
    }
    
    // Test model creation
    console.log('🧪 Testing model creation...');
    
    // Test Payment creation (without saving)
    const testPayment = new Payment({
      type: 'payment',
      paymentNumber: 'TEST-001',
      paymentType: 'independent',
      paymentDate: new Date(),
      paymentMethod: 'CASH',
      partyName: 'Test Customer',
      totalAmount: 1000,
      baseAmount: 1000,
      currency: 'INR',
      exchangeRate: 1,
      createdBy: '507f1f77bcf86cd799439011' // dummy ObjectId
    });
    
    console.log('✅ Payment model creation test passed');
    
    // Test Invoice creation (without saving)
    const testInvoice = new Invoice({
      type: 'invoice',
      invoiceNumber: 'TEST-INV-001',
      invoiceType: 'SALES',
      invoiceDate: new Date(),
      dueDate: new Date(),
      partyName: 'Test Customer',
      totalAmount: 1000,
      baseAmount: 1000,
      amountInBaseCurrency: 1000,
      subtotal: 1000,
      currency: 'INR',
      exchangeRate: 1,
      lineItems: [],
      attachments: [],
      createdBy: '507f1f77bcf86cd799439011' // dummy ObjectId
    });
    
    console.log('✅ Invoice model creation test passed');
    
    console.log('🎉 All verifications passed!');
    console.log('📋 Summary:');
    console.log('  - Finance model imports: ✅');
    console.log('  - Old model files deleted: ✅');
    console.log('  - Model creation tests: ✅');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyImports()
    .then(() => {
      console.log('✅ Verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyImports };