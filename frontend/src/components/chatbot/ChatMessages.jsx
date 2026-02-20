import React from 'react';
import ChatBubble from './ChatBubble.jsx';

export default function ChatMessages({ messages, loading }) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((msg, idx) => (
        <ChatBubble key={idx} role={msg.role} text={msg.text} imageUrl={msg.imageUrl || ''} />
      ))}
      {loading && <ChatBubble role="assistant" text="Pensando..." />}
    </div>
  );
}
