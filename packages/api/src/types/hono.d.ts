import type { UserRole } from '@commutepool/shared';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    role: UserRole;
  }
}
