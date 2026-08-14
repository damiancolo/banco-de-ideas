import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIProvider {
    chat(messages: ChatMessage[], context?: string): Promise<string>;
}

/**
 * Provider for Anthropic (Claude)
 */
export class ClaudeProvider implements AIProvider {
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = 'claude-sonnet-5') {
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }

    async chat(messages: ChatMessage[], context?: string): Promise<string> {
        // System message with organization context
        const systemMessage = context 
            ? `Eres el Gestor inteligente del Banco de Ideas para esta organización. 
               Tu objetivo es ayudar al usuario a madurar, conectar y explorar sus ideas basándote en el conocimiento previo de la empresa.
               
               CONTEXTO DE LA ORGANIZACIÓN (Knowledge Base):
               ${context}
               
               RESPONDE siempre en el mismo idioma que el usuario.`
            : "Eres el Gestor inteligente del Banco de Ideas. Ayuda al usuario a explorar sus ideas.";

        const anthropicMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }));

        const response = await this.client.messages.create({
            model: this.model,
            system: systemMessage,
            max_tokens: 2000,
            messages: anthropicMessages,
        });

        // @ts-ignore - content[0] is usually text
        const textBlock = response.content.find(block => block.type === 'text');
        return textBlock && 'text' in textBlock ? textBlock.text : '';
    }
}

/**
 * Provider for OpenAI-compatible APIs (OpenAI, DeepSeek)
 */
export class OpenAICompatibleProvider implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string, baseURL?: string) {
        this.client = new OpenAI({ apiKey, baseURL });
        this.model = model;
    }

    async chat(messages: ChatMessage[], context?: string): Promise<string> {
        const systemMessage = context 
            ? `Eres el Gestor inteligente del Banco de Ideas para esta organización. 
               Tu objetivo es ayudar al usuario a madurar, conectar y explorar sus ideas basándote en el conocimiento previo de la empresa.
               
               CONTEXTO DE LA ORGANIZACIÓN (Knowledge Base):
               ${context}
               
               RESPONDE siempre en el mismo idioma que el usuario.`
            : "Eres el Gestor inteligente del Banco de Ideas. Ayuda al usuario a explorar sus ideas.";

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemMessage },
                ...messages as any[]
            ],
        });

        return response.choices[0]?.message?.content || '';
    }
}

/**
 * Factory to get the appropriate AI provider
 */
export function getAIProvider(org: { aiProvider: string, aiModel: string }): AIProvider {
    switch (org.aiProvider) {
        case 'claude':
            if (!process.env.ANTHROPIC_API_KEY) {
                throw new Error('ANTHROPIC_API_KEY no configurada');
            }
            return new ClaudeProvider(process.env.ANTHROPIC_API_KEY, org.aiModel);
        
        case 'deepseek':
            if (!process.env.DEEPSEEK_API_KEY) {
                throw new Error('DEEPSEEK_API_KEY no configurada');
            }
            return new OpenAICompatibleProvider(
                process.env.DEEPSEEK_API_KEY, 
                org.aiModel || 'deepseek-v4-pro',
                'https://api.deepseek.com'
            );

        case 'openai':
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY no configurada');
            }
            return new OpenAICompatibleProvider(
                process.env.OPENAI_API_KEY, 
                org.aiModel || 'gpt-5.6-luna'
            );
            
        default:
            throw new Error(`Provider ${org.aiProvider} no soportado`);
    }
}
