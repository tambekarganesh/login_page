const express = require('express');
const mysql = require("mysql")
const path = require("path")
const dotenv = require('dotenv')
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

dotenv.config({ path: './.env'})

const app = express();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())

app.set('view engine', 'hbs')

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/welcome", (req, res) => {
    res.render("welcome")
})

// app.get("/list", (req, res) => {
//     res.render("list")
// })
// Edit user route
app.get('/edit/:name', (req, res) => {
    const userName = req.params.name;
    // Query to fetch user data from the database based on the user's name
    db.query('SELECT * FROM users WHERE name = ?', userName, (error, results) => {
        if (error) {
            console.error('Error fetching user data:', error);
            return res.status(500).send('Error fetching user data');
        }
        // If user data was found, render the edit form with the user data
        if (results.length > 0) {
            res.render('edit', { user: results[0] });
        } else {
            res.status(404).send('User not found');
        }
    });
});


// Update user route
app.post('/update/:name', (req, res) => {
    const oldUserName = req.params.name;
    const newName = req.body.name;
    const newEmail = req.body.email;
    
    // Query to update user data in the database based on the user's name
    db.query('UPDATE users SET name = ?, email = ? WHERE name = ?', [newName, newEmail, oldUserName], (error, result) => {
        if (error) {
            console.error('Error updating user:', error);
            return res.status(500).send('Error updating user');
        }
        res.redirect('/list'); // Redirect to the user list page or any other page
    });
});



app.get('/delete/:name', (req, res) => {
    const userName = req.params.name;
    // Query to delete user data from the database based on the user's name
    db.query('DELETE FROM users WHERE name = ?', userName, (error, result) => {
        if (error) {
            console.error('Error deleting user:', error);
            return res.status(500).send('Error deleting user');
        }
        res.redirect('/list'); // Redirect to the user list page or any other page
    });
});

app.get('/list', (req, res) => {
    // Query to fetch user data from the database
    db.query('SELECT name, email FROM users', (error, results) => {
        if (error) {
            console.error('Error fetching user data:', error);
            return res.status(500).send('Error fetching user data');
        }

        // Render the HTML page with user data
        res.render('list', { userData: results });
    });
});


// app.post("/list", (req,res) => {
//     db.query('SELECT name, email FROM users WHERE id = ?', result.insertId, (err, rows) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).send('Error retrieving user data');
//         }
    
//         // Check if user data was retrieved
//         if (rows.length > 0) {
//             // Render a response with the retrieved user data
//             return res.render('register', {
//                 message: 'User registered!',
//                 userData: rows[0] // Assuming there is only one user with the inserted ID
//             });
//         } else {
//             return res.status(404).send('User not found');
//         }
//     });
    
// })
app.get("/login", (req, res) => {
    res.render("login")
})

// Login route
app.post('/auth/login', (req, res) => {
    const { name, password } = req.body;

    // Query to fetch user data from the database based on the provided name
    db.query('SELECT * FROM users WHERE name = ?', [name], async (error, results) => {
        if (error) {
            console.error('Error fetching user data:', error);
            return res.status(500).send('Error fetching user data');
        }
        
        // If user with the provided name exists
        if (results.length > 0) {
            const user = results[0];

            
            if (password == user.password) {
                // Passwords match, user is authenticated
                // Redirect to a dashboard or profile page
                res.redirect('/list');
            } else {
                // Passwords do not match
                console.log('Invalid password:', password);
                console.log('Hashed password in database:', user.password);
                return res.render('login', {
                    message: 'Invalid credentials'
                });
            }
        } else {
            // User with the provided name does not exist
            return res.render('login', {
                message: 'User not found'
            });
        }
    });
});

app.post("/auth/register", (req, res) => {    
    const { name, email, password, password_confirm } = req.body

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
        if(error){
            console.log(error)
        }

        if( result.length > 0 ) {
            return res.render('register', {
                message: 'This email is already in use'
            })
        } else if(password !== password_confirm) {
            return res.render('register', {
                message: 'Password Didn\'t Match!'
            })
        }

        // let hashedPassword = await bcrypt.hash(password)

        console.log(password)
       
        db.query('INSERT INTO users SET?', {name: name, email: email, password: password}, (err, result) => {
            if(error) {
                console.log(error)
            } else {
                return res.render('register', {
                    message: 'User registered!'
                })
            }
        })        
    })
})

app.listen(5000, ()=> {
    console.log("server started on port 5000")
})
