// Third-party imports with versions
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import { XCUITest, XCUIElement, XCUIApplication } from '@testing-library/xcuitest'; // ^2.0.0

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../../utils/test-helpers';
import { createMockUser, createMockBudget } from '../../../utils/mock-data';
import { TestApiClient } from '../../../utils/api-client';

/**
 * Human Tasks Required:
 * 1. Configure XCUITest environment variables in .env.test
 * 2. Set up iOS simulator with appropriate permissions
 * 3. Install test app bundle on simulator
 * 4. Configure test user credentials
 * 5. Set up test database with proper permissions
 */

let app: XCUIApplication;
let testEnv: {
  db: any;
  api: TestApiClient;
  auth: { token: string };
};
let testUser: any;

beforeAll(async () => {
  // Requirements addressed: Mobile Testing (Technical Specification/8.1.7 Mobile Responsive Considerations)
  // Initialize test environment and API client
  testEnv = await setupTestEnvironment();
  testUser = await createMockUser();

  // Launch iOS app in test mode
  app = new XCUIApplication();
  app.launchArguments = ['--uitesting'];
  app.launch();

  // Wait for app initialization and navigate to budget section
  await app.waitForElement('DashboardView');
  const budgetTab = app.buttons['BudgetTab'];
  await budgetTab.tap();
});

afterAll(async () => {
  // Clean up test data and environment
  await cleanupTestEnvironment(testEnv);
  app.terminate();
});

