import React, { useState } from 'react';
import { Order } from '@/lib/mockGigs';
import { X, Send } from 'lucide-react';

interface ChatModalProps {
  order: Order;
  currentAddress: string;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ order, currentAddress, onClose }) => {
  const [inputText, setInputText] = useState('');

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
          {order.chatMessages.map(msg => {
            const isMe = msg.senderAddress === currentAddress;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-500 mb-1">
                  {isMe ? 'You' : 'Freelancer'}
                </span>
                <div className={`p-3 rounded-xl text-xs max-w-[85%] ${
                  isMe ? 'bg-neoncyan/20 text-white rounded-tr-sm' : 'bg-white/5 text-gray-300 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-gray-600 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5 bg-black/20 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-obsidian border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neoncyan transition-colors"
            />
            <button className="p-2.5 bg-neoncyan text-obsidian rounded-lg hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
