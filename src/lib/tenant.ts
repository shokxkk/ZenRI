import { auth } from '@/lib/auth';

/**
 * Ensures that the current user is authenticated and returns the userId.
 * Throws an Error if unauthenticated.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized access. User session is invalid or expired.');
  }
  return session.user.id;
}

/**
 * Constructs a strict Prisma standard filter object combining entity ID and authenticated userId.
 */
export function buildTenantQuery<T extends Record<string, unknown>>(
  userId: string,
  extra: T
): T & { userId: string } {
  return {
    ...extra,
    userId,
  };
}

/**
 * Assert that an entity belongs to the user, throwing if not matched.
 */
export function assertUserOwnership(entityUserId: string, currentUserId: string): void {
  if (entityUserId !== currentUserId) {
    throw new Error('Forbidden. You do not have permission to access or modify this resource.');
  }
}
