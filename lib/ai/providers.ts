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
            // Era 2000. Los modelos actuales razonan por defecto y ese razonamiento
            // sale del mismo presupuesto, así que un tope bajo corta la respuesta a
            // media frase. Es un techo, no un consumo: se paga lo que se genera.
            max_tokens: 16000,
            system: systemMessage,
            messages: anthropicMessages,
        });

        // Un corte por tope devuelve texto — incompleto, pero texto — así que sin
        // esta comprobación pasa como si fuera la respuesta buena.
        if (response.stop_reason === 'max_tokens') {
            throw new Error(`${this.model} cortó la respuesta al llegar al tope de tokens`);
        }

        const textBlock = response.content.find(block => block.type === 'text');
        const texto = textBlock && 'text' in textBlock ? textBlock.text : '';
        // Una respuesta vacía no es una respuesta: si se devuelve '' el chat se
        // queda mudo sin que nadie se entere. Que falle de forma visible.
        if (!texto.trim()) {
            throw new Error(`${this.model} devolvió una respuesta vacía (stop_reason: ${response.stop_reason})`);
        }
        return texto;
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

        const texto = response.choices[0]?.message?.content || '';
        // Mismo motivo que en ClaudeProvider. Pasa de verdad: los modelos de
        // razonamiento consumen el presupuesto pensando y devuelven 200 con el
        // contenido vacío, sin error ninguno.
        if (!texto.trim()) {
            const motivo = response.choices[0]?.finish_reason ?? 'desconocido';
            throw new Error(`${this.model} devolvió una respuesta vacía (finish_reason: ${motivo})`);
        }
        return texto;
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
