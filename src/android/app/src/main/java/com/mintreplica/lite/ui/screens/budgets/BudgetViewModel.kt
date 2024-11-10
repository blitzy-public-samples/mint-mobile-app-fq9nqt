// External library versions:
// androidx.lifecycle:viewmodel:2.6.1
// kotlinx.coroutines.flow:1.6.0
// javax.inject:1

package com.mintreplica.lite.ui.screens.budgets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mintreplica.lite.domain.model.Budget
import com.mintreplica.lite.domain.usecase.BudgetUseCases
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Human Tasks:
 * 1. Configure proper error tracking/analytics integration
 * 2. Set up crash reporting for error states
 * 3. Review and adjust error messages for production
 * 4. Configure proper testing coverage for all ViewModel states
 */

/**
 * ViewModel that manages budget-related UI state and business logic for the budget screens.
 * Implements reactive state management using Kotlin Flows and provides comprehensive
 * budget management operations with error handling and loading states.
 *
 * Requirements addressed:
 * - Budget Management (1.2 Scope/Core Features): Budget creation and monitoring with support
 *   for different time periods and categories
 * - Core Features (1.1 System Overview): Financial management functionality including budget
 *   tracking and monitoring
 */
class BudgetViewModel @Inject constructor(
    private val budgetUseCases: BudgetUseCases
) : ViewModel() {

    // List of all budgets
    private val _budgets = MutableStateFlow<List<Budget>>(emptyList())
    val budgets: StateFlow<List<Budget>> = _budgets

    // Currently selected budget for detailed view
    private val _selectedBudget = MutableStateFlow<Budget?>(null)
    val selectedBudget: StateFlow<Budget?> = _selectedBudget

    // Loading state
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    // Error state
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    /**
     * Loads budgets for the current user with error handling and loading state management.
     * Updates the budgets StateFlow with the latest data.
     *
     * @param userId ID of the user whose budgets to load
     */
    fun loadBudgets(userId: String) {
        _isLoading.value = true
        _error.value = null

        viewModelScope.launch {
            try {
                budgetUseCases.getUserBudgets(userId)
                    .catch { e ->
                        _error.value = "Failed to load budgets: ${e.message}"
                        _isLoading.value = false
                    }
                    .collect { budgetList ->
                        _budgets.value = budgetList
                        _isLoading.value = false
                    }
            } catch (e: Exception) {
                _error.value = "Failed to load budgets: ${e.message}"
                _isLoading.value = false
            }
        }
    }

    /**
     * Selects a budget for detailed view with error handling.
     * Updates the selectedBudget StateFlow with the chosen budget's details.
     *
     * @param budgetId ID of the budget to select
     */
    fun selectBudget(budgetId: String) {
        _isLoading.value = true
        _error.value = null

        viewModelScope.launch {
            try {
                budgetUseCases.getBudgetDetails(budgetId)
                    .catch { e ->
                        _error.value = "Failed to load budget details: ${e.message}"
                        _isLoading.value = false
                    }
                    .collect { budget ->
                        _selectedBudget.value = budget
                        _isLoading.value = false
                    }
            } catch (e: Exception) {
                _error.value = "Failed to load budget details: ${e.message}"
                _isLoading.value = false
            }
        }
    }

    /**
     * Creates a new budget with validation and error handling.
     * Updates the budgets list on successful creation.
     *
     * @param budget Budget object to create
     * @return ID of created budget
     */
    suspend fun createBudget(budget: Budget): Long {
        _isLoading.value = true
        _error.value = null

        return try {
            val budgetId = budgetUseCases.createNewBudget(budget)
            loadBudgets(budget.userId) // Refresh budgets list
            budgetId
        } catch (e: Exception) {
            _error.value = "Failed to create budget: ${e.message}"
            -1L
        } finally {
            _isLoading.value = false
        }
    }

    /**
     * Updates budget spending amount with validation.
     * Refreshes budget details on successful update.
     *
     * @param budget Budget to update
     * @param newSpentAmount New spent amount to set
     */
    suspend fun updateBudget(budget: Budget, newSpentAmount: Double) {
        _isLoading.value = true
        _error.value = null

        try {
            budgetUseCases.updateBudgetSpending(budget, newSpentAmount)
            selectBudget(budget.id) // Refresh budget details
        } catch (e: Exception) {
            _error.value = "Failed to update budget: ${e.message}"
        } finally {
            _isLoading.value = false
        }
    }

    /**
     * Deletes an existing budget with validation.
     * Updates the budgets list and clears selection on successful deletion.
     *
     * @param budget Budget to delete
     */
    suspend fun deleteBudget(budget: Budget) {
        _isLoading.value = true
        _error.value = null

        try {
            budgetUseCases.deleteBudget(budget)
            
            // Clear selected budget if it matches the deleted budget
            if (_selectedBudget.value?.id == budget.id) {
                _selectedBudget.value = null
            }
            
            loadBudgets(budget.userId) // Refresh budgets list
        } catch (e: Exception) {
            _error.value = "Failed to delete budget: ${e.message}"
        } finally {
            _isLoading.value = false
        }
    }
}