const fs = require('fs');
const path = require('path');
const db = require('../models/Database.js');
const router = require("express").Router();



// Middleware to only allow authenticated users
router.use((req, res, next) => {
	if(req.isAuthenticated()) { return next() }

	return res.redirect('/login')
})

router.get("/", (req, res) => {
	res.send("No content")
})


router.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
})

router.get("/dashboard", (req, res) => {
	

	let sql_dolar = 'SELECT value FROM settings WHERE name="dolar_price"'
	db.get(sql_dolar, [], (err, dolar_price) => {
		if (err) console.error(err);


		// Get all products
		let sql = 'SELECT * FROM products';
		let params = [];
		
		db.all(sql, params, (err, rows) => {

			rows.forEach((row) => {
				row.precio = row.price * dolar_price.value;
			})


			res.render("pages/dashboard", {user: req.user, products: rows, dolar_price: dolar_price})
		})

	})
	


})


router.get("/delete/:id", (req, res) => {
	let sql = "DELETE FROM products WHERE id = ?";
	let params = [req.params.id];

	db.all(sql, params, (err, row) => {
		if (err) console.log(err);
		return res.redirect("/member/dashboard");
	})
})

router.get("/modificar/:id", (req, res) => {
	console.log(req.params.id)

	let sql = 'SELECT * FROM products WHERE id = ?';
	let params = [req.params.id];

	db.get(sql, params, (err, row) => {
		if (err) console.error(err);
		console.log(row);

		res.render("pages/modify_products", {user: req.user, product: row})
	})
 
})

router.post("/modificar/:id", (req, res) => {
	/*
	console.log(req.body)	
	res.redirect("/member/dashboard");
	*/

	let {name, price, amount, description } = req.body;
	price = parseInt(price);
	amount = parseInt(amount);

	// check price
	if(isNaN(price)) {
		console.log('Precio tiene que ser un numero');

		req.flash("error", 'Precio tiene que ser un numero');
		return res.redirect(`/member/modificar/${req.params.id}`);
	}

	// check amount
	if(isNaN(amount)) {
		console.log('Cantidad tiene que ser un numero');

		req.flash("error", 'Cantidad tiene que ser un numero');
		return res.redirect(`/member/modificar/${req.params.id}`);
	}

	// Guardar en la base de datos
	let sql = `UPDATE products SET name=?, price=?,  amount=?, description=? WHERE id = ?`;
	let params = [name, price, amount, description, req.params.id];

	db.all(sql, params, (err, row) => {
		if (err) {
			console.log(err);
			req.flash("error", 'Ocurrio un error, no se pudo guardar su producto');
			return res.redirect(`/member/modificar/${req.params.id}`);
		}	


		req.flash("success", 'Su producto fue guardado con excito');
		//return res.redirect(`/member/modificar/${req.params.id}`);
		return res.redirect(`/member/dashboard`);

	});


})

router.get("/add", (req, res) => {
	res.render("pages/añadir", {user: req.user})
})

router.get("/exportpdf", (req, res) => {
	res.render("pages/export_pdf", {user: req.user})
})

router.get("/new_pdf", (req, res) => {

	let file_path = path.join(__dirname, '../public/pdf/'); // Path to create the new file
	let date = new Date().toISOString().split('T')[0].replace(/-/g,'/'); // Taking the current date and format it as a string
	let filename = `export_${date}.pdf`; // Filename


	console.log(`${file_path}${filename}`);

	res.json({data: 'Nojoda Carajo'});
	
})


router.post('/add', (req, res) => {

	let {name, price, amount, description } = req.body;
	price = parseInt(price);
	amount = parseInt(amount);

	// check price
	if(isNaN(price)) {
		console.log('Precio tiene que ser un numero');

		req.flash("error", 'Precio tiene que ser un numero');
		return res.redirect("/member/add");
	}

	// check amount
	if(isNaN(amount)) {
		console.log('Cantidad tiene que ser un numero');

		req.flash("error", 'Cantidad tiene que ser un numero');
		return res.redirect("/member/add");
	}


	// Guardar en la base de datos
	let sql = 'INSERT INTO products (name, price, amount, description) VALUES (?, ?, ?, ?)';
	let params = [name, price, amount, description];

	db.all(sql, params, (err, row) => {
		if (err) {
			console.log(err);
			req.flash("error", 'Ocurrio un error, no se pudo guardar su producto');
			return res.redirect("/member/add");
		}	


		req.flash("success", 'Su producto fue guardado con excito');
		return res.redirect("/member/add");

	});
})

module.exports = router
