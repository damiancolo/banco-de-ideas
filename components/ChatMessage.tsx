import React from 'react';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === 'user';

    return (
        <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div
                className={`max-w-[90%] md:max-w-[85%] px-0 py-2 ${isUser
                        ? 'text-right'
                        : 'text-left'
                    }`}
            >
                <div className={`text-lg md:text-xl leading-relaxed font-normal ${isUser ? 'text-gray-800' : 'text-gray-600'}`}>
                    {/* Bot Bubble (Optional Card) vs User Text */}
                    {!isUser && typeof content === 'string' ? (
                        <span className="bg-white px-5 py-3 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm border border-black/5 inline-block">
                            {content}
                        </span>
                    ) : isUser ? (
                        <span className="inline-block text-gray-500 bg-[#F0EEE6] px-5 py-3 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl text-base opacity-80">
                            {content}
                        </span>
                    ) : (
                        content
                    )}
                </div>
            </div>
        </div>
    );
}
