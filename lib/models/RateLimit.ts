import mongoose from 'mongoose';

export interface IRateLimit extends mongoose.Document {
    ip: string;
    action: string;
    count: number;
    expiresAt: Date;
}

const RateLimitSchema = new mongoose.Schema<IRateLimit>({
    ip: {
        type: String,
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 1
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '1m' } // TTL index: auto-delete after 1 minute
    }
});

// Composite index for fast lookups
RateLimitSchema.index({ ip: 1, action: 1 });

export default mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);
