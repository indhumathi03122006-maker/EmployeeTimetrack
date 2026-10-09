const mongoose = require('mongoose');

const extraBreakSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  }
});

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String,
    required: true // Format: HH:mm
  },
  endTime: {
    type: String,
    required: true // Format: HH:mm
  },
  workingDays: {
    type: [String],
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  extraBreaks: [extraBreakSchema]
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
