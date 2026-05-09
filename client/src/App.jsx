import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatStore } from './store/chatStore';
import { Send, Settings, Menu } from 'lucide-react';
import './index.css'; // Tailwind imports

export default function App() {
  const [input, setInput] = useState('');
  const { messages, endpoint, model, addMessage, updateLastMessage, setEndpoint } = useChatStore();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    addMessage(userMessage);
    setInput('');
    addMessage({ role: 'assistant', content: '' }); // Placeholder for streaming

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, endpoint, model }),
      });

      // Handle Streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const data = JSON.parse(line.replace('data: ', ''));
            updateLastMessage(data.text);
          }
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      updateLastMessage("\n\n**Error:** Failed to reach the AI endpoint.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 p-4 border-r border-gray-800 flex flex-col">
        <button className="flex items-center gap-2 w-full p-3 rounded-md bg-gray-800 hover:bg-gray-700 transition">
          <Menu size={18} /> New Chat
        </button>
        <div className="mt-8 flex-grow">
          <h3 className="text-xs text-gray-500 font-semibold mb-2">ENDPOINTS</h3>
          <select 
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 mb-4"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="google">Google Vertex</option>
          </select>
        </div>
        <div className="mt-auto border-t border-gray-800 pt-4 flex items-center gap-2 cursor-pointer hover:text-white transition">
          <Settings size={18} /> Settings
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl rounded-lg p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                <ReactMarkdown className="prose prose-invert max-w-none">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="1"
              placeholder={`Message ${endpoint}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-white"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            AI models can make mistakes. Verify important information.
          </p>
        </div>
      </main>
    </div>
  );
}
