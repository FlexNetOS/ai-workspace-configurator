import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Brain, Zap } from 'lucide-react';
import { sendMessage } from '../lib/aiService';
import type { Message } from '../lib/aiService';
import ReactMarkdown from 'react-markdown';

interface AIChatPanelProps {
  context: {
    lastPrompt: string;
    metrics: string;
    accounts: string;
    enclaveStatus: string;
    dynamicSkills?: string;
  };
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello Architect. I am your specialized AI Assistant. I have loaded the Orchestrator Skills and your current session metadata into my active memory. How can I help you refine your environment today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const response = await sendMessage([...messages, userMessage], context);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/50">
      {/* Context Status Bar */}
      <div className="p-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Brain className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Memory:</span>
          <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-tighter">Synchronized</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Skills:</span>
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-tighter">V4.2_Loaded</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-900">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-slate-800 border border-slate-700'
                }`}>
                  {msg.role === 'user' ? <User className="w-3 h-3 text-blue-400" /> : <Bot className="w-3 h-3 text-slate-400" />}
                </div>
                <div className={`p-3 rounded-lg text-[11px] leading-relaxed font-medium ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-900/80 border border-slate-800 text-slate-300'
                }`}>
                  <div className="prose prose-invert prose-xs max-w-none">
                    <ReactMarkdown 
                      components={{
                        code: ({ children }) => <code className="bg-black/30 px-1 rounded text-blue-300 font-mono text-[10px]">{children}</code>
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-slate-900/50 p-2 px-3 rounded-full flex gap-1">
                <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900/40 border-t border-slate-800">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Interrogate the architect..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-[11px] font-mono focus:outline-none focus:border-blue-600 transition-all placeholder:text-slate-700"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
