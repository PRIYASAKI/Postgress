const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');

router.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'PersonalInfo',
  password: '02012005',
  port: 5432,
});

pool.connect((err) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    pool.query(`CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        firstName VARCHAR(100),
        lastName VARCHAR(100),
        email VARCHAR(100),
        gender VARCHAR(10),
        dateOfBirth DATE,
        phoneNumber VARCHAR(10)
      )`, (err, result) => {
        if (err) {
            return console.error("Error creating table 'profiles':", err);
        }
        console.log("Table 'profiles' created successfully");
    });
});

router.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

router.get('/add', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'addinfo.html'));
});

router.get('/update', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'updateinfo.html'));
});

router.get('/delete', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'deleteinfo.html'));
});

router.get('/view', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'viewinfo.html'));
});

router.post('/addinfo', async function(req, res) {
  try {
    const { fn, ln, email, gender, dob, phone } = req.body;
    const newProfile = [fn, ln, email, gender, dob, phone];

    const query = `
      INSERT INTO profiles (firstName, lastName, email, gender, dateOfBirth, phoneNumber)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, newProfile);
    res.status(201).send('Profile added successfully!');
  } catch (error) {
    console.error('Error adding profile:', error);
    res.status(500).send('Error adding profile.');
  }
});

router.post('/updateinfo', async function(req, res) {
    try {
      const { fn, ln, email, gender, dob, phone } = req.body;
      const updateProfile = [ln, email, gender, dob, phone, fn];
  
      const checkQuery = 'SELECT * FROM profiles WHERE firstName = $1';
      const checkResult = await pool.query(checkQuery, [fn]);
  
      if (checkResult.rows.length > 0) {
        const updateQuery = `
          UPDATE profiles
          SET lastName = $1, email = $2, gender = $3, dateOfBirth = $4, phoneNumber = $5
          WHERE firstName = $6
        `;
  
        await pool.query(updateQuery, updateProfile);
        res.status(200).send('Profile updated successfully!');
      } else {
       
        const insertProfile = [fn, ln, email, gender, dob, phone];
        const insertQuery = `
          INSERT INTO profiles (firstName, lastName, email, gender, dateOfBirth, phoneNumber)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
  
        await pool.query(insertQuery, insertProfile);
        res.status(201).send('Profile not found, so a new one was created!');
      }
    } catch (error) {
      console.error('Error updating or adding profile:', error);
      res.status(500).send('Error updating or adding profile.');
    }
  });
  
router.get('/viewinfo', async function(req, res) {
  try {
    const { firstname } = req.query;
    let profiles;

    if (firstname) {
      profiles = await pool.query('SELECT * FROM profiles WHERE firstName = $1', [firstname]);
    } else {
      profiles = await pool.query('SELECT * FROM profiles ORDER BY firstName ASC');
    }

    if (profiles.rows.length > 0) {
      let html = "<html><head><style>.profile-container { max-width: 400px; margin: 20px auto; padding: 20px; background-color: #addfff; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }</style></head><body><h1><center>Profile Information</center></h1>";
      profiles.rows.forEach(profile => {
        const formattedDOB = new Date(profile.dateofbirth).toLocaleDateString('en-GB');
        html += `<div class="profile-container"><ul>`;
        html += `<li><strong>Name:</strong> ${profile.firstname} ${profile.lastname}</li>`;
        html += `<li><strong>Email:</strong> ${profile.email}</li>`;
        html += `<li><strong>Gender:</strong> ${profile.gender}</li>`;
        html += `<li><strong>Date of Birth:</strong> ${formattedDOB}</li>`;
        html += `<li><strong>Phone Number:</strong> ${profile.phonenumber}</li>`;
        html += `</ul></div>`;
      });
      html += '</body></html>';
      res.status(200).send(html);
    } else {
      res.status(404).send('No profiles found.');
    }
  } catch (error) {
    console.error('Error retrieving profile(s):', error);
    res.status(500).send('Error retrieving profile(s).');
  }
});

router.get('/deleteinfo', async function(req, res) {
  try {
    const { firstname } = req.query;

    const result = await pool.query('DELETE FROM profiles WHERE firstName = $1', [firstname]);

    if (result.rowCount > 0) {
      res.status(200).send('Profile deleted successfully!');
    } else {
      res.status(404).send('Profile not found.');
    }
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).send('Error deleting profile.');
  }
});

module.exports = router;
