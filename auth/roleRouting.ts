import { UserRole } from '../types';

export const STAFF_ROLES = [
  UserRole.LOGISTICS,
  UserRole.FINANCE,
  UserRole.SUPPORT
] as const;

export const isStaffRole = (role?: UserRole | string | null) =>
  STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]);

export const getRoleHome = (role?: UserRole | string | null) => {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin/dashboard';
    case UserRole.MERCHANT:
      return '/seller';
    case UserRole.DELIVERY:
      return '/rider';
    case UserRole.LOGISTICS:
      return '/logistics';
    case UserRole.FINANCE:
      return '/finance';
    case UserRole.SUPPORT:
      return '/staff/support';
    case UserRole.CUSTOMER:
    default:
      return '/buyer';
  }
};

export const canRoleAccessPath = (role: UserRole, targetPath: string) => {
  if (!targetPath || !targetPath.startsWith('/')) return false;
  if (targetPath.startsWith('/admin')) return role === UserRole.ADMIN;
  if (targetPath.startsWith('/seller')) return role === UserRole.MERCHANT;
  if (targetPath.startsWith('/rider')) return role === UserRole.DELIVERY;
  if (targetPath.startsWith('/buyer')) return role === UserRole.CUSTOMER;
  if (targetPath.startsWith('/logistics')) return role === UserRole.LOGISTICS;
  if (targetPath.startsWith('/finance')) return role === UserRole.FINANCE;
  if (targetPath.startsWith('/staff/support')) return role === UserRole.SUPPORT;
  if (targetPath.startsWith('/staff/change-password')) return isStaffRole(role);
  return true;
};
