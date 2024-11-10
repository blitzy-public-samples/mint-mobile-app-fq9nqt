// External imports
import android.os.Parcelable // version: latest

/**
 * HUMAN TASKS:
 * 1. Ensure the navigation graph in the app module is properly configured to handle these routes
 * 2. Verify that all screen destinations are registered in the NavHost component
 * 3. Confirm that proper navigation animations are set up in the navigation graph
 */

/**
 * Defines the navigation routes and screen destinations for the Mint Replica Lite Android application.
 * This sealed class hierarchy ensures type-safe navigation between screens.
 * 
 * Requirements addressed:
 * - 8.1.1 Mobile Navigation Structure: Implements hierarchical navigation with bottom navigation 
 *   destinations including Dashboard, Accounts, Budgets, Goals, and Settings
 * - 8.1.6 Navigation Flow: Defines navigation paths between authentication, dashboard and feature 
 *   screens ensuring proper flow between login, main features, and settings
 */
sealed class Screen(val route: String) : Parcelable {

    /**
     * Companion object containing route constants for all navigation destinations.
     * These constants are used for type-safe navigation throughout the application.
     */
    companion object {
        const val LOGIN_ROUTE = "login"
        const val DASHBOARD_ROUTE = "dashboard"
        const val ACCOUNTS_ROUTE = "accounts"
        const val BUDGETS_ROUTE = "budgets"
        const val GOALS_ROUTE = "goals"
        const val INVESTMENTS_ROUTE = "investments"
        const val SETTINGS_ROUTE = "settings"
    }

    /**
     * Login screen destination - Entry point for unauthenticated users
     */
    object Login : Screen(LOGIN_ROUTE)

    /**
     * Dashboard screen destination - Main landing screen after authentication
     */
    object Dashboard : Screen(DASHBOARD_ROUTE)

    /**
     * Accounts screen destination - For managing linked financial accounts
     */
    object Accounts : Screen(ACCOUNTS_ROUTE)

    /**
     * Budgets screen destination - For budget management and tracking
     */
    object Budgets : Screen(BUDGETS_ROUTE)

    /**
     * Goals screen destination - For financial goal setting and monitoring
     */
    object Goals : Screen(GOALS_ROUTE)

    /**
     * Investments screen destination - For investment portfolio tracking
     */
    object Investments : Screen(INVESTMENTS_ROUTE)

    /**
     * Settings screen destination - For app configuration and user preferences
     */
    object Settings : Screen(SETTINGS_ROUTE)
}