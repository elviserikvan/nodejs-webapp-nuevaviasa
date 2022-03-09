const flash = require('express-flash');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
//const mongoose = require('mongoose');
const unprotected_routes = require('./routes/unprotected');
const protected_routes = require('./routes/protected');
const PORT = 8080;

const app = express()

// Connect to database

/*
const db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READWRITE, err => {
	if (err) console.log('Error connecting to database');

	console.log("Connected to database");
});
*/

/*
mongoose.connect('mongodb://localhost:27017/proyecto3')
mongoose.connection.on('open', () => {
	console.log("Nojoda Carajo")
})
*/


// View engine
app.set('view engine', 'ejs');

// Static folder
app.use(express.static(`${__dirname}/public`))


// Sessions
app.use(flash());
app.use(session({
	secret: 'This is a secrect',
	resave: false,
	saveUninitialized: false
}))

app.use(express.urlencoded({extended: false}))

// Passport
app.use(passport.initialize());
app.use(passport.session());
require('./passport-config.js')(passport);



// Unprotected routes
app.use('/', unprotected_routes)
app.use('/member', protected_routes)


app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`)
})


//module.exports = db
