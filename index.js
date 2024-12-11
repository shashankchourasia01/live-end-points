const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'school_db'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});




// Add school 
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validate input
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Insert into database
    const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }
        res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
    });
});







//List School
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Validate input
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Fetch and sort schools by distance
    const sql = 'SELECT id, name, address, latitude, longitude FROM schools';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err });
        }

        // Calculate distances
        const schoolsWithDistance = results.map(school => {
            const distance = Math.sqrt(
                Math.pow(userLat - school.latitude, 2) + Math.pow(userLon - school.longitude, 2)
            );
            return { ...school, distance };
        });

        // Sort by distance
        schoolsWithDistance.sort((a, b) => a.distance - b.distance);

        res.status(200).json(schoolsWithDistance);
    });
});



//List School
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Validation
    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const query = `SELECT *, 
                   ( 6371 * acos( cos( radians(?) ) * cos( radians(latitude) ) 
                   * cos( radians(longitude) - radians(?) ) + sin( radians(?) ) 
                   * sin( radians(latitude) ) ) ) AS distance 
                   FROM schools
                   ORDER BY distance ASC`;

    db.query(query, [latitude, longitude, latitude], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching schools.', error: err });
        }
        res.status(200).json({ schools: result });
    });
});

