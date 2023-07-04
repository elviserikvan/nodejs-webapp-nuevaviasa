const bcrypt = require('bcrypt');
const passport = require('passport');
const router = require("express").Router();
const db = require('../models/Database.js');


function checkAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {return res.redirect('/member/dashboard')}

	return next();
}


/*
router.use((req, res, next) => {
	if (req.isAuthenticated()) {return res.redirect('/member/dashboard')}

	return next();
})
*/


router.get("/", checkAuthenticated, (req, res) => {
	res.render("pages/index", {user: req.user})
})

router.get("/login", checkAuthenticated, (req, res) => {
	res.render("pages/login", {user: req.user})
})

router.post("/login", passport.authenticate('local', {
	successRedirect: '/member/dashboard',
	failureRedirect: '/login',
	failureFlash: 'Email o contraseña incorrectas'
}))

router.get('/restaurar', (req, res) => {
	res.render("pages/restaurar", {user: req.user})
});

router.post('/restaurar', (req, res) => {



	let sql = `SELECT * FROM users WHERE email = "${req.body.email}"`;

	db.all(sql, [], (err, rows) => {
		if(err) console.error(err);

		//console.log(rows);
		res.render("pages/cambiar_clave", {user: req.user,  email: rows})
	})

});


router.post('/cambiar_clave', (req, res) => {


	let salt = bcrypt.genSaltSync(10);
	let hash = bcrypt.hashSync(req.body.password, salt);

	let sql = `UPDATE users SET password="${hash}" WHERE id=${req.body.user_id}`;
	//console.log(sql);
	
	 db.all(sql, [], (err, rows) => {
		if(err) console.error(err);

		 res.redirect('/login');

	});

});




/*
router.get("/create_admin", (req, res) => {
	res.send('Creating user');

	let date = new Date().toISOString().split('T')[0]

	let salt = bcrypt.genSaltSync(10);
	let hash = bcrypt.hashSync('admin', salt);

	let sql = 'INSERT INTO users (first_name, last_name, username, email, password, role, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?)'

	let params = ['Admin', 'Admin', 'admin', 'admin@admin.com', hash, 'admin', date]

	console.log(db)

	db.all(sql, params, (err, rows) => {
		if (err) throw err
	})
	
});
*/

module.exports = router
