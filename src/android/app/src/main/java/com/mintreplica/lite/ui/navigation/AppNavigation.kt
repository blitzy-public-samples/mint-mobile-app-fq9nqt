// External imports - versions specified as per JSON spec
import androidx.navigation.NavHostController // version: 2.6.0
import androidx.navigation.compose.NavHost // version: 2.6.0
import androidx.navigation.compose.composable // version: 2.6.0
import androidx.navigation.compose.rememberNavController // version: 2.6.0
import androidx.compose.runtime.Composable
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut

/**
 * HUMAN TASKS:
 * 1. Verify that all screen composables referenced in navigation are implemented
 * 2. Ensure proper deep linking configuration in Android Manifest
 * 3. Configure navigation animations in theme if custom transitions are needed
 * 4. Set up proper back press handling in MainActivity
 */

/**
 * Main composable function that sets up the navigation graph for the application.
 * Manages screen transitions and navigation state.
 *
 * Requirements addressed:
 * - 8.1.1 Mobile Navigation Structure: Implements hierarchical navigation with bottom navigation
 * - 8.1.6 Navigation Flow: Implements navigation paths between authentication and feature screens
 * - 8.1.2 Screen Layouts: Manages navigation between different screen layouts
 *
 * @param navController The navigation controller for managing app navigation
 */
@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route,
        enterTransition = {
            fadeIn(animationSpec = tween(300)) + slideIntoContainer(
                towards = AnimatedContentTransitionScope.SlideDirection.Start,
                animationSpec = tween(300)
            )
        },
        exitTransition = {
            fadeOut(animationSpec = tween(300)) + slideOutOfContainer(
                towards = AnimatedContentTransitionScope.SlideDirection.End,
                animationSpec = tween(300)
            )
        }
    ) {
        // Authentication flow
        composable(
            route = Screen.Login.route,
            popEnterTransition = {
                fadeIn(animationSpec = tween(300))
            },
            popExitTransition = {
                fadeOut(animationSpec = tween(300))
            }
        ) {
            LoginScreen(navController)
        }

        // Main dashboard screen
        composable(
            route = Screen.Dashboard.route,
            enterTransition = {
                fadeIn(animationSpec = tween(300))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(300))
            }
        ) {
            DashboardScreen(navController)
        }

        // Accounts management
        composable(
            route = Screen.Accounts.route,
            enterTransition = {
                fadeIn(animationSpec = tween(300))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(300))
            }
        ) {
            AccountsScreen(navController)
        }

        // Budget tracking
        composable(
            route = Screen.Budgets.route,
            enterTransition = {
                fadeIn(animationSpec = tween(300))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(300))
            }
        ) {
            BudgetScreen(navController)
        }

        // Financial goals
        composable(
            route = Screen.Goals.route,
            enterTransition = {
                fadeIn(animationSpec = tween(300))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(300))
            }
        ) {
            GoalsScreen(navController)
        }

        // Investment portfolio
        composable(
            route = Screen.Investments.route,
            enterTransition = {
                fadeIn(animationSpec = tween(300))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(300))
            }
        ) {
            InvestmentsScreen(navController)
        }

        // App settings
        composable(
            route = Screen.Settings.route,
            enterTransition = {
                fadeIn(animationSpec = tween(300))
            },
            exitTransition = {
                fadeOut(animationSpec = tween(300))
            }
        ) {
            SettingsScreen(navController)
        }
    }
}

/**
 * Creates and remembers a NavController for the application with proper configuration.
 * Ensures the navigation controller survives configuration changes.
 *
 * Requirements addressed:
 * - 8.1.6 Navigation Flow: Ensures proper state management during navigation
 * - 8.1.2 Screen Layouts: Maintains proper navigation state during configuration changes
 *
 * @return Configured navigation controller instance
 */
@Composable
fun rememberAppNavController(): NavHostController {
    val navController = rememberNavController()
    
    // Configure deep linking
    navController.addOnDestinationChangedListener { controller, destination, arguments ->
        // Handle deep link navigation state
        when (destination.route) {
            Screen.Login.route -> {
                // Clear back stack when returning to login
                controller.popBackStack(
                    route = Screen.Login.route,
                    inclusive = false
                )
            }
            Screen.Dashboard.route -> {
                // Clear back stack when navigating to dashboard
                controller.popBackStack(
                    route = Screen.Dashboard.route,
                    inclusive = false
                )
            }
        }
    }
    
    return navController
}