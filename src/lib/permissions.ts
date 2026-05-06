export type UserRole = 'admin' | 'ceo' | 'manager' | 'employee' | 'intern' | 'viewer';

export const RoleHierarchy: Record<UserRole, number> = {
  admin: 100,
  ceo: 80,
  manager: 60,
  employee: 40,
  intern: 20,
  viewer: 10,
};

/**
 * Checks if a user has sufficient permissions based on their role.
 * @param userRole The role of the current user.
 * @param requiredRole The minimum role required for the action.
 * @returns boolean
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}

/**
 * Specifically checks for write/modify access.
 * Viewers are read-only regardless of hierarchy level (though hierarchy-wise they are at the bottom).
 */
export function canWrite(userRole: UserRole): boolean {
  return userRole !== 'viewer' && userRole !== 'intern'; // Assuming interns might be read-only too, or maybe not. User didn't specify.
  // Actually, usually in these systems:
  // admin, ceo, manager, employee -> can write
  // intern -> maybe limited?
  // viewer -> definitely read only.
}
