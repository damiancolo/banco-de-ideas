import mongoose from 'mongoose';

export interface IVisit extends mongoose.Document {
    timestamp: Date;
    path: string;
    visitorType: 'human' | 'bot';
    botName: string | null;
    browser: string | null;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    country: string | null;
    referrer: string | null;
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
        enum: ['human', 'bot'],
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
    }
});

// Compound indexes for dashboard queries
VisitSchema.index({ timestamp: -1, visitorType: 1 });
VisitSchema.index({ timestamp: -1, path: 1 });

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
