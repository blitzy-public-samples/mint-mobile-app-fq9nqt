export function useAuth(): { isAuthenticated: boolean, user: { firstName: string } } {
    return {
        isAuthenticated: false, user: {
            firstName: 'Test User 1',
        }
    };
}