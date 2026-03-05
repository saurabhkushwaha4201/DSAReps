const mongoose = require('mongoose');

const revisionLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
            required: true,
            index: true,
        },
        reviewedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        rating: {
            type: String,
            enum: ['AGAIN', 'HARD', 'GOOD', 'EASY', 'FORGOT', 'SLOW', 'CLEAN'],
            required: true,
        },
        timeTaken: {
            type: Number, // in seconds
            default: 0,
        },
        device: {
            type: String,
            enum: ['Web', 'Extension'],
            default: 'Web',
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt automatically
    }
);

// Indexes for analytics
revisionLogSchema.index({ userId: 1, reviewedAt: 1 }); // For activity over time/streaks

module.exports = mongoose.model('RevisionLog', revisionLogSchema);
