import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMembership extends Document {
    userId: string;           // String (NextAuth JWT id), not ObjectId
    organizationId: mongoose.Types.ObjectId;
    role: 'admin' | 'participant';
    status: 'active' | 'ended';
    createdAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ['admin', 'participant'],
            default: 'participant',
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'ended'],
            default: 'active',
            required: true,
            index: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: 'memberships',
    }
);

// Índice compuesto para consultas "membresías de un usuario en una org"
MembershipSchema.index({ userId: 1, organizationId: 1 });

// Índice para listar todas las membresías activas de un usuario (usado en frontend)
MembershipSchema.index({ userId: 1, status: 1 });

const Membership: Model<IMembership> =
    mongoose.models.Membership ||
    mongoose.model<IMembership>('Membership', MembershipSchema);

export default Membership;
