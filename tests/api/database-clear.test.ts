import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/database/clear/route";
import { NextRequest } from "next/server";

// Mock the database operations
vi.mock("@/lib/database", () => ({
  clearDatabase: vi.fn(),
}));

import { clearDatabase } from "@/lib/database";

describe("/api/database/clear", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/database/clear", () => {
    it("should clear database successfully", async () => {
      const mockClearDatabase = vi.mocked(clearDatabase);
      mockClearDatabase.mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/database/clear",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Database cleared successfully");

      expect(mockClearDatabase).toHaveBeenCalledOnce();
    });

    it("should handle database clear errors", async () => {
      const mockClearDatabase = vi.mocked(clearDatabase);
      mockClearDatabase.mockRejectedValue(new Error("Database clear failed"));

      const request = new NextRequest(
        "http://localhost:3000/api/database/clear",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to clear database");
      expect(data.details).toBe("Database clear failed");

      expect(mockClearDatabase).toHaveBeenCalledOnce();
    });

    it("should handle unknown errors", async () => {
      const mockClearDatabase = vi.mocked(clearDatabase);
      mockClearDatabase.mockRejectedValue("Unknown error");

      const request = new NextRequest(
        "http://localhost:3000/api/database/clear",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to clear database");
      expect(data.details).toBe("Unknown error");
    });
  });
});
