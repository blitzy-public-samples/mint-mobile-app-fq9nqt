/**
 * Human Tasks:
 * 1. Configure analytics tracking for goal-related user actions
 * 2. Verify error message localization in strings.xml
 * 3. Review goal validation rules with product team
 */

package com.mintreplica.lite.ui.screens.goals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mintreplica.lite.domain.model.Goal
import com.mintreplica.lite.domain.usecase.GoalUseCases
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel implementation for the goals screen that manages UI state and business logic
 * for financial goal management, following Android MVVM architecture pattern.
 *
 * Requirements addressed:
 * - Financial Goal Setting and Progress Monitoring (1.2 Scope/Core Features)
 * - Mobile UI Architecture (5.2.1 Mobile Applications)
 */
@HiltViewModel
class GoalsViewModel @Inject constructor(
    private val goalUseCases: GoalUseCases
) : ViewModel() {

    private val _state = MutableStateFlow(GoalsState())
    val state: StateFlow<GoalsState> = _state

    /**
     * Loads goals for the current user with reactive updates.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal progress monitoring.
     *
     * @param userId Current user's ID
     */
    fun loadGoals(userId: String) {
        _state.value = _state.value.copy(isLoading = true)

        goalUseCases.getUserGoals(userId)
            .onEach { goals ->
                _state.value = _state.value.copy(
                    goals = goals,
                    isLoading = false,
                    error = null
                )
            }
            .catch { exception ->
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = exception.message ?: "Failed to load goals"
                )
            }
            .launchIn(viewModelScope)
    }

    /**
     * Creates a new financial goal asynchronously.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal creation.
     *
     * @param goal Goal to create
     * @return Operation success status
     */
    suspend fun createGoal(goal: Goal): Boolean {
        return try {
            goalUseCases.createGoal(goal)
            true
        } catch (e: Exception) {
            _state.value = _state.value.copy(
                error = e.message ?: "Failed to create goal"
            )
            false
        }
    }

    /**
     * Updates an existing goal asynchronously.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal management.
     *
     * @param goal Goal to update
     * @return Operation success status
     */
    suspend fun updateGoal(goal: Goal): Boolean {
        return try {
            goalUseCases.updateGoal(goal)
            true
        } catch (e: Exception) {
            _state.value = _state.value.copy(
                error = e.message ?: "Failed to update goal"
            )
            false
        }
    }

    /**
     * Deletes a goal asynchronously.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal management.
     *
     * @param goal Goal to delete
     * @return Operation success status
     */
    suspend fun deleteGoal(goal: Goal): Boolean {
        return try {
            goalUseCases.deleteGoal(goal)
            true
        } catch (e: Exception) {
            _state.value = _state.value.copy(
                error = e.message ?: "Failed to delete goal"
            )
            false
        }
    }

    /**
     * Updates goal progress asynchronously.
     * Implementation addresses requirement from 1.2 Scope/Core Features for goal progress tracking.
     *
     * @param goal Goal to update progress for
     * @return Operation success status
     */
    fun updateGoalProgress(goal: Goal): Boolean {
        return try {
            viewModelScope.launch {
                goalUseCases.updateGoalProgress(goal.id, goal.currentAmount)
            }
            true
        } catch (e: Exception) {
            _state.value = _state.value.copy(
                error = e.message ?: "Failed to update goal progress"
            )
            false
        }
    }

    /**
     * Clears any error state.
     */
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}

/**
 * Data class representing the UI state for the goals screen.
 * Implementation addresses requirement from 5.2.1 Mobile Applications for state management.
 */
data class GoalsState(
    val goals: List<Goal> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)