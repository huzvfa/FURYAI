import { create } from 'zustand';

export const useChatStore = create((set) => ({
  messages: [],
  endpoint: 'openai',
  model: 'gpt-4o',
  setEndpoint: (endpoint) => set({ endpoint }),
  setModel: (model) => set({ model }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateLastMessage: (chunk) => set((state) => {
    const newMessages = [...state.messages];
    newMessages[newMessages.length - 1].content += chunk;
    return { messages: newMessages };
  }),
}));
