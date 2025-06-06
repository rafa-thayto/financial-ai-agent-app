interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  agentType?:
    | "transaction"
    | "question"
    | "insight"
    | "budget_alert"
    | "suggestion"
    | "balance"
    | "help";
  suggestions?: string[];
  requiresClarification?: boolean;
  clarificationQuestion?: string;
}

class ChatStore {
  private messages: ChatMessage[] = [];
  private listeners: Set<(messages: ChatMessage[]) => void> = new Set();
  private hasLoadedHistory = false;
  private isRefreshing = false;

  subscribe(listener: (messages: ChatMessage[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getMessages() {
    return this.messages;
  }

  setMessages(messages: ChatMessage[]) {
    this.messages = messages;
    this.notifyListeners();
  }

  addMessage(message: ChatMessage) {
    // Add message to local state immediately for responsive UI
    console.log("ChatStore: Adding message locally:", message);
    this.messages = [...this.messages, message];
    this.notifyListeners();

    // Schedule a refresh to sync with database after a short delay
    setTimeout(() => {
      console.log("ChatStore: Scheduling refresh after message add");
      this.refreshHistory();
    }, 1000);
  }

  hasLoaded() {
    return this.hasLoadedHistory;
  }

  setLoaded(loaded: boolean) {
    this.hasLoadedHistory = loaded;
  }

  private notifyListeners() {
    console.log(
      "ChatStore: Notifying listeners, message count:",
      this.messages.length
    );
    this.listeners.forEach((listener) => listener(this.messages));
  }

  async loadHistory() {
    if (this.hasLoadedHistory) return;

    try {
      const response = await fetch("/api/chat/history?limit=20");
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages
          .reverse() // Reverse since DB returns newest first, but we want oldest first for display
          .map((msg: any) => ({
            id: msg.id.toString(),
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            agentType: msg.context
              ? this.parseContext(msg.context)?.type
              : undefined,
            suggestions: msg.context
              ? this.parseContext(msg.context)?.suggestions
              : undefined,
          }));
        this.setMessages(formattedMessages);
      } else {
        // Show welcome message if no history
        this.setMessages([
          {
            id: "welcome",
            type: "assistant",
            content:
              '🤖 Hi! I\'m your intelligent financial assistant. I can help you track expenses, provide insights, check your balance, and suggest budgets.\n\n💡 **Need help?** Just ask "What can you do?" for a complete overview of my capabilities!\n\n🚀 **Quick examples:**\n• "What\'s my balance?" - Get financial overview\n• "I spent $15 on lunch" - Record transaction\n• "How am I doing this month?" - Get insights\n• "Help with budgets" - Budget assistance',
            timestamp: new Date(),
            agentType: "help",
          },
        ]);
      }
      this.setLoaded(true);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Show welcome message on error
      this.setMessages([
        {
          id: "welcome",
          type: "assistant",
          content:
            '🤖 Hi! I\'m your intelligent financial assistant. I can help you track expenses, provide insights, check your balance, and suggest budgets.\n\n💡 **Need help?** Just ask "What can you do?" for a complete overview of my capabilities!\n\n🚀 **Quick examples:**\n• "What\'s my balance?" - Get financial overview\n• "I spent $15 on lunch" - Record transaction\n• "How am I doing this month?" - Get insights\n• "Help with budgets" - Budget assistance',
          timestamp: new Date(),
          agentType: "help",
        },
      ]);
      this.setLoaded(true);
    }
  }

  async refreshHistory() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      const response = await fetch("/api/chat/history?limit=50");
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages
          .reverse() // Reverse since DB returns newest first, but we want oldest first for display
          .map((msg: any) => ({
            id: msg.id.toString(),
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            agentType: msg.context
              ? this.parseContext(msg.context)?.type
              : undefined,
            suggestions: msg.context
              ? this.parseContext(msg.context)?.suggestions
              : undefined,
          }));

        // Always update with the latest from database to ensure sync
        // Remove any local-only messages that might not have been saved yet
        const dbMessageIds = new Set(
          formattedMessages.map((msg: ChatMessage) => msg.id)
        );
        const localMessages = this.messages.filter(
          (msg: ChatMessage) =>
            msg.id === "welcome" ||
            dbMessageIds.has(msg.id) ||
            // Keep very recent messages that might not be in DB yet
            Date.now() - msg.timestamp.getTime() < 5000
        );

        // Merge database messages with any recent local messages
        const mergedMessages = [...formattedMessages];
        localMessages.forEach((localMsg) => {
          if (!dbMessageIds.has(localMsg.id) && localMsg.id !== "welcome") {
            mergedMessages.push(localMsg);
          }
        });

        // Sort by timestamp to ensure proper order
        mergedMessages.sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );

        this.setMessages(mergedMessages);
      }
    } catch (error) {
      console.error("Failed to refresh chat history:", error);
    } finally {
      this.isRefreshing = false;
    }
  }

  private parseContext(contextStr: string | null): any {
    if (!contextStr) return null;
    try {
      return JSON.parse(contextStr);
    } catch (error) {
      console.warn("Failed to parse context:", error);
      return null;
    }
  }

  // Force refresh from database (useful for debugging)
  async forceRefresh() {
    this.isRefreshing = false;
    await this.refreshHistory();
  }

  // Debug function to check store state
  debug() {
    console.log("Chat Store Debug:", {
      messageCount: this.messages.length,
      hasLoadedHistory: this.hasLoadedHistory,
      isRefreshing: this.isRefreshing,
      listenerCount: this.listeners.size,
      lastMessage: this.messages[this.messages.length - 1],
    });
  }

  // Clear all messages (useful for testing)
  clear() {
    this.messages = [];
    this.hasLoadedHistory = false;
    this.notifyListeners();
  }
}

export const chatStore = new ChatStore();
export type { ChatMessage };
