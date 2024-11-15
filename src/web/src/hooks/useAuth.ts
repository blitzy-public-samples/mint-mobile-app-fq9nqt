import { mockUser } from "@/mocks/mockData";
import { User } from "@/types/models.types";

export function useAuth(): { isAuthenticated: boolean, user: User } {
    return {
        isAuthenticated: true,
        user: mockUser
    };
}