/**
 * Seed script for pre-built workflow templates for infrastructure companies.
 * Run: node scripts/seedWorkflowTemplates.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

const workflowTemplates = [
  // ==========================================
  // 1. PURCHASE ORDER APPROVAL WORKFLOW
  // ==========================================
  {
    name: 'Purchase Order Approval',
    description: 'Multi-level approval workflow for purchase orders based on amount thresholds. Routes through site engineer, project manager, and management based on PO value.',
    category: 'procurement',
    entityType: 'purchase-order',
    version: 1,
    isActive: true,
    isDefault: true,
    priority: 'high',
    estimatedDurationHours: 48,
    tags: ['procurement', 'approval', 'purchase'],
    trigger: {
      type: 'entity-created',
      entityType: 'purchase-order'
    },
    steps: [
      {
        stepId: 'po-review',
        name: 'Site Engineer Review',
        description: 'Site engineer verifies material requirements and specifications',
        type: 'approval',
        order: 1,
        approverType: 'role',
        approverRoles: ['site-engineer'],
        approvalMode: 'any',
        sla: { expectedHours: 8, warningHours: 6 },
        escalation: { enabled: true, afterHours: 12, escalateTo: 'department-head', maxEscalations: 2 },
        nextSteps: ['po-condition']
      },
      {
        stepId: 'po-condition',
        name: 'Amount Check',
        description: 'Route based on PO amount',
        type: 'condition',
        order: 2,
        conditions: [{ field: 'totalAmount', operator: 'greater-than', value: 500000 }],
        trueBranch: 'po-mgmt-approval',
        falseBranch: 'po-pm-approval',
        nextSteps: ['po-mgmt-approval', 'po-pm-approval']
      },
      {
        stepId: 'po-pm-approval',
        name: 'Project Manager Approval',
        description: 'Project manager approves PO for amounts under ₹5L',
        type: 'approval',
        order: 3,
        approverType: 'project-manager',
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        escalation: { enabled: true, afterHours: 36, escalateTo: 'department-head', maxEscalations: 2 },
        nextSteps: ['po-notify'],
        isTerminal: false
      },
      {
        stepId: 'po-mgmt-approval',
        name: 'Management Approval',
        description: 'Senior management approval for high-value POs (>₹5L)',
        type: 'approval',
        order: 3,
        approverType: 'role',
        approverRoles: ['director', 'cfo'],
        approvalMode: 'any',
        sla: { expectedHours: 48, warningHours: 36 },
        escalation: { enabled: true, afterHours: 72, escalateTo: 'admin', maxEscalations: 1 },
        nextSteps: ['po-notify'],
        isTerminal: false
      },
      {
        stepId: 'po-notify',
        name: 'Notify Procurement Team',
        type: 'notification',
        order: 4,
        notificationConfig: {
          recipients: 'custom',
          customRecipientRoles: ['procurement-manager'],
          template: 'Purchase Order {{entityTitle}} has been approved and is ready for processing.',
          channels: ['in-app', 'email']
        },
        isTerminal: true
      }
    ]
  },

  // ==========================================
  // 2. WORK ORDER LIFECYCLE WORKFLOW
  // ==========================================
  {
    name: 'Work Order Lifecycle',
    description: 'Complete lifecycle management for work orders - from creation through approval, execution, and completion with quality checks.',
    category: 'operations',
    entityType: 'work-order',
    version: 1,
    isActive: true,
    isDefault: true,
    priority: 'high',
    estimatedDurationHours: 720, // 30 days
    tags: ['work-order', 'subcontractor', 'operations'],
    trigger: {
      type: 'status-changed',
      entityType: 'work-order',
      statusFrom: 'draft',
      statusTo: 'pending-approval'
    },
    steps: [
      {
        stepId: 'wo-technical-review',
        name: 'Technical Review',
        description: 'Engineering team reviews work order scope, BOQ items, and technical specifications',
        type: 'approval',
        order: 1,
        approverType: 'role',
        approverRoles: ['senior-engineer', 'technical-lead'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['wo-commercial-review']
      },
      {
        stepId: 'wo-commercial-review',
        name: 'Commercial Review',
        description: 'Finance team reviews rates, payment terms, and budget availability',
        type: 'approval',
        order: 2,
        approverType: 'role',
        approverRoles: ['finance-manager', 'accounts-manager'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['wo-final-approval']
      },
      {
        stepId: 'wo-final-approval',
        name: 'Final Approval',
        description: 'Project manager or director gives final approval',
        type: 'approval',
        order: 3,
        approverType: 'project-manager',
        approvalMode: 'any',
        sla: { expectedHours: 48, warningHours: 24 },
        escalation: { enabled: true, afterHours: 72, escalateTo: 'department-head', maxEscalations: 2 },
        nextSteps: ['wo-issue-notify']
      },
      {
        stepId: 'wo-issue-notify',
        name: 'Issue Work Order',
        type: 'auto-action',
        order: 4,
        actions: [
          { type: 'change-status', config: { newStatus: 'issued' } },
          { type: 'send-notification', config: { template: 'Work Order {{entityTitle}} has been approved and issued.', channels: ['in-app', 'email'] } }
        ],
        nextSteps: ['wo-execution'],
        isTerminal: false
      },
      {
        stepId: 'wo-execution',
        name: 'Work Execution',
        description: 'Track work execution and progress updates',
        type: 'task',
        order: 5,
        taskConfig: {
          title: 'Execute Work Order',
          description: 'Complete the work as per work order specifications',
          assigneeType: 'dynamic',
          priority: 'high'
        },
        nextSteps: ['wo-quality-check'],
        isTerminal: false
      },
      {
        stepId: 'wo-quality-check',
        name: 'Quality Inspection',
        description: 'Quality team inspects completed work',
        type: 'approval',
        order: 6,
        approverType: 'role',
        approverRoles: ['quality-inspector', 'site-engineer'],
        approvalMode: 'any',
        sla: { expectedHours: 48, warningHours: 24 },
        isTerminal: true
      }
    ]
  },

  // ==========================================
  // 3. BOQ APPROVAL WORKFLOW
  // ==========================================
  {
    name: 'BOQ Approval & Activation',
    description: 'Bill of Quantities approval workflow with technical and commercial review before activation.',
    category: 'project',
    entityType: 'boq',
    version: 1,
    isActive: true,
    isDefault: true,
    priority: 'high',
    estimatedDurationHours: 72,
    tags: ['boq', 'estimation', 'project'],
    trigger: {
      type: 'status-changed',
      entityType: 'boq',
      statusFrom: 'draft',
      statusTo: 'approved'
    },
    steps: [
      {
        stepId: 'boq-quantity-review',
        name: 'Quantity Surveyor Review',
        description: 'QS verifies quantities, rates, and specifications',
        type: 'approval',
        order: 1,
        approverType: 'role',
        approverRoles: ['quantity-surveyor', 'estimation-engineer'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['boq-pm-approval']
      },
      {
        stepId: 'boq-pm-approval',
        name: 'Project Manager Approval',
        description: 'PM reviews and approves the BOQ for the project',
        type: 'approval',
        order: 2,
        approverType: 'project-manager',
        approvalMode: 'any',
        sla: { expectedHours: 48, warningHours: 24 },
        nextSteps: ['boq-activate']
      },
      {
        stepId: 'boq-activate',
        name: 'Activate BOQ',
        type: 'auto-action',
        order: 3,
        actions: [
          { type: 'change-status', config: { newStatus: 'active' } },
          { type: 'send-notification', config: { template: 'BOQ for project has been approved and activated.', channels: ['in-app'] } }
        ],
        isTerminal: true
      }
    ]
  },

  // ==========================================
  // 4. PAYMENT PROCESSING WORKFLOW
  // ==========================================
  {
    name: 'Payment Processing',
    description: 'Multi-level payment approval workflow with amount-based routing for subcontractor and vendor payments.',
    category: 'finance',
    entityType: 'payment',
    version: 1,
    isActive: true,
    isDefault: true,
    priority: 'high',
    estimatedDurationHours: 72,
    tags: ['payment', 'finance', 'approval'],
    trigger: {
      type: 'entity-created',
      entityType: 'payment'
    },
    steps: [
      {
        stepId: 'pay-verify',
        name: 'Payment Verification',
        description: 'Accounts team verifies invoice, work completion, and payment details',
        type: 'approval',
        order: 1,
        approverType: 'role',
        approverRoles: ['accounts-executive', 'accounts-manager'],
        approvalMode: 'any',
        sla: { expectedHours: 12, warningHours: 8 },
        nextSteps: ['pay-amount-check']
      },
      {
        stepId: 'pay-amount-check',
        name: 'Amount Routing',
        type: 'condition',
        order: 2,
        conditions: [{ field: 'amount', operator: 'greater-than', value: 1000000 }],
        trueBranch: 'pay-director-approval',
        falseBranch: 'pay-fm-approval',
        nextSteps: ['pay-director-approval', 'pay-fm-approval']
      },
      {
        stepId: 'pay-fm-approval',
        name: 'Finance Manager Approval',
        description: 'Finance manager approves payments under ₹10L',
        type: 'approval',
        order: 3,
        approverType: 'role',
        approverRoles: ['finance-manager'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['pay-process'],
        isTerminal: false
      },
      {
        stepId: 'pay-director-approval',
        name: 'Director Approval',
        description: 'Director approval required for payments over ₹10L',
        type: 'approval',
        order: 3,
        approverType: 'role',
        approverRoles: ['director', 'md'],
        approvalMode: 'any',
        sla: { expectedHours: 48, warningHours: 24 },
        escalation: { enabled: true, afterHours: 72, escalateTo: 'admin', maxEscalations: 1 },
        nextSteps: ['pay-process'],
        isTerminal: false
      },
      {
        stepId: 'pay-process',
        name: 'Process Payment',
        type: 'auto-action',
        order: 4,
        actions: [
          { type: 'change-status', config: { newStatus: 'approved' } },
          { type: 'send-notification', config: { template: 'Payment of ₹{{amount}} has been approved for processing.', channels: ['in-app', 'email'] } }
        ],
        isTerminal: true
      }
    ]
  },

  // ==========================================
  // 5. PROJECT INITIATION WORKFLOW
  // ==========================================
  {
    name: 'Project Initiation',
    description: 'Workflow for new project setup - ensures all departments are aligned before project goes active.',
    category: 'project',
    entityType: 'project',
    version: 1,
    isActive: true,
    isDefault: true,
    priority: 'high',
    estimatedDurationHours: 168, // 7 days
    tags: ['project', 'initiation', 'setup'],
    trigger: {
      type: 'entity-created',
      entityType: 'project'
    },
    steps: [
      {
        stepId: 'proj-feasibility',
        name: 'Feasibility Assessment',
        description: 'Technical team assesses project feasibility and resource requirements',
        type: 'task',
        order: 1,
        taskConfig: {
          title: 'Complete Feasibility Assessment',
          description: 'Assess technical feasibility, resource availability, and timeline viability',
          assigneeType: 'role',
          assigneeRoles: ['technical-lead'],
          dueInDays: 3,
          priority: 'high'
        },
        nextSteps: ['proj-budget-review']
      },
      {
        stepId: 'proj-budget-review',
        name: 'Budget Review',
        description: 'Finance reviews and allocates project budget',
        type: 'approval',
        order: 2,
        approverType: 'role',
        approverRoles: ['finance-manager', 'cfo'],
        approvalMode: 'any',
        sla: { expectedHours: 48, warningHours: 24 },
        nextSteps: ['proj-resource-allocation']
      },
      {
        stepId: 'proj-resource-allocation',
        name: 'Resource Allocation',
        description: 'HR/Operations allocates team members and equipment',
        type: 'task',
        order: 3,
        taskConfig: {
          title: 'Allocate Project Resources',
          description: 'Assign team members, equipment, and materials to the project',
          assigneeType: 'role',
          assigneeRoles: ['hr-manager', 'operations-manager'],
          dueInDays: 2,
          priority: 'high'
        },
        nextSteps: ['proj-kickoff-approval']
      },
      {
        stepId: 'proj-kickoff-approval',
        name: 'Project Kickoff Approval',
        description: 'Final approval to activate the project',
        type: 'approval',
        order: 4,
        approverType: 'role',
        approverRoles: ['director', 'md'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['proj-activate']
      },
      {
        stepId: 'proj-activate',
        name: 'Activate Project',
        type: 'auto-action',
        order: 5,
        actions: [
          { type: 'change-status', config: { newStatus: 'active' } },
          { type: 'send-notification', config: { template: 'Project {{entityTitle}} has been approved and is now active.', channels: ['in-app', 'email'] } }
        ],
        isTerminal: true
      }
    ]
  },

  // ==========================================
  // 6. EXPENSE CLAIM WORKFLOW
  // ==========================================
  {
    name: 'Expense Claim Approval',
    description: 'Employee expense claim approval with manager and finance review.',
    category: 'finance',
    entityType: 'expense',
    version: 1,
    isActive: true,
    isDefault: true,
    priority: 'medium',
    estimatedDurationHours: 72,
    tags: ['expense', 'claim', 'reimbursement'],
    trigger: {
      type: 'entity-created',
      entityType: 'expense'
    },
    steps: [
      {
        stepId: 'exp-manager-approval',
        name: 'Manager Approval',
        description: 'Reporting manager reviews and approves the expense claim',
        type: 'approval',
        order: 1,
        approverType: 'department-head',
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['exp-finance-review']
      },
      {
        stepId: 'exp-finance-review',
        name: 'Finance Verification',
        description: 'Finance team verifies receipts and policy compliance',
        type: 'approval',
        order: 2,
        approverType: 'role',
        approverRoles: ['accounts-executive'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['exp-process']
      },
      {
        stepId: 'exp-process',
        name: 'Process Reimbursement',
        type: 'auto-action',
        order: 3,
        actions: [
          { type: 'change-status', config: { newStatus: 'approved' } },
          { type: 'send-notification', config: { template: 'Your expense claim has been approved for reimbursement.', channels: ['in-app'] } }
        ],
        isTerminal: true
      }
    ]
  },

  // ==========================================
  // 7. INVOICE VERIFICATION WORKFLOW
  // ==========================================
  {
    name: 'Invoice Verification & Approval',
    description: 'Vendor/subcontractor invoice verification workflow with 3-way matching (PO, GRN, Invoice).',
    category: 'finance',
    entityType: 'invoice',
    version: 1,
    isActive: true,
    isDefault: true,
    priority: 'high',
    estimatedDurationHours: 48,
    tags: ['invoice', 'verification', 'vendor'],
    trigger: {
      type: 'entity-created',
      entityType: 'invoice'
    },
    steps: [
      {
        stepId: 'inv-3way-match',
        name: '3-Way Matching',
        description: 'Verify invoice against PO and delivery/GRN records',
        type: 'task',
        order: 1,
        taskConfig: {
          title: 'Perform 3-Way Match',
          description: 'Match invoice with Purchase Order and Goods Receipt Note',
          assigneeType: 'role',
          assigneeRoles: ['accounts-executive'],
          dueInDays: 1,
          priority: 'high'
        },
        nextSteps: ['inv-site-confirm']
      },
      {
        stepId: 'inv-site-confirm',
        name: 'Site Confirmation',
        description: 'Site engineer confirms material/work receipt',
        type: 'approval',
        order: 2,
        approverType: 'role',
        approverRoles: ['site-engineer'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        nextSteps: ['inv-approve']
      },
      {
        stepId: 'inv-approve',
        name: 'Finance Approval',
        description: 'Finance manager approves invoice for payment',
        type: 'approval',
        order: 3,
        approverType: 'role',
        approverRoles: ['finance-manager'],
        approvalMode: 'any',
        sla: { expectedHours: 24, warningHours: 16 },
        isTerminal: true
      }
    ]
  }
];

async function seedWorkflowTemplates() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const WorkflowTemplate = mongoose.model('WorkflowTemplate', new mongoose.Schema({}, { strict: false }));

    // Check if templates already exist
    const existing = await WorkflowTemplate.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  ${existing} workflow templates already exist. Skipping seed.`);
      console.log('   To re-seed, delete existing templates first.');
      process.exit(0);
    }

    // Insert templates (without createdBy since this is a seed)
    const results = await WorkflowTemplate.insertMany(
      workflowTemplates.map(t => ({ ...t, createdBy: new mongoose.Types.ObjectId() }))
    );

    console.log(`✅ Seeded ${results.length} workflow templates:`);
    results.forEach(t => console.log(`   - ${t.name}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedWorkflowTemplates();
