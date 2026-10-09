const mongoose = require('mongoose');

const appActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appName: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    date: {
      type: String, // 'YYYY-MM-DD' format
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

appActivitySchema.index({ user: 1, date: 1 });
appActivitySchema.index({ user: 1, startTime: 1 });

const AppActivity = mongoose.model('AppActivity', appActivitySchema);

module.exports = AppActivity;
