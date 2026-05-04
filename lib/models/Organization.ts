import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IKnowledgeBaseDoc {
    filename: string;
    content: string;
    embedding: number[];
    uploadedAt: Date;
}

export interface IOrganization extends Document {
    name: string;
    slug: string;
    logoUrl: string;
    aiProvider: 'deepseek' | 'claude' | 'openai';
    aiModel: string;
    knowledgeBase: IKnowledgeBaseDoc[];
    programStartDate: Date;
    programEndDate: Date;
    status: 'active' | 'ended' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

const KnowledgeBaseDocSchema = new Schema<IKnowledgeBaseDoc>(
    {
        filename: { type: String, required: true },
        content: { type: String, required: true },
        embedding: { type: [Number], default: [] },
        uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const OrganizationSchema = new Schema<IOrganization>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        logoUrl: {
            type: String,
            required: true,
        },
        aiProvider: {
            type: String,
            enum: ['deepseek', 'claude', 'openai'],
            default: 'claude',
            required: true,
        },
        aiModel: {
            type: String,
            required: true,
            default: 'claude-opus-4-6',
        },
        knowledgeBase: {
            type: [KnowledgeBaseDocSchema],
            default: [],
        },
        programStartDate: {
            type: Date,
            required: true,
        },
        programEndDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'ended', 'archived'],
            default: 'active',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: 'organizations',
    }
);

const Organization: Model<IOrganization> =
    mongoose.models.Organization ||
    mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
