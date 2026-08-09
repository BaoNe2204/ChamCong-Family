const cron = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Expo push API endpoint
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// Convert HH:mm to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const setupCronJobs = (pool) => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Running cron job to check attendance...');
      
      const now = new Date();
      // Adjust to UTC+7 (Vietnam time)
      const vnTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
      const currentMinutes = vnTime.getHours() * 60 + vnTime.getMinutes();
      const todayDate = vnTime.toISOString().split('T')[0];

      // Get all users, their push tokens, and their shift for today
      // Assuming user_shifts joins with shifts. If no specific shift, we can use default or just skip.
      const [users] = await pool.execute(`
        SELECT u.id, u.pushToken, s.startTime, s.endTime
        FROM users u
        LEFT JOIN user_shifts us ON u.id = us.userId
        LEFT JOIN shifts s ON us.shiftId = s.id
        WHERE u.pushToken IS NOT NULL
      `);

      for (let user of users) {
        if (!user.startTime || !user.endTime) continue; // User doesn't have a shift

        const shiftStartMins = timeToMinutes(user.startTime);
        const shiftEndMins = timeToMinutes(user.endTime);

        // Check Check-In reminder (15 mins after shift start)
        // If current time is between start+15 and start+20
        if (currentMinutes >= shiftStartMins + 15 && currentMinutes < shiftStartMins + 20) {
          // Check if they have checked in today
          const [att] = await pool.execute(
            'SELECT id FROM attendance WHERE userId = ? AND date = ?',
            [user.id, todayDate]
          );
          
          if (att.length === 0) {
            // Send Push Notification
            sendPushNotification(user.pushToken, "Chấm công ngay bạn ơi!", "Đã vào ca 15 phút rồi, bạn quên chấm công phải không?");
          }
        }

        // Check Check-Out reminder (15 mins after shift end)
        // If current time is between end+15 and end+20
        if (currentMinutes >= shiftEndMins + 15 && currentMinutes < shiftEndMins + 20) {
          // Check if they checked in but haven't checked out
          const [att] = await pool.execute(
            'SELECT id FROM attendance WHERE userId = ? AND date = ? AND checkOutTimeMillis IS NULL',
            [user.id, todayDate]
          );
          
          if (att.length > 0) {
            sendPushNotification(user.pushToken, "Hết giờ làm rồi!", "Bạn đã hết ca 15 phút, đừng quên chấm công ra về nhé!");
          }
        }
      }

    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });

  // Run daily at 2:00 AM to delete old photos (older than 60 days)
  cron.schedule('0 2 * * *', () => {
    try {
      console.log('Running cron job to clean up old photos...');
      const uploadsDir = path.join(__dirname, 'public/uploads');
      if (!fs.existsSync(uploadsDir)) return;

      const files = fs.readdirSync(uploadsDir);
      const now = Date.now();
      const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > sixtyDaysMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old photos.`);
      }
    } catch (error) {
      console.error('Error in photo cleanup cron job:', error);
    }
  });
};

const sendPushNotification = async (expoPushToken, title, body) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  try {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    console.log(`Push notification sent to ${expoPushToken}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = { setupCronJobs };
