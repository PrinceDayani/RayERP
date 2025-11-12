// Test script for Project Analytics endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let projectId = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✓ Login successful');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function getFirstProject() {
  try {
    const response = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.length > 0) {
      projectId = response.data[0]._id;
      console.log(`✓ Found project: ${response.data[0].name} (${projectId})`);
      return true;
    }
    console.error('✗ No projects found');
    return false;
  } catch (error) {
    console.error('✗ Get projects failed:', error.response?.data || error.message);
    return false;
  }
}

async function testBurndownChart() {
  try {
    const response = await axios.get(`${BASE_URL}/projects/${projectId}/analytics/burndown`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Burndown Chart:', {
      totalTasks: response.data.totalTasks,
      totalDays: response.data.totalDays,
      dataPoints: response.data.burndownData?.length
    });
    return true;
  } catch (error) {
    console.error('✗ Burndown chart failed:', error.response?.data || error.message);
    return false;
  }
}

async function testVelocity() {
  try {
    const response = await axios.get(`${BASE_URL}/projects/${projectId}/analytics/velocity`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Velocity:', {
      avgVelocity: response.data.avgVelocity,
      totalCompleted: response.data.totalCompleted,
      weeks: response.data.velocityData?.length
    });
    return true;
  } catch (error) {
    console.error('✗ Velocity failed:', error.response?.data || error.message);
    return false;
  }
}

async function testResourceUtilization() {
  try {
    const response = await axios.get(`${BASE_URL}/projects/${projectId}/analytics/resource-utilization`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Resource Utilization:', {
      teamSize: response.data.teamSize,
      resources: response.data.utilizationData?.length
    });
    return true;
  } catch (error) {
    console.error('✗ Resource utilization failed:', error.response?.data || error.message);
    return false;
  }
}

async function testPerformanceIndices() {
  try {
    const response = await axios.get(`${BASE_URL}/projects/${projectId}/analytics/performance-indices`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Performance Indices:', {
      CPI: response.data.cpi,
      SPI: response.data.spi,
      status: response.data.status
    });
    return true;
  } catch (error) {
    console.error('✗ Performance indices failed:', error.response?.data || error.message);
    return false;
  }
}

async function testRiskAssessment() {
  try {
    const response = await axios.get(`${BASE_URL}/projects/${projectId}/analytics/risk-assessment`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ Risk Assessment:', {
      overallRisk: response.data.overallRisk,
      riskCount: response.data.riskCount,
      projectHealth: response.data.projectHealth
    });
    return true;
  } catch (error) {
    console.error('✗ Risk assessment failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n=== Project Analytics API Tests ===\n');
  
  if (!await login()) return;
  if (!await getFirstProject()) return;
  
  console.log('\n--- Testing Analytics Endpoints ---\n');
  await testBurndownChart();
  await testVelocity();
  await testResourceUtilization();
  await testPerformanceIndices();
  await testRiskAssessment();
  
  console.log('\n=== Tests Complete ===\n');
}

runTests();
