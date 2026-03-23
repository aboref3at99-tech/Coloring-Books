import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { startChat } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

export const ChatBot: React.FC<{ kimiKey?: string }> = ({ kimiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemPrompt = "أنت مساعد مفيد لمولد كتب التلوين للأطفال. يمكنك مساعدة الآباء في ابتكار موضوعات إبداعية، أو شرح كيفية عمل التطبيق، أو تقديم نصائح حول التلوين. اجعل نبرة صوتك ودودة ومشجعة ومفيدة. يرجى الرد باللغة العربية دائماً.";

  useEffect(() => {
    if (isOpen) {
      chatRef.current = startChat(systemPrompt, isThinking, kimiKey);
    }
  }, [isOpen, isThinking, kimiKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "عذراً، لم أتمكن من معالجة ذلك." }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaError) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: "عذراً، لقد تجاوزت حصة الاستخدام الحالية (Quota Exceeded). يرجى الانتظار قليلاً قبل المحاولة مرة أخرى. يمكنك أيضاً تجربة مسح المحادثة من الزر أعلاه للبدء من جديد." 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "عذراً! حدث خطأ ما. يرجى المحاولة مرة أخرى." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-full shadow-xl transition-all transform hover:scale-110 flex items-center justify-center"
          id="chat-toggle-btn"
        >
          <MessageCircle size={28} />
        </button>
      ) : (
        <div className="bg-white w-80 sm:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden" id="chat-window">
          {/* Header */}
          <div className="bg-pink-600 p-4 text-white flex justify-between items-center" dir="rtl">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-semibold">المساعد الذكي</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsThinking(!isThinking)}
                className={`p-1 rounded transition-colors flex items-center gap-1 text-[10px] font-bold ${isThinking ? 'bg-white text-pink-600' : 'hover:bg-pink-700 text-white border border-white/20'}`}
                title={isThinking ? "إيقاف وضع التفكير" : "تفعيل وضع التفكير"}
              >
                {isThinking ? "تفكير عميق" : "تفكير عادي"}
              </button>
              <button 
                onClick={() => {
                  setMessages([]);
                  chatRef.current = null;
                  chatRef.current = startChat(systemPrompt, isThinking, kimiKey);
                }} 
                className="hover:bg-pink-700 p-1 rounded transition-colors text-xs"
                title="مسح المحادثة"
              >
                مسح
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-pink-700 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" dir="rtl">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <p className="text-sm italic">اسألني أي شيء عن كتب التلوين!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-pink-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                }`}>
                  <div className="markdown-body">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none">
                  <Loader2 size={16} className="animate-spin text-pink-600" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white" dir="rtl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالة..."
                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-pink-600 hover:bg-pink-700 text-white p-2 rounded-full transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
