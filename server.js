const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(express.json());

app.get('/', (req, res) => {
    res.send("Server is working ✅");
});
process.on('uncaughtException', err => {
    console.error('💥 CRASH ERROR:', err);
});

process.on('unhandledRejection', err => {
    console.error('💥 PROMISE ERROR:', err);
});

// ✅ MySQL Connection
// const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'GHJusbywUx3wgJs.root',
  password: '8ZB4alGyFT9dyLGy', // <-- put your real password  
//   sZU5Pc1XAsPQnswT => password
  database: 'test',
  ssl: {
    rejectUnauthorized: true
  }
});

db.connect(err => {
  if (err) {
    console.error('❌ DB Error:', err);
    return;
  }
  console.log('✅ DB Connected Successfully!');
});
// 📍 Distance function (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// 🟢 1. ADD SCHOOL API
app.post('/addSchool', (req, res) => {
    console.log("Body : ",req.body);
    const { name, address, latitude, longitude } = req.body;

    // ✅ Validation
    if (!name || !address || latitude == null || longitude == null) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: 'Latitude and Longitude must be numbers' });
    }

    const sql = "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";

    db.query(sql, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.json({ message: 'School added successfully', id: result.insertId });
    });
});

// 🔵 2. LIST SCHOOLS API (sorted by distance)
app.get('/listSchools', (req, res) => {
    const userLat = parseFloat(req.query.latitude);
    const userLon = parseFloat(req.query.longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const sql = "SELECT * FROM schools";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }

        // Calculate distance
        const schoolsWithDistance = results.map(school => {
            const distance = getDistance(userLat, userLon, school.latitude, school.longitude);
            return { ...school, distance };
        });

        // Sort by distance
        schoolsWithDistance.sort((a, b) => a.distance - b.distance);

        res.json(schoolsWithDistance);
    });
});

// 🚀 Start server
app.listen(7000, () => {
    console.log('🚀 Server running on http://127.0.0.1:7000');
});