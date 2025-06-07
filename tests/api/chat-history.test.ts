import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/chat/history/route";
import { NextRequest } from "next/server";

// Mock the database operations
vi.mock("@/lib/database", () => ({
  getChatMessages: vi.fn(),
  getUserMessages: vi.fn(),
}));

import { getChatMessages, getUserMessages } from "@/lib/database";

describe("/api/chat/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/chat/history", () => {
    it("should return all chat messages by default", async () => {
      const mockMessages = [
        {
          id: 1,
          type: "user" as const,
          content: "Hello",
          context: null,
          created_at: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          type: "assistant" as const,
          content: "Hi there!",
          context: null,
          created_at: "2024-01-01T00:01:00Z",
          createdAt: "2024-01-01T00:01:00Z",
        },
      ];

      const mockGetChatMessages = vi.mocked(getChatMessages);
      mockGetChatMessages.mockResolvedValue(mockMessages);

      const request = new NextRequest("http://localhost:3000/api/chat/history");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages).toEqual(mockMessages);
      expect(mockGetChatMessages).toHaveBeenCalledWith(100);
    });

    it("should return only user messages when type=user", async () => {
      const mockUserMessages = [
        {
          id: 1,
          type: "user" as const,
          content: "Hello",
          context: null,
          created_at: "2024-01-01T00:00:00Z",
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      const mockGetUserMessages = vi.mocked(getUserMessages);
      mockGetUserMessages.mockResolvedValue(mockUserMessages);

      const request = new NextRequest(
        "http://localhost:3000/api/chat/history?type=user"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages).toEqual(mockUserMessages);
      expect(mockGetUserMessages).toHaveBeenCalledWith(100);
    });

    it("should handle custom limit parameter", async () => {
      const mockGetChatMessages = vi.mocked(getChatMessages);
      mockGetChatMessages.mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/chat/history?limit=50"
      );
      await GET(request);

      expect(mockGetChatMessages).toHaveBeenCalledWith(50);
    });

    it("should handle invalid limit parameter", async () => {
      const mockGetChatMessages = vi.mocked(getChatMessages);
      mockGetChatMessages.mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/chat/history?limit=invalid"
      );
      await GET(request);

      // parseInt('invalid') returns NaN, which should be handled gracefully
      expect(mockGetChatMessages).toHaveBeenCalledWith(NaN);
    });

    it("should handle database errors", async () => {
      const mockGetChatMessages = vi.mocked(getChatMessages);
      mockGetChatMessages.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/chat/history");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to retrieve chat history");
      expect(data.details).toBe("Database error");
    });

    it("should handle user messages database errors", async () => {
      const mockGetUserMessages = vi.mocked(getUserMessages);
      mockGetUserMessages.mockRejectedValue(new Error("User messages error"));

      const request = new NextRequest(
        "http://localhost:3000/api/chat/history?type=user"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to retrieve chat history");
      expect(data.details).toBe("User messages error");
    });

    it("should handle invalid type parameter gracefully", async () => {
      const mockMessages = [
        {
          id: 1,
          type: "user" as const,
          content: "Test message",
          context: null,
          createdAt: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockGetChatMessages = vi.mocked(getChatMessages);
      const mockGetUserMessages = vi.mocked(getUserMessages);

      mockGetChatMessages.mockResolvedValue(mockMessages);

      const request = new NextRequest(
        "http://localhost:3000/api/chat/history?type=invalid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messages).toEqual(mockMessages);

      // Should call getChatMessages since type is not "user"
      expect(mockGetChatMessages).toHaveBeenCalledWith(100);
      expect(mockGetUserMessages).not.toHaveBeenCalled();
    });
  });
});
