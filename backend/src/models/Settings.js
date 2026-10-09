const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  workStartTime: {
    type: String,
    default: "09:00"
  },
  workEndTime: {
    type: String,
    default: "17:00"
  },
  workingDays: {
    type: [String],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  enableBreakSchedule: {
    type: Boolean,
    default: false
  },
  breakSchedule: [{
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
