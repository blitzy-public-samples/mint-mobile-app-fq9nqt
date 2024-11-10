// Third-party imports with versions
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';
import { createMockUser, createMockBudget } from '../../utils/mock-data';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure test database is properly set up with budget schema
 * 3. Configure test API endpoints and authentication
 * 4. Set up test logging directory with write permissions
 * 5. Verify rate limiting configuration for tests
 */

describe('Budget API Endpoints', () => {
    let testEnv: {
        db: any;
        api: TestApiClient;
        auth: { token: string };
    };
    let testUser: any;
    let testBudget: any;

    // Setup test environment before all tests
    beforeAll(async () => {
        // Requirements addressed: Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
        testEnv = await setupTestEnvironment();
        testUser = await createMockUser();
        testBudget = createMockBudget(testUser.id);
    });

    // Cleanup test environment after all tests
    afterAll(async () => {
        await cleanupTestEnvironment(testEnv);
    });

    describe('POST /api/v1/budgets', () => {
        it('should create a new budget with valid data', async () => {
            // Requirements addressed: Budget Creation and Monitoring
            const budgetData = createMockBudget(testUser.id);
            
            const response = await testEnv.api.post('/api/v1/budgets', budgetData);
            
            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
            expect(response.data.userId).toBe(testUser.id);
            expect(response.data.name).toBe(budgetData.name);
            expect(response.data.totalAllocated).toBe(budgetData.totalAllocated);
        });

        it('should reject budget creation with invalid data', async () => {
            // Requirements addressed: API Security - Input Validation
            const invalidBudget = {
                userId: testUser.id,
                // Missing required fields
            };

            const response = await testEnv.api.post('/api/v1/budgets', invalidBudget);
            
            expect(response.status).toBe(400);
            expect(response.data.error).toContain('validation');
        });

        it('should enforce budget amount validation rules', async () => {
            // Requirements addressed: API Security - Input Validation
            const invalidBudget = createMockBudget(testUser.id, {
                categories: [{
                    category: 'Housing',
                    allocated: -1000, // Negative allocation
                    spent: 0
                }]
            });

            const response = await testEnv.api.post('/api/v1/budgets', invalidBudget);
            
            expect(response.status).toBe(400);
            expect(response.data.error).toContain('allocation');
        });
    });

    describe('GET /api/v1/budgets', () => {
        it('should get paginated list of user budgets', async () => {
            // Requirements addressed: Budget Creation and Monitoring
            const response = await testEnv.api.get('/api/v1/budgets', {
                params: {
                    page: 1,
                    limit: 10
                }
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('items');
            expect(response.data).toHaveProperty('total');
            expect(response.data).toHaveProperty('page');
            expect(Array.isArray(response.data.items)).toBe(true);
        });

        it('should get single budget by ID with full details', async () => {
            const budget = await testEnv.api.post('/api/v1/budgets', testBudget);
            
            const response = await testEnv.api.get(`/api/v1/budgets/${budget.id}`);
            
            expect(response.status).toBe(200);
            expect(response.data.id).toBe(budget.id);
            expect(response.data.categories).toHaveLength(testBudget.categories.length);
        });

        it('should handle non-existent budget requests', async () => {
            // Requirements addressed: API Security - Error Handling
            const nonExistentId = 'non-existent-id';
            
            const response = await testEnv.api.get(`/api/v1/budgets/${nonExistentId}`);
            
            expect(response.status).toBe(404);
            expect(response.data.error).toContain('not found');
        });
    });

    describe('PUT /api/v1/budgets/:id', () => {
        it('should update existing budget with valid data', async () => {
            const budget = await testEnv.api.post('/api/v1/budgets', testBudget);
            const updates = {
                name: 'Updated Budget Name',
                categories: budget.categories.map(cat => ({
                    ...cat,
                    allocated: cat.allocated + 100
                }))
            };

            const response = await testEnv.api.put(`/api/v1/budgets/${budget.id}`, updates);
            
            expect(response.status).toBe(200);
            expect(response.data.name).toBe(updates.name);
            expect(response.data.categories[0].allocated).toBe(updates.categories[0].allocated);
        });

        it('should reject invalid budget updates', async () => {
            // Requirements addressed: API Security - Input Validation
            const budget = await testEnv.api.post('/api/v1/budgets', testBudget);
            const invalidUpdates = {
                totalAllocated: 'invalid-amount' // Invalid type
            };

            const response = await testEnv.api.put(`/api/v1/budgets/${budget.id}`, invalidUpdates);
            
            expect(response.status).toBe(400);
            expect(response.data.error).toContain('validation');
        });

        it('should validate budget category updates', async () => {
            const budget = await testEnv.api.post('/api/v1/budgets', testBudget);
            const updates = {
                categories: [
                    {
                        category: 'Invalid Category',
                        allocated: 1000,
                        spent: 0
                    }
                ]
            };

            const response = await testEnv.api.put(`/api/v1/budgets/${budget.id}`, updates);
            
            expect(response.status).toBe(400);
            expect(response.data.error).toContain('category');
        });
    });

    describe('DELETE /api/v1/budgets/:id', () => {
        it('should delete budget and related data', async () => {
            const budget = await testEnv.api.post('/api/v1/budgets', testBudget);
            
            const response = await testEnv.api.delete(`/api/v1/budgets/${budget.id}`);
            
            expect(response.status).toBe(204);

            // Verify budget is deleted
            const getResponse = await testEnv.api.get(`/api/v1/budgets/${budget.id}`);
            expect(getResponse.status).toBe(404);
        });

        it('should maintain budget history', async () => {
            // Requirements addressed: Budget Creation and Monitoring - History
            const budget = await testEnv.api.post('/api/v1/budgets', testBudget);
            
            // Make some updates before deletion
            await testEnv.api.put(`/api/v1/budgets/${budget.id}`, {
                name: 'Updated Name'
            });
            
            const response = await testEnv.api.delete(`/api/v1/budgets/${budget.id}`);
            
            expect(response.status).toBe(204);

            // Verify history is maintained
            const historyResponse = await testEnv.api.get(`/api/v1/budgets/${budget.id}/history`);
            expect(historyResponse.status).toBe(200);
            expect(historyResponse.data).toHaveLength(2); // Creation + update
        });
    });

    describe('Security and Authorization', () => {
        it('should enforce user authorization', async () => {
            // Requirements addressed: API Security - Authentication
            const unauthorizedApi = new TestApiClient();
            const response = await unauthorizedApi.get('/api/v1/budgets');
            
            expect(response.status).toBe(401);
        });

        it('should handle concurrent budget updates', async () => {
            // Requirements addressed: API Security - Concurrency
            const budget = await testEnv.api.post('/api/v1/budgets', testBudget);
            
            // Simulate concurrent updates
            const update1 = testEnv.api.put(`/api/v1/budgets/${budget.id}`, {
                name: 'Update 1'
            });
            const update2 = testEnv.api.put(`/api/v1/budgets/${budget.id}`, {
                name: 'Update 2'
            });

            const [response1, response2] = await Promise.all([update1, update2]);
            
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(409); // Conflict
        });

        it('should respect rate limiting rules', async () => {
            // Requirements addressed: API Security - Rate Limiting
            const requests = Array(100).fill(null).map(() => 
                testEnv.api.get('/api/v1/budgets')
            );

            const responses = await Promise.all(requests);
            const tooManyRequests = responses.some(r => r.status === 429);
            
            expect(tooManyRequests).toBe(true);
        });

        it('should handle API versioning correctly', async () => {
            // Requirements addressed: API Security - Versioning
            const response = await testEnv.api.get('/api/v2/budgets');
            
            expect(response.status).toBe(404);
            expect(response.data.error).toContain('API version');
        });
    });
});