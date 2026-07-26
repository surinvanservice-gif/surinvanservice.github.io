const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

// Database Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g., postgres://user:pass@host:5432/db
});

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

/**
 * 1. API: Check Availability
 * Fetches booked dates for a specific month
 */
app.get('/api/availability', async (req, res) => {
  const { month, year } = req.query;
  try {
    const result = await pool.query(
      'SELECT booking_date FROM bookings WHERE EXTRACT(MONTH FROM booking_date) = $1 AND EXTRACT(YEAR FROM booking_date) = $2 AND status != $3',
      [month, year, 'cancelled']
    );
    // Return array of ISO dates that are fully booked
    const bookedDates = result.rows.map(row => row.booking_date.toISOString().split('T')[0]);
    res.json({ bookedDates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. API: Submit Booking
 */
app.post('/api/bookings', async (req, res) => {
  const { 
    userId, jobType, date, time, 
    pickup, dropoff, name, phone, social 
  } = req.body;

  try {
    // 1. Save to DB
    const query = `
      INSERT INTO bookings (line_user_id, job_type, booking_date, pickup_time, pickup_location, dropoff_location, customer_name, phone_number, social_contact)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;
    `;
    const values = [userId, jobType, date, time, pickup, dropoff, name, phone, social];
    await pool.query(query, values);

    // 2. Send LINE Flex Message Confirmation
    await sendFlexConfirmation(userId, { jobType, date, time, pickup, dropoff, name });

    res.json({ success: true, message: 'Booking confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

/**
 * Helper: Send LINE Flex Message
 */
async function sendFlexConfirmation(userId, data) {
  const flexMessage = {
    to: userId,
    messages: [{
      type: "flex",
      altText: "ยืนยันการจองรถ",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [{ type: "text", text: "ยืนยันการจองรถสำเร็จ", weight: "bold", color: "#06C755" }]
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: `ประเภท: ${data.jobType}`, size: "sm" },
            { type: "text", text: `วันที่: ${data.date}`, size: "sm" },
            { type: "text", text: `สถานที่รับ: ${data.pickup}`, size: "sm" }
          ]
        }
      }
    }]
  };

  await axios.post('https://api.line.me/v2/bot/message/push', flexMessage, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
