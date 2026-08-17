/**
 * Auth Fixtures for CleanCity E2E Tests
 */

import { TEST_CONSTANTS } from '../config/test-constants';

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export function createValidRegisterPayload(overrides?: Partial<RegisterUserDto>): RegisterUserDto {
  const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  return {
    email: `user_${uniqueId}@test.cleancity.io`,
    password: 'Password123!Secure',
    name: `User Test ${uniqueId}`,
    ...overrides,
  };
}

export function createValidLoginPayload(role: 'ADMIN' | 'MANAGER' | 'USER' = 'USER'): LoginUserDto {
  if (role === 'ADMIN') {
    return {
      email: TEST_CONSTANTS.ADMIN_USER.email,
      password: TEST_CONSTANTS.ADMIN_USER.password,
    };
  }
  if (role === 'MANAGER') {
    return {
      email: TEST_CONSTANTS.MANAGER_USER.email,
      password: TEST_CONSTANTS.MANAGER_USER.password,
    };
  }
  return {
    email: TEST_CONSTANTS.USER_ALICE.email,
    password: TEST_CONSTANTS.USER_ALICE.password,
  };
}

export function createInvalidLoginPayload(): LoginUserDto {
  return {
    email: 'nonexistent.user@fake.com',
    password: 'WrongPassword999!',
  };
}
