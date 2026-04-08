import React from 'react';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string | React.ReactNode;
    plainText?: string;
    onSpeak?: (text: string) => void;
}

// Convierte texto inline con **negrita** e *cursiva* a React nodes
function renderInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let last = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));
        if (match[2]) {
            parts.push(<strong key={key++} className="font-semibold text-gray-800">{match[2]}</strong>);
        } else if (match[3]) {
            parts.push(<em key={key++} className="italic">{match[3]}</em>);
        }
        last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

function MarkdownContent({ content }: { content: string }) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Encabezados
        if (line.startsWith('### ')) {
            elements.push(<h3 key={key++} className="text-base font-semibold text-gray-700 mt-4 mb-1">{renderInline(line.slice(4))}</h3>);
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={key++} className="text-lg font-bold text-gray-800 mt-4 mb-2">{renderInline(line.slice(3))}</h2>);
            i++; continue;
        }
        if (line.startsWith('# ')) {
            elements.push(<h1 key={key++} className="text-xl font-bold text-gray-800 mt-4 mb-2">{renderInline(line.slice(2))}</h1>);
            i++; continue;
        }

        // Separador
        if (line.match(/^---+$/)) {
            elements.push(<hr key={key++} className="border-gray-200 my-3" />);
            i++; continue;
        }

        // Lista sin orden
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
                items.push(<li key={key++} className="leading-relaxed">{renderInline(lines[i].slice(2))}</li>);
                i++;
            }
            elements.push(<ul key={key++} className="list-disc pl-5 mb-2 space-y-1 text-gray-600">{items}</ul>);
            continue;
        }

        // Lista ordenada
        if (line.match(/^\d+\.\s/)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
                const text = lines[i].replace(/^\d+\.\s/, '');
                items.push(<li key={key++} className="leading-relaxed">{renderInline(text)}</li>);
                i++;
            }
            elements.push(<ol key={key++} className="list-decimal pl-5 mb-2 space-y-1 text-gray-600">{items}</ol>);
            continue;
        }

        // Línea en blanco
        if (line.trim() === '') {
            i++; continue;
        }

        // Párrafo normal
        elements.push(<p key={key++} className="text-gray-600 mb-2 leading-relaxed">{renderInline(line)}</p>);
        i++;
    }

    return <div className="space-y-0.5">{elements}</div>;
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
                <div className={`text-base md:text-lg leading-relaxed font-normal ${isUser ? 'text-gray-800' : 'text-gray-600'}`}>
                    {!isUser && typeof content === 'string' ? (
                        <div className="flex items-start gap-2">
                            <div className="bg-white px-5 py-3 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm border border-black/5">
                                <MarkdownContent content={content} />
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

                {/* Botón escuchar */}
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
