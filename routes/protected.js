const fs = require('fs');
const path = require('path');
const bcrypt = require("bcrypt");
const db = require('../models/Database.js');
const router = require("express").Router();
const PDFDocument = require('pdfkit');






// Middleware to only allow authenticated users
router.use((req, res, next) => {
	if(req.isAuthenticated()) { return next() }

	return res.redirect('/login')
})

router.get("/", (req, res) => {
	res.send("No content")
})


router.get('/settings', (req, res) => {

	sql = 'SELECT value FROM settings WHERE name = "dolar_price"';
	db.get(sql, [], (erro, row) => {
		res.render('pages/settings', {user: req.user, dolar_price: row.value});
	});
})

router.post("/update_dolar_price", (req, res) => {
	console.log(req.body);

	let sql = `UPDATE settings SET value = ? WHERE name = "dolar_price"`;
	db.run(sql, [req.body.dolar_price], (err) => {
		if(err) {
			console.error(err);
			req.flash("error", "Ocurrio un error al momento de actualizar el precio del dolar");
			return res.redirect('settings');
		}

		req.flash("success", "Precio del dolar actualizado");
		return res.redirect('settings');
	})
});


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

	let sql = 'SELECT pdf.id, name, created_at, username FROM pdf INNER JOIN users ON pdf.user_id = users.id';
	db.all(sql, [], (err, row) => {
		if(err) console.error(err);

	//	console.log(row);
		res.render("pages/export_pdf", {user: req.user, reports: row});
	})

})

router.get("/new_pdf", (req, res) => {

	let file_path = path.join(__dirname, '../public/pdf/'); 
	let date = new Date().toISOString().split('T')[0]; 
	let filename = `export_${date}.pdf`;


	// Get products from database
	let sql_products = "SELECT name, amount, price, username FROM products INNER JOIN users ON products.user_id = users.id";
	db.all(sql_products, [], (err, rows) => {
		if (err) {
			return res.json({error: true});
		}	


		// Create the PDF
		const doc = new PDFDocument();
		doc.pipe(fs.createWriteStream(`${file_path}${filename}`));


		doc.fontSize(25).text("Productos en la base de datos");
		doc.moveDown();

		rows.forEach(row => {
			doc.fontSize(12).text(`${row.amount} x ${row.name} $${row.price} - ${row.username}`);
			doc.moveDown();
		})
		
		/*
		for(let i = 0; i <= 100; i++) {
			doc.fontSize(12).text(`4 x product #${i} $00 - Admin`);
		}
		doc.fontSize(12).text("2 x Noijoda $000");
		*/

		doc.end();

		/* Insertar el nuevo reporte en la base de datos */
		let sql = 'INSERT INTO pdf (name, created_at, user_id) VALUES (?, ?, ?)';
		let params = [filename, date, req.user.id];

		db.all(sql, params, (err, row) => {
			if (err) {
				return res.json({error: true});
			}	

			return res.json({error: false, name: filename, date: date,  user: req.user.username});
		})
	})

})


router.get('/add_user', (req, res) => {
	res.render('pages/ass_user', {user: req.user});
})

router.post('/add_user', (req, res) => {

	let {name, lastname, username, password, role, email} = req.body;
	let date = new Date().toISOString().split('T')[0];

	let salt = bcrypt.genSaltSync(10);
	let hash = bcrypt.hashSync(password, salt);

	let sql = "INSERT INTO users (first_name, last_name, username, email, password, registered_at, role) VALUES (?, ?, ?, ?, ?, ?, ?)";
	let params = [name, lastname, username, email, hash, date, role];

	db.run(sql, params, (err) => {
		if(err) {
			console.error(err);
			req.flash("error", 'Ocurrio un error agregando un nuevo usuario');
			return res.redirect("add_user");
		}		


		req.flash("success", 'Usuario guardado con excito');
		return res.redirect("add_user");
	});

})


router.get('/new_db_backup', (req, res) => {
	db.run("'.dump'");
	res.json({data: 'nojoda'});
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
	let sql = 'INSERT INTO products (name, price, amount, description, user_id) VALUES (?, ?, ?, ?, ?)';
	let params = [name, price, amount, description, req.user.id];

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
