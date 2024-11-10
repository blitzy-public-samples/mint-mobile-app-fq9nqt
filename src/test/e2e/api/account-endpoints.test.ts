// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockAccount } from '../../utils/mock-data';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure test database is set up with proper permissions
 * 3. Configure test API endpoints and authentication
 * 4. Set up test logging directory with write permissions
 * 5. Verify rate limiting settings for test environment
 */

describe('Account Management API Endpoints', () => {
    let testEnv: {
        db: any;
        api: TestApiClient;
        auth: { token: string };
    };
    let mockUser: any;
    let mockAccount: any;

    // Requirements addressed:
    // - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
    // - API Security (Technical Specification/9.3.1 API Security)
    beforeAll(async () => {
        testEnv = await setupTestEnvironment();
        mockUser = await createMockUser();
    });

    afterAll(async () => {
        await cleanupTestEnvironment(testEnv);
    });

    beforeEach(async () => {
        mockAccount = createMockAccount(mockUser.id);
    });

    afterEach(async () => {
        // Cleanup test data after each test
        await testEnv.db.query('DELETE FROM accounts WHERE user_id = $1', [mockUser.id]);
    });

    // Requirements addressed:
    // - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
    describe('POST /accounts', () => {
        it('should create new account with valid data', async () => {
            const response = await testEnv.api.post('/accounts', mockAccount);

            expect(response.status).toBe(201);
            expect(response.data).toMatchObject({
                id: expect.any(String),
                userId: mockUser.id,
                institutionId: mockAccount.institutionId,
                accountType: mockAccount.accountType,
                balance: mockAccount.balance,
                name: mockAccount.name
            });

            // Verify account exists in database
            const dbAccount = await testEnv.db.query(
                'SELECT * FROM accounts WHERE id = $1',
                [response.data.id]
            );
            expect(dbAccount.rows[0]).toBeTruthy();
        });

        it('should reject invalid account data with 400', async () => {
            const invalidAccount = { ...mockAccount, accountType: 'invalid_type' };
            
            const response = await testEnv.api.post('/accounts', invalidAccount);
            expect(response.status).toBe(400);
            expect(response.data.message).toContain('Invalid account type');
        });

        it('should require authentication with 401', async () => {
            testEnv.api.setAuthToken('');
            
            const response = await testEnv.api.post('/accounts', mockAccount);
            expect(response.status).toBe(401);
        });

        it('should associate account with correct user', async () => {
            const response = await testEnv.api.post('/accounts', mockAccount);
            
            const dbAccount = await testEnv.db.query(
                'SELECT user_id FROM accounts WHERE id = $1',
                [response.data.id]
            );
            expect(dbAccount.rows[0].user_id).toBe(mockUser.id);
        });
    });

    describe('GET /accounts', () => {
        beforeEach(async () => {
            // Create multiple test accounts
            await testEnv.api.post('/accounts', mockAccount);
            await testEnv.api.post('/accounts', createMockAccount(mockUser.id));
            await testEnv.api.post('/accounts', createMockAccount(mockUser.id));
        });

        it('should return all user accounts with pagination', async () => {
            const response = await testEnv.api.get('/accounts?page=1&limit=10');

            expect(response.status).toBe(200);
            expect(response.data.items).toHaveLength(3);
            expect(response.data.pagination).toMatchObject({
                page: 1,
                limit: 10,
                totalItems: 3,
                totalPages: 1
            });
        });

        it('should require valid authentication token', async () => {
            testEnv.api.setAuthToken('invalid_token');
            
            const response = await testEnv.api.get('/accounts');
            expect(response.status).toBe(401);
        });

        it("should not return other users' accounts", async () => {
            const otherUser = await createMockUser();
            await testEnv.api.post('/accounts', createMockAccount(otherUser.id));

            const response = await testEnv.api.get('/accounts');
            
            expect(response.status).toBe(200);
            expect(response.data.items.every((acc: any) => acc.userId === mockUser.id)).toBe(true);
        });

        it('should support filtering and sorting', async () => {
            const response = await testEnv.api.get(
                '/accounts?accountType=checking&sort=balance:desc'
            );

            expect(response.status).toBe(200);
            expect(response.data.items).toBeSorted((a: any, b: any) => b.balance - a.balance);
            expect(response.data.items.every((acc: any) => acc.accountType === 'checking')).toBe(true);
        });
    });

    describe('GET /accounts/:id', () => {
        let testAccountId: string;

        beforeEach(async () => {
            const response = await testEnv.api.post('/accounts', mockAccount);
            testAccountId = response.data.id;
        });

        it('should return specific account details', async () => {
            const response = await testEnv.api.get(`/accounts/${testAccountId}`);

            expect(response.status).toBe(200);
            expect(response.data).toMatchObject({
                id: testAccountId,
                userId: mockUser.id,
                institutionId: mockAccount.institutionId,
                accountType: mockAccount.accountType,
                balance: mockAccount.balance,
                name: mockAccount.name
            });
        });

        it('should require valid authentication', async () => {
            testEnv.api.setAuthToken('');
            
            const response = await testEnv.api.get(`/accounts/${testAccountId}`);
            expect(response.status).toBe(401);
        });

        it('should return 404 for non-existent account', async () => {
            const response = await testEnv.api.get('/accounts/non_existent_id');
            expect(response.status).toBe(404);
        });

        it("should not return other users' accounts", async () => {
            const otherUser = await createMockUser();
            const otherAccount = await testEnv.api.post(
                '/accounts',
                createMockAccount(otherUser.id)
            );

            const response = await testEnv.api.get(`/accounts/${otherAccount.data.id}`);
            expect(response.status).toBe(403);
        });
    });

    describe('PUT /accounts/:id', () => {
        let testAccountId: string;

        beforeEach(async () => {
            const response = await testEnv.api.post('/accounts', mockAccount);
            testAccountId = response.data.id;
        });

        it('should update account with valid data', async () => {
            const updates = {
                name: 'Updated Account Name',
                balance: 5000.00
            };

            const response = await testEnv.api.put(`/accounts/${testAccountId}`, updates);

            expect(response.status).toBe(200);
            expect(response.data).toMatchObject({
                id: testAccountId,
                name: updates.name,
                balance: updates.balance
            });

            // Verify database changes
            const dbAccount = await testEnv.db.query(
                'SELECT * FROM accounts WHERE id = $1',
                [testAccountId]
            );
            expect(dbAccount.rows[0].name).toBe(updates.name);
            expect(dbAccount.rows[0].balance).toBe(updates.balance);
        });

        it('should reject invalid updates with 400', async () => {
            const invalidUpdates = {
                balance: 'invalid_balance'
            };

            const response = await testEnv.api.put(
                `/accounts/${testAccountId}`,
                invalidUpdates
            );
            expect(response.status).toBe(400);
        });

        it('should require authentication with 401', async () => {
            testEnv.api.setAuthToken('');
            
            const response = await testEnv.api.put(
                `/accounts/${testAccountId}`,
                { name: 'Test Update' }
            );
            expect(response.status).toBe(401);
        });

        it("should not update other users' accounts", async () => {
            const otherUser = await createMockUser();
            const otherAccount = await testEnv.api.post(
                '/accounts',
                createMockAccount(otherUser.id)
            );

            const response = await testEnv.api.put(
                `/accounts/${otherAccount.data.id}`,
                { name: 'Unauthorized Update' }
            );
            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /accounts/:id', () => {
        let testAccountId: string;

        beforeEach(async () => {
            const response = await testEnv.api.post('/accounts', mockAccount);
            testAccountId = response.data.id;
        });

        it('should deactivate account successfully', async () => {
            const response = await testEnv.api.delete(`/accounts/${testAccountId}`);

            expect(response.status).toBe(200);
            expect(response.data.message).toContain('Account deactivated');

            // Verify account is marked as inactive
            const dbAccount = await testEnv.db.query(
                'SELECT is_active FROM accounts WHERE id = $1',
                [testAccountId]
            );
            expect(dbAccount.rows[0].is_active).toBe(false);
        });

        it('should require valid authentication', async () => {
            testEnv.api.setAuthToken('');
            
            const response = await testEnv.api.delete(`/accounts/${testAccountId}`);
            expect(response.status).toBe(401);
        });

        it("should not deactivate other users' accounts", async () => {
            const otherUser = await createMockUser();
            const otherAccount = await testEnv.api.post(
                '/accounts',
                createMockAccount(otherUser.id)
            );

            const response = await testEnv.api.delete(`/accounts/${otherAccount.data.id}`);
            expect(response.status).toBe(403);
        });

        it('should return 404 for non-existent account', async () => {
            const response = await testEnv.api.delete('/accounts/non_existent_id');
            expect(response.status).toBe(404);
        });
    });

    describe('POST /accounts/:id/sync', () => {
        let testAccountId: string;

        beforeEach(async () => {
            const response = await testEnv.api.post('/accounts', mockAccount);
            testAccountId = response.data.id;
        });

        it('should sync account data successfully', async () => {
            const response = await testEnv.api.post(`/accounts/${testAccountId}/sync`);

            expect(response.status).toBe(200);
            expect(response.data).toMatchObject({
                id: testAccountId,
                lastSyncedAt: expect.any(String),
                syncStatus: 'completed'
            });

            // Verify sync timestamp is updated
            const dbAccount = await testEnv.db.query(
                'SELECT last_synced_at FROM accounts WHERE id = $1',
                [testAccountId]
            );
            expect(dbAccount.rows[0].last_synced_at).toBeTruthy();
        });

        it('should require valid authentication', async () => {
            testEnv.api.setAuthToken('');
            
            const response = await testEnv.api.post(`/accounts/${testAccountId}/sync`);
            expect(response.status).toBe(401);
        });

        it('should handle sync failures gracefully', async () => {
            // Simulate sync failure by using invalid institution ID
            await testEnv.api.put(`/accounts/${testAccountId}`, {
                institutionId: 'invalid_institution'
            });

            const response = await testEnv.api.post(`/accounts/${testAccountId}/sync`);
            expect(response.status).toBe(500);
            expect(response.data.error).toContain('Sync failed');
        });

        it("should not sync other users' accounts", async () => {
            const otherUser = await createMockUser();
            const otherAccount = await testEnv.api.post(
                '/accounts',
                createMockAccount(otherUser.id)
            );

            const response = await testEnv.api.post(
                `/accounts/${otherAccount.data.id}/sync`
            );
            expect(response.status).toBe(403);
        });
    });
});