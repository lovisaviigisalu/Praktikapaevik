const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

app.use(express.static(__dirname));

// MySQL configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ,
    database:
});
const saltRounds = 10;
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// Middleware to check if the user is authenticated

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.id) {
        return next();
    } else {
        return res.sendStatus(401); // Unauthorized
    }
};


// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Query the database for user authentication
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            res.redirect('/failure');
        } else {
            if (results.length > 0) {
                const user = results[0];

                // Compare the provided password with the hashed password
                bcrypt.compare(password, user.password, (bcryptErr, bcryptResult) => {
                    if (bcryptErr) {
                        console.error('Error comparing passwords:', bcryptErr);
                        res.redirect('/failure');
                    } else {
                        if (bcryptResult) {
                            req.session.user = { id: user.id, username: user.username };
                            res.redirect('/frontpage.html'); // Redirect to frontpage.html
                        } else {
                            res.redirect('/failure');
                        }
                    }
                });
            } else {
                res.redirect('/failure');
            }
        }
    });
});


app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Hash the password before storing it in the database
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.redirect('/failure');
        } else {
            // Insert new user into the database with the hashed password
            const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
            db.query(sql, [username, hashedPassword], (dbErr) => {
                if (dbErr) {
                    console.error('Error inserting into database:', dbErr);
                    res.redirect('/failure');
                } else {
                    res.redirect('/login.html');
                }
            });
        }
    });
});

app.post('/addTask', isAuthenticated, (req, res) => {
    const { date, description, hours } = req.body;
    const userId = req.session.user.id;

    const sql = 'INSERT INTO tasks (user_id, date, description, hours) VALUES (?, ?, ?, ?)';
    db.query(sql, [userId, date, description, hours], (dbErr, result) => {
        if (dbErr) {
            console.error('Error inserting into database:', dbErr);
            res.sendStatus(500); // Internal Server Error
        } else {
            console.log('Inserted successfully:', result);
            res.redirect('/frontpage.html'); // Redirect to frontpage.html
        }
    });
});



app.get('/tasks', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const sql = 'SELECT * FROM tasks WHERE user_id = ?';
    db.query(sql, [userId], (dbErr, result) => {
        if (dbErr) {
            console.error('Error fetching tasks from database:', dbErr);
            res.sendStatus(500); // Internal Server Error
        } else {
            res.json(result); // Send the fetched tasks as JSON response
        }
    });
});

// Add this route to your Express application
app.delete('/tasks/:id', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const taskId = req.params.id;

    // Perform deletion in the database, ensuring that the task belongs to the logged-in user
    const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    db.query(sql, [taskId, userId], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            res.sendStatus(500); // Internal server error
        } else {
            console.log('Task deleted successfully');
            res.sendStatus(200); // OK
        }
    });
});




app.get('/success', isAuthenticated, (req, res) => {
    res.send('Snpm install expressuccessfully authenticated');
});

app.get('/failure', (req, res) => {
    res.send('Authentication failed');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



