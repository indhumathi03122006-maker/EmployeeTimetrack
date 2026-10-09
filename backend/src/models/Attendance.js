const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'present',
    },
    workDuration: {
      type: Number,
      default: 0,
    },
    isOnBreak: {
      type: Boolean,
      default: false,
    },
    breakStart: {
      type: Date,
      default: null,
    },
    breakEnd: {
      type: Date,
      default: null,
    },
    breakDuration: {
      type: Number,
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isEarlyCheckout: {
      type: Boolean,
      default: false,
    },
    isWorkingDay: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for the same employee on the same day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
