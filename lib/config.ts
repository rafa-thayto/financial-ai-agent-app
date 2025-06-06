export const OLLAMA_CONFIG = {
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: process.env.OLLAMA_MODEL || "llama3.2:latest",
};

export const APP_CONFIG = {
  name: "AI-Powered Finance Tracker",
  description: "Track your expenses and income using natural language",
};
