import mongoose from 'mongoose';

export interface IVisit extends mongoose.Document {
    timestamp: Date;
    path: string;
    /** 'bot' es el valor viejo (antes de separar rastreadores de IA y otros bots): se lee como 'ai_crawler'. */
    visitorType: 'human' | 'ai_crawler' | 'other_bot' | 'agent' | 'bot';
    botName: string | null;
    browser: string | null;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    country: string | null;
    referrer: string | null;
    site: string | null;
    /** Hash diario sin cookies (rota cada día, no identifica a nadie). Registros viejos: null. */
    visitorId: string | null;
    /** User-agent recortado a 200 caracteres, para diagnosticar. Nunca se guarda la IP. */
    userAgent: string | null;
}

const VisitSchema = new mongoose.Schema<IVisit>({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        index: { expires: '90d' } // TTL: auto-delete after 90 days
    },
    path: {
        type: String,
        required: true
    },
    visitorType: {
        type: String,
        enum: ['human', 'ai_crawler', 'other_bot', 'agent', 'bot'],
        required: true,
        index: true
    },
    botName: {
        type: String,
        default: null
    },
    browser: {
        type: String,
        default: null
    },
    deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet'],
        default: 'desktop'
    },
    country: {
        type: String,
        default: null
    },
    referrer: {
        type: String,
        default: null
    },
    site: {
        type: String,
        default: null,
        index: true
    },
    visitorId: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null,
        maxlength: 200
    }
});

// Compound indexes for dashboard queries
VisitSchema.index({ timestamp: -1, visitorType: 1 });
VisitSchema.index({ timestamp: -1, path: 1 });

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
