import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents: Components = {
    h1: ({ children }) => <h1 className="text-xl font-bold text-gray-800 mt-4 mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold text-gray-800 mt-3 mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-gray-700 mt-3 mb-1">{children}</h3>,
    p: ({ children }) => <p className="text-gray-600 mb-2 leading-relaxed">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-gray-600">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-gray-600">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-[#C5A47E] pl-4 italic text-gray-500 my-2">{children}</blockquote>,
    hr: () => <hr className="border-gray-200 my-3" />,
    code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-700">{children}</code>,
};

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
                    } flex flex-col gap-2`}
            >
                <div className={`text-lg md:text-xl leading-relaxed font-normal ${isUser ? 'text-gray-800' : 'text-gray-600'}`}>
                    {/* Bot Bubble (Optional Card) vs User Text */}
                    {!isUser && typeof content === 'string' ? (
                        <div className="flex items-start gap-2">
                            <div className="bg-white px-5 py-3 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm border border-black/5 max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
                            </div>
                        </div>
                    ) : isUser ? (
                        <span className="inline-block text-gray-500 bg-[#F0EEE6] px-5 py-3 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl text-base opacity-80">
                            {content}
                        </span>
                    ) : (
                        content
                    )}


                </div>

                {/* Manual TTS Button for Assistant - Now always visible */}
                {!isUser && onSpeak && plainText && (
                    <button
                        onClick={() => onSpeak(plainText)}
                        className="self-start p-2 text-gray-400 hover:text-[#C5A47E] hover:bg-white rounded-lg transition-all flex items-center gap-2 text-xs font-medium border border-gray-200 hover:border-[#C5A47E] bg-white/50 hover:shadow-sm"
                        title="Escuchar mensaje"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        Escuchar
                    </button>
                )}
            </div>
        </div>
    );
}
