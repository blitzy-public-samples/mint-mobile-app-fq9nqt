/**
 * Human Tasks:
 * 1. Configure role-based access control rules in environment variables
 * 2. Review and update role validation rules based on security requirements
 * 3. Set up role management and assignment workflows
 * 4. Configure role hierarchy and inheritance if needed
 * 5. Document role requirements for each protected endpoint
 */

import { Injectable, ExecutionContext, ForbiddenException, Reflector } from '@nestjs/common'; // @nestjs/common ^9.0.0
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Requirement: Authorization Model
 * Location: Technical Specification/9.1 Authentication and Authorization/9.1.2 Authorization Model
 * Implementation: Role-based access control guard that validates user roles against required roles metadata
 */
@Injectable()
export class RolesGuard extends JwtAuthGuard {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Requirement: API Security
   * Location: Technical Specification/9.3.1 API Security
   * Implementation: Validates user roles against required roles metadata before allowing request processing
   * 
   * @param context The execution context containing the request and metadata
   * @returns Promise<boolean> True if user has required roles
   * @throws ForbiddenException if role validation fails
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get required roles from route metadata
      const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler()) || [];

      // If no roles are required, allow access
      if (!requiredRoles.length) {
        return true;
      }

      // Validate JWT token first using parent guard
      const isAuthenticated = await super.canActivate(context);
      if (!isAuthenticated) {
        return false;
      }

      // Get authenticated user from request after JWT validation
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Verify user has roles property
      if (!user || !Array.isArray(user.roles)) {
        throw new ForbiddenException('User roles not found');
      }

      // Validate user roles against required roles
      const hasRequiredRole = user.roles.some(role => 
        requiredRoles.includes(role.toUpperCase())
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException(
        'Role validation failed'
      );
    }
  }
}