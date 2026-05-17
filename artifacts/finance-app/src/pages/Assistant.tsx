import { useState, useRef, useEffect } from "react";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";
import { ChatHistoryItem } from "@workspace/api-client-react/src/generated/api.schemas";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTED_PROMPTS = [
  "How much did I spend this month?",
  "Where am I overspending?",
  "How can I save money?"
];

export default function Assistant() {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([
    { role: "assistant", content: "Hi! I'm FinWise AI. I can analyze your spending, suggest budgets, or answer general finance questions. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const sendMessage = useSendChatMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || sendMessage.isPending) return;

    const userMessage: ChatHistoryItem = { role: "user", content: textToSend.trim() };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput("");

    sendMessage.mutate({
      data: {
        message: userMessage.content,
        history: messages.slice(-5)
      }
    }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
      }
    });
  };

  return (
    <div className="h-[calc(100dvh-6rem)] md:h-[calc(100dvh-4rem)] flex flex-col space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col border-none shadow-xl overflow-hidden glass-card">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm flex items-center gap-4 relative z-10">
          <div className="relative">
            <div className="w-12 h-12 rounded-full gradient-indigo flex items-center justify-center shadow-md">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">FinWise AI</h2>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Online</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-8 justify-center mt-4">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(undefined, prompt)}
                  className="px-4 py-2 rounded-full bg-background/80 border border-border shadow-sm text-sm font-semibold hover:bg-muted transition-colors text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-6 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center shrink-0 shadow-sm mt-auto">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm font-medium ${
                    msg.role === 'user' 
                      ? 'gradient-indigo text-white rounded-2xl rounded-br-sm' 
                      : 'glass-card border-none bg-white/80 dark:bg-[#11162D]/80 text-foreground rounded-2xl rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sendMessage.isPending && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-[80%] mr-auto"
              >
                <div className="w-8 h-8 rounded-full gradient-indigo flex items-center justify-center shrink-0 shadow-sm mt-auto">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="glass-card border-none bg-white/80 dark:bg-[#11162D]/80 text-foreground rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-1.5 shadow-sm">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-primary/60" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary/60" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-primary/60" />
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 sm:p-6 bg-background/80 backdrop-blur-xl border-t border-border/50">
          <form onSubmit={(e) => handleSend(e)} className="flex gap-3 relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your finances..."
              className="flex-1 h-14 rounded-full pl-6 pr-14 text-base bg-muted border-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
              disabled={sendMessage.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || sendMessage.isPending}
              className="absolute right-2 top-2 h-10 w-10 rounded-full gradient-indigo shadow-md border-none text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
