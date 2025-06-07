import "@testing-library/jest-dom";
import { beforeAll, afterAll, beforeEach, vi } from "vitest";

// Mock environment variables for testing
beforeAll(() => {
  process.env.TURSO_DATABASE_URL = "file:./test-finances.db";
});

// Clean up after all tests
afterAll(() => {
  // Clean up test database if needed
});

// Reset modules before each test
beforeEach(() => {
  vi.clearAllMocks();
});