describe('Budget Management Flow Tests', () => {
  test('testBudgetCreation - should create a new budget with categories', async () => {
    // Requirements addressed: Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
    
    // Tap create budget button
    const createBudgetButton = app.buttons['CreateBudgetButton'];
    await createBudgetButton.tap();

    // Enter budget name and period
    const budgetNameField = app.textFields['BudgetNameField'];
    await budgetNameField.typeText('Monthly Expenses');

    const monthlyPeriodButton = app.buttons['MonthlyPeriodButton'];
    await monthlyPeriodButton.tap();

    // Select and configure budget categories
    const addCategoryButton = app.buttons['AddCategoryButton'];
    
    // Add Groceries category
    await addCategoryButton.tap();
    const groceriesOption = app.buttons['GroceriesCategory'];
    await groceriesOption.tap();
    const groceriesAmount = app.textFields['CategoryAmountField'];
    await groceriesAmount.typeText('500');

    // Add Transportation category
    await addCategoryButton.tap();
    const transportOption = app.buttons['TransportationCategory'];
    await transportOption.tap();
    const transportAmount = app.textFields['CategoryAmountField'];
    await transportAmount.typeText('300');

    // Requirements addressed: Accessibility Testing (Technical Specification/8.1.8 Accessibility Features)
    // Verify accessibility labels
    expect(groceriesAmount.accessibilityLabel).toBe('Groceries category amount');
    expect(transportAmount.accessibilityLabel).toBe('Transportation category amount');

    // Save budget
    const saveBudgetButton = app.buttons['SaveBudgetButton'];
    await saveBudgetButton.tap();

    // Verify budget appears in list
    const budgetList = app.scrollViews['BudgetListView'];
    const budgetCard = budgetList.cells['Monthly Expenses'];
    expect(await budgetCard.exists()).toBe(true);

    // Verify budget details
    await budgetCard.tap();
    const budgetTotal = app.staticTexts['BudgetTotalAmount'];
    expect(await budgetTotal.label).toBe('$800.00');

    // Verify category amounts
    const groceriesCell = app.cells['GroceriesCategory'];
    const transportCell = app.cells['TransportationCategory'];
    expect(await groceriesCell.staticTexts['CategoryAmount'].label).toBe('$500.00');
    expect(await transportCell.staticTexts['CategoryAmount'].label).toBe('$300.00');
  });

  test('testBudgetEditing - should modify existing budget', async () => {
    // Create test budget via API
    const testBudget = await createMockBudget(testUser.id);
    await testEnv.api.post('/api/v1/budgets', testBudget);

    // Navigate to budget details
    const budgetList = app.scrollViews['BudgetListView'];
    const budgetCard = budgetList.cells[testBudget.name];
    await budgetCard.tap();

    // Tap edit button
    const editButton = app.buttons['EditBudgetButton'];
    await editButton.tap();

    // Modify budget name
    const nameField = app.textFields['BudgetNameField'];
    await nameField.clearText();
    await nameField.typeText('Updated Budget');

    // Update category allocation
    const categoryCell = app.cells[testBudget.categories[0].category];
    await categoryCell.tap();
    const amountField = app.textFields['CategoryAmountField'];
    await amountField.clearText();
    await amountField.typeText('750');

    // Save changes
    const saveButton = app.buttons['SaveBudgetButton'];
    await saveButton.tap();

    // Verify updates
    expect(await app.staticTexts['BudgetName'].label).toBe('Updated Budget');
    expect(await app.cells[testBudget.categories[0].category]
      .staticTexts['CategoryAmount'].label).toBe('$750.00');

    // Check history of changes via API
    const updatedBudget = await testEnv.api.get(`/api/v1/budgets/${testBudget.id}`);
    expect(updatedBudget.name).toBe('Updated Budget');
    expect(updatedBudget.categories[0].allocated).toBe(750);
  });

  test('testBudgetTracking - should track spending and progress', async () => {
    // Create budget with specific categories
    const trackingBudget = await createMockBudget(testUser.id, {
      categories: [
        { category: 'Groceries', allocated: 600, spent: 0 },
        { category: 'Dining', allocated: 400, spent: 0 }
      ]
    });
    await testEnv.api.post('/api/v1/budgets', trackingBudget);

    // Add test transactions via API
    await testEnv.api.post('/api/v1/transactions', {
      amount: 150,
      category: 'Groceries',
      description: 'Supermarket',
      date: new Date(),
      userId: testUser.id
    });

    // Navigate to budget
    const budgetList = app.scrollViews['BudgetListView'];
    const budgetCard = budgetList.cells[trackingBudget.name];
    await budgetCard.tap();

    // Verify budget progress updates
    const groceriesProgress = app.progressIndicators['GroceriesProgress'];
    expect(await groceriesProgress.value).toBe('25'); // 150/600 = 25%

    // Check category spending amounts
    const groceriesSpent = app.staticTexts['GroceriesSpent'];
    expect(await groceriesSpent.label).toBe('$150.00');

    // Validate remaining budget calculations
    const groceriesRemaining = app.staticTexts['GroceriesRemaining'];
    expect(await groceriesRemaining.label).toBe('$450.00');

    // Test progress bar animations
    const progressBar = app.progressIndicators['GroceriesProgress'];
    expect(await progressBar.isAnimating).toBe(true);

    // Verify accessibility values for progress
    expect(await groceriesProgress.accessibilityLabel)
      .toBe('Groceries budget progress 25 percent');
  });

  test('testBudgetAlerts - should trigger and handle budget alerts', async () => {
    // Configure budget with alert thresholds
    const alertBudget = await createMockBudget(testUser.id, {
      categories: [{
        category: 'Shopping',
        allocated: 200,
        spent: 0,
        alertThreshold: 90
      }]
    });
    await testEnv.api.post('/api/v1/budgets', alertBudget);

    // Create transaction near threshold
    await testEnv.api.post('/api/v1/transactions', {
      amount: 185, // 92.5% of budget
      category: 'Shopping',
      description: 'Department Store',
      date: new Date(),
      userId: testUser.id
    });

    // Navigate to budget
    const budgetList = app.scrollViews['BudgetListView'];
    const budgetCard = budgetList.cells[alertBudget.name];
    await budgetCard.tap();

    // Verify alert appears
    const alertBanner = app.otherElements['BudgetAlertBanner'];
    expect(await alertBanner.exists()).toBe(true);

    // Check alert content
    const alertText = app.staticTexts['AlertMessage'];
    expect(await alertText.label).toContain('Shopping category is at 92.5%');

    // Validate alert dismissal
    const dismissButton = app.buttons['DismissAlertButton'];
    await dismissButton.tap();
    expect(await alertBanner.exists()).toBe(false);

    // Test multiple alert levels
    const warningIcon = app.images['WarningIcon'];
    const criticalIcon = app.images['CriticalIcon'];
    expect(await warningIcon.exists()).toBe(true);
    expect(await criticalIcon.exists()).toBe(false);

    // Verify alert accessibility
    expect(await alertBanner.accessibilityLabel)
      .toBe('Budget alert: Shopping category has exceeded 90 percent threshold');
  });
});