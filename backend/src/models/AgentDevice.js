const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify an incoming plain text agent token against the stored hash
agentDeviceSchema.methods.verifyToken = async function (plainToken) {
  return await bcrypt.compare(plainToken, this.tokenHash);
};

module.exports = mongoose.model('AgentDevice', agentDeviceSchema);
