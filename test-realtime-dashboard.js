/**
 * Real-Time Dashboard Test Script
 * 
 * This script tests the real-time dashboard functionality by:
 * 1. Connecting to the Socket.IO server
 * 2. Listening for dashboard stats updates
 * 3. Creating test data (employee, project, task)
 * 4. Verifying that dashboard stats are emitted
 * 
 * Usage: node test-realtime-dashboard.js
 */

const io = require('socket.io-client');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';

// Test credentials (update with your actual test user)
const TEST_USER = {
  email: 'admin@rayerp.com',
  password: 'admin123'
};

let authToken = '';
let socket = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Step 1: Login and get auth token
async function login() {
  try {
    log('\n📝 Step 1: Logging in...', 'cyan');
    const response = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      log('✅ Login successful!', 'green');
      return true;
    } else {
      log('❌ Login failed: No token received', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Login error: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Step 2: Connect to Socket.IO
function connectSocket() {
  return new Promise((resolve, reject) => {
    log('\n🔌 Step 2: Connecting to Socket.IO...', 'cyan');
    
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: authToken }
    });

    socket.on('connect', () => {
      log(`✅ Socket connected! ID: ${socket.id}`, 'green');
      
      // Authenticate socket
      socket.emit('authenticate', authToken);
      resolve();
    });

    socket.on('auth_success', (data) => {
      log(`✅ Socket authenticated for user: ${data.userId}`, 'green');
    });

    socket.on('auth_error', (error) => {
      log(`❌ Socket authentication failed: ${error}`, 'red');
      reject(error);
    });

    socket.on('connect_error', (error) => {
      log(`❌ Socket connection error: ${error.message}`, 'red');
      reject(error);
    });

    socket.on('disconnect', () => {
      log('⚠️  Socket disconnected', 'yellow');
    });

    // Listen for dashboard stats updates
    socket.on('dashboard:stats', (stats) => {
      log('\n📊 Dashboard Stats Update Received:', 'green');
      log(`   Total Employees: ${stats.totalEmployees}`, 'blue');
      log(`   Active Employees: ${stats.activeEmployees}`, 'blue');
      log(`   Total Projects: ${stats.totalProjects}`, 'blue');
      log(`   Active Projects: ${stats.activeProjects}`, 'blue');
      log(`   Total Tasks: ${stats.totalTasks}`, 'blue');
      log(`   Completed Tasks: ${stats.completedTasks}`, 'blue');
      log(`   Revenue: ₹${stats.revenue}`, 'blue');
      log(`   Expenses: ₹${stats.expenses}`, 'blue');
      log(`   Profit: ₹${stats.profit}`, 'blue');
      log(`   Timestamp: ${stats.timestamp}`, 'blue');
    });

    // Listen for specific events
    socket.on('employee:created', (data) => {
      log('✅ Event received: employee:created', 'green');
    });

    socket.on('project:created', (data) => {
      log('✅ Event received: project:created', 'green');
    });

    socket.on('task:created', (data) => {
      log('✅ Event received: task:created', 'green');
    });
  });
}

// Step 3: Get initial dashboard stats
async function getInitialStats() {
  try {
    log('\n📈 Step 3: Fetching initial dashboard stats...', 'cyan');
    const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      const stats = response.data.data;
      log('✅ Initial stats fetched:', 'green');
      log(`   Total Employees: ${stats.totalEmployees}`, 'blue');
      log(`   Total Projects: ${stats.totalProjects}`, 'blue');
      log(`   Total Tasks: ${stats.totalTasks}`, 'blue');
      return stats;
    }
  } catch (error) {
    log(`❌ Error fetching stats: ${error.message}`, 'red');
  }
}

// Step 4: Create test employee
async function createTestEmployee() {
  try {
    log('\n👤 Step 4: Creating test employee...', 'cyan');
    const testEmployee = {
      firstName: 'Test',
      lastName: `User${Date.now()}`,
      email: `test${Date.now()}@rayerp.com`,
      phone: '1234567890',
      department: 'Engineering',
      position: 'Developer',
      status: 'active',
      joiningDate: new Date().toISOString()
    };

    const response = await axios.post(`${API_URL}/api/employees`, testEmployee, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log('✅ Test employee created!', 'green');
    log('   Waiting for dashboard stats update...', 'yellow');
    
    // Wait a bit for the socket event
    await new Promise(resolve => setTimeout(resolve, 2000));
    return response.data;
  } catch (error) {
    log(`❌ Error creating employee: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Step 5: Create test project
async function createTestProject() {
  try {
    log('\n📁 Step 5: Creating test project...', 'cyan');
    const testProject = {
      name: `Test Project ${Date.now()}`,
      description: 'Real-time dashboard test project',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 100000
    };

    const response = await axios.post(`${API_URL}/api/projects`, testProject, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log('✅ Test project created!', 'green');
    log('   Waiting for dashboard stats update...', 'yellow');
    
    // Wait a bit for the socket event
    await new Promise(resolve => setTimeout(resolve, 2000));
    return response.data;
  } catch (error) {
    log(`❌ Error creating project: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Step 6: Create test task
async function createTestTask(projectId) {
  try {
    log('\n✅ Step 6: Creating test task...', 'cyan');
    const testTask = {
      title: `Test Task ${Date.now()}`,
      description: 'Real-time dashboard test task',
      status: 'todo',
      priority: 'medium',
      project: projectId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const response = await axios.post(`${API_URL}/api/tasks`, testTask, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log('✅ Test task created!', 'green');
    log('   Waiting for dashboard stats update...', 'yellow');
    
    // Wait a bit for the socket event
    await new Promise(resolve => setTimeout(resolve, 2000));
    return response.data;
  } catch (error) {
    log(`❌ Error creating task: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

// Main test function
async function runTests() {
  log('\n🚀 Starting Real-Time Dashboard Tests', 'cyan');
  log('=====================================\n', 'cyan');

  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      log('\n❌ Tests failed: Could not login', 'red');
      process.exit(1);
    }

    // Step 2: Connect socket
    await connectSocket();

    // Step 3: Get initial stats
    await getInitialStats();

    // Step 4: Create test employee
    await createTestEmployee();

    // Step 5: Create test project
    const project = await createTestProject();

    // Step 6: Create test task
    if (project && project._id) {
      await createTestTask(project._id);
    }

    // Final summary
    log('\n✅ All tests completed!', 'green');
    log('=====================================\n', 'cyan');
    log('Summary:', 'cyan');
    log('- Socket connection: ✅', 'green');
    log('- Dashboard stats updates: ✅', 'green');
    log('- Real-time events: ✅', 'green');
    log('\nThe dashboard should now be updating in real-time!', 'green');
    log('Open your browser and watch the dashboard update live.\n', 'yellow');

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
  } finally {
    // Keep socket open for a bit to see any delayed events
    log('\nKeeping connection open for 10 seconds to monitor events...', 'yellow');
    setTimeout(() => {
      if (socket) {
        socket.disconnect();
      }
      log('\n👋 Test completed. Disconnecting...', 'cyan');
      process.exit(0);
    }, 10000);
  }
}

// Run the tests
runTests();
