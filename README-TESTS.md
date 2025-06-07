# Test Documentation

This document provides comprehensive information about the test suite for the Financial AI Application.

## Overview

The test suite provides comprehensive coverage for all API endpoints in the financial AI application. Tests are written using Vitest with React Testing Library and include proper mocking of database operations and AI agent functionality.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and configuration
└── api/                        # API endpoint tests
    ├── analytics.test.ts        # Analytics API tests (6 tests)
    ├── budgets.test.ts          # Budgets API tests (9 tests)
    ├── chat.test.ts             # Chat API tests (5 tests)
    ├── chat-history.test.ts     # Chat history API tests (6 tests)
    ├── database-clear.test.ts   # Database clear API tests (3 tests)
    ├── financial-overview.test.ts # Financial overview API tests (3 tests)
    ├── insights.test.ts         # Insights API tests (5 tests)
    └── transactions.test.ts     # Transactions API tests (4 tests)
```

## API Endpoints Tested

### 1. Transactions API (`/api/transactions`)

- **File**: `tests/api/transactions.test.ts`
- **Tests**: 4 tests
- **Coverage**:
  - GET endpoint with transaction retrieval and summary
  - Custom limit parameters
  - Database error handling
  - Invalid parameter handling

### 2. Chat API (`/api/chat`)

- **File**: `tests/api/chat.test.ts`
- **Tests**: 5 tests
- **Coverage**:
  - POST endpoint message processing
  - AI agent integration and responses
  - Transaction creation from chat
  - Error handling for AI failures
  - JSON validation and parsing

### 3. Chat History API (`/api/chat/history`)

- **File**: `tests/api/chat-history.test.ts`
- **Tests**: 6 tests
- **Coverage**:
  - GET endpoint message retrieval
  - User-specific message filtering
  - Limit parameter handling
  - Database error scenarios
  - User messages vs all messages

### 4. Database Clear API (`/api/database/clear`)

- **File**: `tests/api/database-clear.test.ts`
- **Tests**: 3 tests
- **Coverage**:
  - POST endpoint successful clearing
  - Database operation error handling
  - Unknown error scenarios

### 5. Financial Overview API (`/api/financial-overview`)

- **File**: `tests/api/financial-overview.test.ts`
- **Tests**: 3 tests
- **Coverage**:
  - GET endpoint overview retrieval
  - AI agent error handling
  - Unknown error scenarios

### 6. Budgets API (`/api/budgets`) ⭐ NEW

- **File**: `tests/api/budgets.test.ts`
- **Tests**: 9 tests
- **Coverage**:
  - GET endpoint with budget and spending calculations
  - Budget status determination (on_track, warning, over_budget)
  - POST endpoint for budget creation
  - Input validation (required fields, period validation)
  - Database error handling for both GET and POST
  - JSON parsing error handling

### 7. Insights API (`/api/insights`) ⭐ NEW

- **File**: `tests/api/insights.test.ts`
- **Tests**: 5 tests
- **Coverage**:
  - GET endpoint for AI-generated insights
  - Budget suggestions from AI agent
  - Error handling for AI service failures
  - Unknown error scenarios
  - Empty result handling

### 8. Analytics API (`/api/analytics`) ⭐ NEW

- **File**: `tests/api/analytics.test.ts`
- **Tests**: 6 tests
- **Coverage**:
  - GET endpoint for category analytics
  - Summary calculations (total categories, spent, transactions)
  - Empty data handling
  - Single category scenarios
  - Database error handling
  - Zero totals handling

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

- React plugin for JSX support
- jsdom environment for DOM testing
- Path aliases matching Next.js configuration
- TypeScript support

### Global Setup (`tests/setup.ts`)

- Environment variable configuration
- Mock clearing between tests
- Global test utilities

## Mocking Strategy

### Database Operations

All database functions are mocked using Vitest's `vi.mock()`:

- `getTransactions`, `getTotalByType`
- `insertChatMessage`, `getChatMessages`, `getUserMessages`
- `insertTransaction`
- `clearDatabase`
- `getBudgets`, `setBudget`, `getCurrentMonthSpendingByCategory` ⭐ NEW
- `getCategorySummary` ⭐ NEW

### AI Agent Functions

AI agent operations are mocked for predictable testing:

- `processMessage` - Chat message processing
- `generateProactiveInsights` - Financial insights generation ⭐ NEW
- `suggestBudgets` - Budget recommendations ⭐ NEW
- `getFinancialOverview` - Financial summary

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:run

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

### Test Coverage Results

```
Test Files: 8 passed (8)
Tests: 41 passed (41)

API Coverage:
- /api/analytics: 100% statement coverage
- /api/budgets: 100% statement coverage
- /api/chat: 70.27% statement coverage
- /api/chat/history: 100% statement coverage
- /api/database/clear: 100% statement coverage
- /api/financial-overview: 100% statement coverage
- /api/insights: 100% statement coverage
- /api/transactions: 100% statement coverage
```

## Test Patterns

### 1. Successful Operation Tests

Each endpoint includes tests for successful operations with expected data structures and response formats.

### 2. Error Handling Tests

Comprehensive error scenario testing including:

- Database connection failures
- AI service unavailability
- Invalid input parameters
- JSON parsing errors
- Unknown error conditions

### 3. Edge Case Tests

- Empty data scenarios
- Boundary value testing
- Parameter validation
- Status code verification

### 4. Mock Verification

Tests verify that mocked functions are called with correct parameters and expected frequency.

## Database Functions Added

### New Functions Implemented

1. **`getCurrentMonthSpendingByCategory(category: string)`**

   - Returns current month spending for a specific category
   - Used by budgets API for spending calculations

2. **`getCategorySummary()`**
   - Returns spending summary grouped by category
   - Includes total amount and transaction count per category
   - Used by analytics API

## Benefits

### 1. Reliability

- All API endpoints thoroughly tested
- Error scenarios covered
- Regression prevention

### 2. Documentation

- Tests serve as living documentation
- Clear examples of API usage
- Expected response formats documented

### 3. Development Confidence

- Safe refactoring with test coverage
- Immediate feedback on breaking changes
- Consistent API behavior validation

### 4. CI/CD Ready

- Automated test execution
- Coverage reporting
- Integration pipeline support

## Future Enhancements

### Potential Additions

1. **Integration Tests**: End-to-end API testing with real database
2. **Performance Tests**: Load testing for API endpoints
3. **Contract Tests**: API contract validation
4. **Component Tests**: Frontend component testing
5. **E2E Tests**: Full application workflow testing

### Coverage Improvements

- Increase chat API coverage (currently 70.27%)
- Add tests for filtered transactions endpoint
- Component and page testing
- Database operations testing

## Maintenance

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Include comprehensive error scenarios
4. Update this documentation

### Updating Existing Tests

1. Maintain backward compatibility
2. Update mocks when API changes
3. Verify coverage doesn't decrease
4. Update documentation as needed

---

**Total Test Coverage**: 41 tests across 8 API endpoints
**Last Updated**: December 2024
