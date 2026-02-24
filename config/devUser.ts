
import { UserRole, User } from '../types';

/**
 * Static mock user for Development Mode.
 * Components can import this directly since AuthContext is removed.
 */
export const DEV_USER: User = {
  id: "USR-DEV-001",
  name: "Mugisha Dev",
  email: "dev@emalla.rw",
  role: UserRole.ADMIN,
  status: 'active',
  createdAt: new Date().toISOString(),
  orderCount: 15
};
