require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const workSessionRoutes = require('./routes/workSessionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const managerRoutes = require('./routes/managerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const agentRoutes = require('./routes/agentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/work-session', workSessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: "EmployeeTrack backend is running"
  });
});

const errorHandler = require('./middleware/errorMiddleware');

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startNotificationCleanupJob = require('./utils/notificationCleanup');

const startServer = async () => {
  if (process.env.MONGODB_URI) {
     await connectDB();
     startNotificationCleanupJob();
  } else {
     console.warn("MONGODB_URI not found in .env, skipping DB connection for now");
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
