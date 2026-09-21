const fillAbsentRecords = (targetUsers, records, type, startDate, endDate) => {
  if (!startDate || !endDate) return records;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Group records by date (YYYY-MM-DD) and user ID
  const recordMap = {};
  records.forEach(record => {
    const recordDate = record.date || record.startTime;
    if (recordDate) {
      const dateStr = new Date(recordDate).toISOString().split('T')[0];
      const userId = record.user._id ? record.user._id.toString() : record.user.toString();
      const key = `${dateStr}_${userId}`;
      if (!recordMap[key]) {
         recordMap[key] = [];
      }
      recordMap[key].push(record);
    }
  });

  const mergedRecords = [];
  
  // Iterate through each date in the range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    // For each user, check if they have a record on this date
    targetUsers.forEach(user => {
      const userId = user._id.toString();
      const key = `${dateStr}_${userId}`;
      const userRecords = recordMap[key];
      
      if (userRecords && userRecords.length > 0) {
        // User has records, push them all
        mergedRecords.push(...userRecords);
      } else {
        // User is absent on this date, synthesize a record
        const dateAtMidnight = new Date(d);
        dateAtMidnight.setHours(0, 0, 0, 0);

        if (type === 'attendance') {
          mergedRecords.push({
            _id: `absent-${userId}-${dateStr}`,
            user: user,
            date: dateAtMidnight,
            checkIn: null,
            checkOut: null,
            workDuration: 0,
            status: 'absent'
          });
        } else if (type === 'workSession') {
          mergedRecords.push({
            _id: `absent-ws-${userId}-${dateStr}`,
            user: user,
            startTime: dateAtMidnight,
            endTime: null,
            activeDuration: 0,
            idleDuration: 0,
            status: 'absent'
          });
        } else if (type === 'report') {
          mergedRecords.push({
            _id: `absent-rep-${userId}-${dateStr}`,
            user: user,
            date: dateAtMidnight,
            checkIn: null,
            checkOut: null,
            status: 'absent',
            workDuration: 0,
            activeTime: 0,
            idleTime: 0
          });
        }
      }
    });
  }

  // Sort by date/startTime descending (newest first)
  mergedRecords.sort((a, b) => {
    const dateA = new Date(a.date || a.startTime);
    const dateB = new Date(b.date || b.startTime);
    return dateB - dateA;
  });

  return mergedRecords;
};

module.exports = fillAbsentRecords;
