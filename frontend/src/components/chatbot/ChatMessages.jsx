import React from 'react';
import ChatBubble from './ChatBubble.jsx';
import RobotLoader from '../common/RobotLoader.jsx';

export default function ChatMessages({ messages, loading }) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((msg, idx) => (
        <ChatBubble
          key={idx}
          role={msg.role}
          text={msg.text}
          imageUrl={msg.imageUrl || ''}
        />
      ))}
      {loading && (
        <div className="flex justify-start">
          <RobotLoader label="Pensando..." scale={0.55} />
        </div>
      )}
    </div>
  );
}
