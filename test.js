const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'schooluser',
    password: 'school123',
    database: 'school_management',
    ssl: { rejectUnauthorized: false }
});

db.connect(err => {
    if (err) return console.error('❌ DB Error:', err);
    console.log('✅ DB Connected!');
});