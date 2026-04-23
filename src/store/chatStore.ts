import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  stepContext?: number;
  actions?: ChatAction[];
}

export interface ChatAction {
  label: string;
  type: 'navigate' | 'runStep' | 'openPage' | 'download' | 'link';
  payload: string;
}

export interface ChatMemory {
  userName?: string;
  preferredIDE?: 'zed' | 'vscode' | 'both';
  setupCompletedOnce: boolean;
  commonTopics: string[];
  totalMessages: number;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  memory: ChatMemory;
  isTyping: boolean;
  suggestedPrompts: string[];
  lastContextStep: number;

  toggle: () => void;
  open: () => void;
  close: () => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setTyping: (typing: boolean) => void;
  setSuggestedPrompts: (prompts: string[]) => void;
  updateMemory: (patch: Partial<ChatMemory>) => void;
  clearHistory: () => void;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content: "Hi! I'm **Claw**, your workspace setup assistant. I can explain steps, help fix issues, or just chat about the setup. What would you like to know?",
          timestamp: Date.now(),
        },
      ],
      memory: {
        setupCompletedOnce: false,
        commonTopics: [],
        totalMessages: 1,
      },
      isTyping: false,
      suggestedPrompts: [
        "What does Step 2 do?",
        "Is this safe?",
        "How much longer?",
        "Which accounts do I need?",
      ],
      lastContextStep: 1,

      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              ...msg,
              id: generateId(),
              timestamp: Date.now(),
            },
          ],
          memory: {
            ...s.memory,
            totalMessages: s.memory.totalMessages + 1,
          },
        })),
      setTyping: (typing) => set({ isTyping: typing }),
      setSuggestedPrompts: (prompts) => set({ suggestedPrompts: prompts }),
      updateMemory: (patch) =>
        set((s) => ({ memory: { ...s.memory, ...patch } })),
      clearHistory: () =>
        set({
          messages: [
            {
              id: generateId(),
              role: 'assistant',
              content: "Hi! I'm **Claw**, your workspace setup assistant. History cleared — fresh start! What would you like to know?",
              timestamp: Date.now(),
            },
          ],
        }),
    }),
    {
      name: 'workspace_chat_state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-100), // Keep last 100 messages
        memory: state.memory,
        lastContextStep: state.lastContextStep,
      }),
    }
  )
);

export default useChatStore;
