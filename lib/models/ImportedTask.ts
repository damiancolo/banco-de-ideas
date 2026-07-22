import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Registro de tasks de Google ya procesadas por el importador.
 * Garantiza idempotencia: re-ejecutar el importador no vuelve a procesar
 * ni duplicar una task ya vista (importada o excluida).
 */
export interface IImportedTask extends Document {
    userId: string;
    taskId: string;
    listId?: string;
    outcome: 'imported' | 'excluded';
    reason?: string;                                   // para 'excluded': 'due' | 'single-word' | 'ai-descartada: ...'
    ideaId?: mongoose.Types.ObjectId;                  // para 'imported'
    processedAt: Date;
}

const ImportedTaskSchema = new Schema<IImportedTask>(
    {
        userId: { type: String, required: true },
        taskId: { type: String, required: true },
        listId: { type: String },
        outcome: { type: String, enum: ['imported', 'excluded'], required: true },
        reason: { type: String },
        ideaId: { type: Schema.Types.ObjectId, ref: 'Idea' },
        processedAt: { type: Date, default: Date.now },
    },
    { collection: 'imported_tasks' }
);

// Idempotencia: una task por usuario se procesa una sola vez
ImportedTaskSchema.index({ userId: 1, taskId: 1 }, { unique: true });

const ImportedTask: Model<IImportedTask> =
    mongoose.models.ImportedTask || mongoose.model<IImportedTask>('ImportedTask', ImportedTaskSchema);

export default ImportedTask;
