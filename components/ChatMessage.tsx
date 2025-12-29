import React from 'react';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    plainText?: string;
    onSpeak?: (text: string) => void;
}

export default function ChatMessage({ role, content, plainText, onSpeak }: ChatMessageProps) {
    const isUser = role === 'user';

    return (
        <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div
                className={`max-w-[90%] md:max-w-[85%] px-0 py-2 ${isUser
                    ? 'text-right'
                    : 'text-left'
                    } flex flex-col`}
            >
                <div className={`text-lg md:text-xl leading-relaxed font-normal ${isUser ? 'text-gray-800' : 'text-gray-600'} relative group`}>
                    {/* Bot Bubble (Optional Card) vs User Text */}
                    {!isUser && typeof content === 'string' ? (
                        <div className="flex items-start gap-2">
                            <span className="bg-white px-5 py-3 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm border border-black/5 inline-block">
                                {content}
                            </span>
                        </div>
                    ) : isUser ? (
                        <span className="inline-block text-gray-500 bg-[#F0EEE6] px-5 py-3 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl text-base opacity-80">
                            {content}
                        </span>
                    ) : (
                        content
                    )}

                    {/* Manual TTS Button for Assistant */}
                    {!isUser && onSpeak && plainText && (
                        <button
                            onClick={() => onSpeak(plainText)}
                            className="mt-1 ml-1 p-1.5 text-gray-400 hover:text-[#C5A47E] hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-gray-100"
                            title="Escuchar mensaje"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                            Escuchar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
