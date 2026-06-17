import React, { useState, useEffect, useRef } from 'react';
import { Order, ChatMessage } from '@/lib/types';
import { X, Send } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendChatMessage } from '@/lib/db';
import { chatMessageSchema } from '@/lib/validation';

interface ChatModalProps {
  order: Order;
  currentAddress: string;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ order, currentAddress, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(order.chatMessages || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'orders', order.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Order;
        if (data.chatMessages) setMessages(data.chatMessages);
      }
    });
    return () => unsubscribe();
  }, [order.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    
    const validationResult = chatMessageSchema.safeParse({ text });
    if (!validationResult.success) return;
    
    setIsSending(true);
    const sanitizedText = validationResult.data.text;
    setInputText('');
    
    try {
      await sendChatMessage(order.id, currentAddress, sanitizedText);
    } catch (e) {
      console.error('Failed to send message:', e);
      setInputText(text); // Restore on failure
    } finally {
      setIsSending(false);
    }
  };

  const getSenderLabel = (senderAddr: string) => {
    if (senderAddr === currentAddress) return 'You';
    if (senderAddr === order.clientAddress) return 'Client';
    if (senderAddr === order.freelancerAddress) return 'Freelancer';
    return 'Mediator';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-violet-dark border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[500px]">

        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 rounded-t-2xl">
          <div>
            <h3 className="font-heading font-bold text-white">Project Chat</h3>
            <p className="text-[10px] text-gray-400">Order #{order.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => {
            const isMe = msg.senderAddress === currentAddress;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-500 mb-1">
                  {getSenderLabel(msg.senderAddress)}
                </span>
                <div className={`p-3 rounded-xl text-xs max-w-[85%] ${
                  isMe ? 'bg-neoncyan/20 text-white rounded-tr-sm' : 'bg-white/5 text-gray-300 rounded-tl-sm'
                }`} style={{ wordBreak: 'break-word' }}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-gray-600 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-black/20 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1 bg-obsidian border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neoncyan transition-colors disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="p-2.5 bg-neoncyan text-obsidian rounded-lg hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
