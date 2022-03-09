//const passport = require('passport');
const bcrypt = require('bcrypt');
const localStrategy = require('passport-local');
const db = require('./models/Database.js');


module.exports = (passport) => {
	passport.use(new localStrategy({usernameField: 'email'},

	(email, password, done) => {


		// Search for user in database
		let sql = 'SELECT * FROM users WHERE email = ?';
		let params = [email];

		db.get(sql, params, (err, row) => {
			if (err) {return done(err, null);}
			if (!row) {return done(false, null, {message: 'Incorrect username or password'})}

			let correct_password = bcrypt.compareSync(password, row.password) // Compare passwords
			if (!correct_password) { return done(false, null, {message: 'Incorrect username or password'}) }


			done(false, row);
		});
	}));

	passport.serializeUser((user, done) => {
		return done(null, user.id);
	})



	passport.deserializeUser((id, done) => {
		let sql = 'SELECT * FROM users WHERE id = ?';
		let params = [id];

		db.get(sql, params, (err, row) => {
			if (err) {return done(err, null);}
			done(false, row);
		})
	})
}
