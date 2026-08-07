import { describe, it, expect } from 'vitest';
import { buildTenantQuery, assertUserOwnership } from '../tenant';

describe('Tenant Isolation Utils', () => {
  it('should attach userId to any query criteria', () => {
    const userId = 'user-123';
    const query = buildTenantQuery(userId, { id: 'account-999', isActive: true });

    expect(query).toEqual({
      id: 'account-999',
      isActive: true,
      userId: 'user-123',
    });
    expect(query.userId).toBe(userId);
  });

  it('should pass ownership assertion if userIds match', () => {
    expect(() => assertUserOwnership('user-123', 'user-123')).not.toThrow();
  });

  it('should throw an error if entity userId does not match authenticated userId', () => {
    expect(() => assertUserOwnership('user-456', 'user-123')).toThrowError(/Forbidden/);
  });
});
