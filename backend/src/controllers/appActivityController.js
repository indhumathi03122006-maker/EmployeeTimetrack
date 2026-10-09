const AppActivity = require('../models/AppActivity');
const User = require('../models/User');

// Helper to format Date as YYYY-MM-DD
const formatDateString = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format total duration in seconds to clean human readable string (e.g., 2h 03m, 2h 15m, 1h, 45m, 3m, 0m)
const formatDurationString = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  
  const totalMins = Math.floor(totalSeconds / 60);
  if (totalMins === 0) {
    return '0m';
  }
  
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  
  if (hrs > 0) {
    if (mins === 0) {
      return `${hrs}h`;
    }
    const minsPadded = String(mins).padStart(2, '0');
    return `${hrs}h ${minsPadded}m`;
  }
  
  return `${mins}m`;
};

// Helper to normalize and clean raw application names (e.g., "19668\r\nmsedge" -> "Microsoft Edge")
const cleanAppName = (rawName) => {
  if (!rawName) return 'Unknown';
  
  // Strip newlines/carriage returns and trim
  let cleaned = String(rawName).replace(/[\r\n]+/g, ' ').trim();
  // Strip leading process IDs or digits (e.g., "19668 msedge" -> "msedge")
  cleaned = cleaned.replace(/^\d+[\s\-_]*/, '').trim();
  
  if (!cleaned) return 'Unknown';

  const map = {
    'code': 'VS Code',
    'chrome': 'Google Chrome',
    'google chrome': 'Google Chrome',
    'msedge': 'Microsoft Edge',
    'microsoft edge': 'Microsoft Edge',
    'edge': 'Microsoft Edge',
    'brave': 'Brave',
    'firefox': 'Firefox',
    'devenv': 'Visual Studio',
    'visual studio': 'Visual Studio',
    'teams': 'Teams',
    'ms-teams': 'Teams',
    'slack': 'Slack',
    'excel': 'Excel',
    'winword': 'Word',
    'powerpnt': 'PowerPoint',
    'outlook': 'Outlook',
    'notepad': 'Notepad',
    'notepad++': 'Notepad++',
    'cmd': 'Command Prompt',
    'powershell': 'PowerShell',
    'windowsterminal': 'Windows Terminal',
    'explorer': 'File Explorer',
    'file explorer': 'File Explorer',
    'spotify': 'Spotify',
    'freefire': 'Free Fire',
    'antigravity ide': 'Antigravity IDE',
    'electron': 'EmployeeTrack Agent'
  };

  const lower = cleaned.toLowerCase();
  if (map[lower]) return map[lower];
  
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

// Productivity classification helper
const classifyApplication = (appName) => {
  if (!appName) return 'Neutral';
  const name = appName.toLowerCase();

  const productiveKeywords = [
    'vs code', 'visual studio', 'teams', 'slack', 'word', 'excel', 'powerpoint',
    'outlook', 'notepad', 'command prompt', 'powershell', 'terminal', 'github',
    'git', 'postman', 'figma', 'sublime', 'eclipse', 'intellij', 'pycharm',
    'android studio', 'docker', 'employeetrack'
  ];

  const nonProductiveKeywords = [
    'free fire', 'freefire', 'steam', 'spotify', 'netflix', 'youtube', 'games',
    'instagram', 'facebook', 'tiktok', 'twitter', 'roblox', 'minecraft', 'pubg'
  ];

  if (productiveKeywords.some(k => name.includes(k))) {
    return 'Productive';
  }
  if (nonProductiveKeywords.some(k => name.includes(k))) {
    return 'Non-productive';
  }
  return 'Neutral';
};

// GET /api/app-activity?date=YYYY-MM-DD&employeeId=...
const getAppActivities = async (req, res) => {
  try {
    const targetDate = req.query.date ? req.query.date : formatDateString(new Date());
    const employeeId = req.query.employeeId;

    let query = { date: targetDate };

    if (req.user.role === 'admin') {
      // Admin sees ALL employees across organization
      if (employeeId) {
        query.user = employeeId;
      }
    } else if (req.user.role === 'manager') {
      // Manager sees ONLY employees assigned to this manager (User.manager == req.user._id)
      const teamMembers = await User.find({ manager: req.user._id }).select('_id');
      const teamMemberIds = teamMembers.map(m => m._id);

      if (teamMemberIds.length === 0) {
        return res.status(200).json({
          success: true,
          date: targetDate,
          activities: [],
        });
      }

      if (employeeId) {
        const isAssigned = teamMemberIds.some(id => id.toString() === employeeId.toString());
        if (!isAssigned) {
          return res.status(403).json({ success: false, message: 'Access denied to unassigned employee data' });
        }
        query.user = employeeId;
      } else {
        query.user = { $in: teamMemberIds };
      }
    } else {
      // Employee role: strictly their own data
      query.user = req.user._id;
    }

    // Fetch raw records for target date
    const rawActivities = await AppActivity.find(query)
      .populate('user', 'name email department role')
      .sort({ startTime: 1 });

    // Aggregate records by (user._id + normalized appName)
    const aggregatedMap = new Map();

    for (const item of rawActivities) {
      if (!item.user) continue;

      const userIdStr = item.user._id.toString();
      const appNameClean = cleanAppName(item.appName);
      const groupKey = `${userIdStr}_${appNameClean}`;

      if (!aggregatedMap.has(groupKey)) {
        aggregatedMap.set(groupKey, {
          _id: groupKey,
          user: {
            _id: item.user._id,
            name: item.user.name,
            email: item.user.email,
            department: item.user.department || 'General',
            role: item.user.role,
          },
          appName: appNameClean,
          totalDuration: 0,
          classification: classifyApplication(appNameClean),
          sessions: [],
        });
      }

      const entry = aggregatedMap.get(groupKey);

      // Calculate actual duration in seconds from timestamps
      let sessionDuration = 0;
      if (item.startTime && item.endTime) {
        sessionDuration = Math.max(0, Math.round((new Date(item.endTime) - new Date(item.startTime)) / 1000));
      } else if (item.startTime) {
        // If activity is currently running (no endTime), calculate duration up to current time
        sessionDuration = Math.max(0, Math.round((new Date() - new Date(item.startTime)) / 1000));
      }

      if (!sessionDuration && item.duration) {
        sessionDuration = item.duration;
      }

      entry.totalDuration += sessionDuration;
      entry.sessions.push({
        _id: item._id,
        startTime: item.startTime,
        endTime: item.endTime,
        duration: sessionDuration,
      });
    }

    // Format aggregated response array with clean duration strings
    const activities = Array.from(aggregatedMap.values()).map(item => ({
      ...item,
      formattedDuration: formatDurationString(item.totalDuration),
    }));

    // Sort by employee name then totalDuration descending
    activities.sort((a, b) => {
      if (a.user.name.localeCompare(b.user.name) !== 0) {
        return a.user.name.localeCompare(b.user.name);
      }
      return b.totalDuration - a.totalDuration;
    });

    return res.status(200).json({
      success: true,
      date: targetDate,
      activities,
    });
  } catch (error) {
    console.error('Error fetching app activities:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching app activity',
    });
  }
};

// POST /api/app-activity
const logAppActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const bodyData = Array.isArray(req.body) ? req.body : [req.body];

    if (!bodyData || bodyData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No activity data provided',
      });
    }

    const createdRecords = [];

    for (const item of bodyData) {
      const { appName, startTime, endTime, duration } = item;

      if (!appName || !startTime) {
        continue;
      }

      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : new Date();
      const computedDuration = duration != null && duration > 0 
        ? duration 
        : Math.max(0, Math.round((end - start) / 1000));
        
      const dateStr = formatDateString(start);
      const cleanedApp = cleanAppName(appName);

      const record = await AppActivity.create({
        user: userId,
        appName: cleanedApp,
        startTime: start,
        endTime: end,
        duration: computedDuration,
        date: dateStr,
      });

      createdRecords.push(record);
    }

    return res.status(201).json({
      success: true,
      count: createdRecords.length,
      activities: createdRecords,
    });
  } catch (error) {
    console.error('Error logging app activity:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while logging app activity',
    });
  }
};

module.exports = {
  getAppActivities,
  logAppActivity,
};
