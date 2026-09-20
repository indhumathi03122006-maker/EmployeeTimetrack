const mongoose = require('mongoose');

const workSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'idle', 'ended'],
      default: 'active',
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },
    activeDuration: {
      type: Number,
      default: 0,
    },
    idleDuration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly find an active session for a specific user
workSessionSchema.index({ user: 1, status: 1 });
workSessionSchema.index({ attendance: 1 });

const WorkSession = mongoose.model('WorkSession', workSessionSchema);

module.exports = WorkSession;
