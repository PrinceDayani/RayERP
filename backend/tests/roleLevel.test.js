/**
 * Role Level System Tests
 * Run: npm test tests/roleLevel.test.js
 */

const request = require('supertest');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

describe('Role Level System', () => {
  let rootToken, testRoleId;

  beforeAll(async () => {
    const rootRes = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'root@rayerp.com', password: 'root123' });
    rootToken = rootRes.body.token;

    const roleRes = await request(BASE_URL)
      .post('/api/rbac/roles')
      .set('Authorization', `Bearer ${rootToken}`)
      .send({
        name: 'Test High Level',
        level: 85,
        permissions: ['users.view', 'users.edit', 'users.delete']
      });
    testRoleId = roleRes.body._id;
  });

  test('Root can reduce permissions for high-level roles', async () => {
    const res = await request(BASE_URL)
      .post(`/api/rbac/roles/${testRoleId}/reduce-permissions`)
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ permissionsToRemove: ['users.delete'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Cannot reduce permissions for Root role', async () => {
    const roles = await request(BASE_URL)
      .get('/api/rbac/roles')
      .set('Authorization', `Bearer ${rootToken}`);
    
    const rootRole = roles.body.find(r => r.name === 'Root');

    const res = await request(BASE_URL)
      .post(`/api/rbac/roles/${rootRole._id}/reduce-permissions`)
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ permissionsToRemove: ['users.delete'] });

    expect(res.status).toBe(403);
  });

  test('Get users by role level', async () => {
    const res = await request(BASE_URL)
      .get('/api/rbac/users/by-level?minLevel=80')
      .set('Authorization', `Bearer ${rootToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  afterAll(async () => {
    if (testRoleId) {
      await request(BASE_URL)
        .delete(`/api/rbac/roles/${testRoleId}`)
        .set('Authorization', `Bearer ${rootToken}`);
    }
  });
});
