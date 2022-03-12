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


router.get("/ayuda", (req, res) => {
	res.render("pages/ayuda", {user: req.user});
})

router.get("/database", (req, res) => {


	let sql = 'SELECT reports.id, name, created_at, username FROM reports INNER JOIN users ON reports.user_id = users.id WHERE type = ?';
	let params = ['db'];
	db.all(sql, params, (err, rows) => {
		res.render("pages/database", {user: req.user, backups: rows});
	})


})

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect("/");
})

router.get('/settings', (req, res) => {

	sql = 'SELECT value FROM settings WHERE name = "dolar_price"';
	db.get(sql, [], (erro, row) => {
		res.render('pages/settings', {user: req.user, dolar_price: row.value});
	});
})

router.post("/update_dolar_price", (req, res) => {

	// Check if empty
	if(req.body.dolar_price == '') {
		req.flash("error", "El precio del dolar no puede estar en blanco");
		return res.redirect('settings');
	}

	// Check if not a number
	let price = parseInt(req.body.dolar_price);
	if(isNaN(price)){
		req.flash("error", "El precio del dolar tiene que ser un numero");
		return res.redirect('settings');
	}

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



router.get("/dashboard", (req, res) => {
	

	let sql_dolar = 'SELECT value FROM settings WHERE name="dolar_price"'
	db.get(sql_dolar, [], (err, dolar_price) => {
		if (err) console.error(err);


		// Get all products
		let sql = 'SELECT * FROM products';
		let params = [];
		
		db.all(sql, params, (err, rows) => {

			rows.forEach((row) => {
				row.precio = (row.price * dolar_price.value).toFixed(2);
			})


			res.render("pages/dashboard", {user: req.user, products: rows, dolar_price: dolar_price})
		})

	})
	


})


router.get("/delete/:id", (req, res) => {
	let sql = "DELETE FROM products WHERE id = ?";
	let params = [req.params.id];

	db.all(sql, params, (err, row) => {
		if (err) { 
			console.log(err);  

			req.flash("error", `Ocurrio un error al momento de eliminar este producto`);
			return res.redirect("/member/dashboard");

		}

		req.flash("success", `Producto eliminado`);
		return res.redirect("/member/dashboard");
	})
})

router.get("/modificar/:id", (req, res) => {

	let sql = 'SELECT * FROM products WHERE id = ?';
	let params = [req.params.id];

	db.get(sql, params, (err, row) => {

		if (err || row == undefined) {
			console.error(err);

			req.flash("error", `Ocurrio un error al momento de editar este producto`);
			return res.redirect(`/member/dashboard`);
		}else {
			
			res.render("pages/modify_products", {user: req.user, product: row})
		}

	})
 
})

router.post("/modificar/:id", (req, res) => {

	let {name, price, amount, description } = req.body;
	price = parseInt(price);
	amount = parseInt(amount);

	//check_if_inputs_are_empty(req, res,`/member/modificar/${req.params.id}`);
	
	// Check if any input is empty
	for(key in req.body) {

		if(req.body[key] == "") {
			
			req.flash("error", `Ningun campo puede estar vacio`);
			return res.redirect(`/member/modificar/${req.params.id}`);
		}

	}

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

router.get('/delete_db_backup/:id', (req, res) => {
	let sql = "DELETE FROM reports WHERE id = ?";
	let params = [req.params.id];

	db.all(sql, params, (err, row) => {
		if (err) { 
			console.log(err);  

			req.flash("error", `Ocurrio un error al momento de eliminar este reporte`);
			return res.redirect("/member/database");

		}

		req.flash("success", `Reporte eliminado`);
		return res.redirect("/member/database");
	})
	
})

router.post('/new_db_backup', (req, res) => {


//	res.json({nojoda: 'Verga'});

	var file_path = path.join(__dirname, '../public/db_backup/'); 
	var date = new Date().toISOString().split('T')[0]; 
	var filename = `database_${date}.json`;

	// Check of filename already exists
	try {
		if(fs.existsSync(`${file_path}${filename}`)) {
			// File already exists

			date = new Date().toISOString().split('T')[0]; 
			for(i = 0; i <= 999; i++) {
				
				filename = `database_${date}`;
				filename += `-(${i}).json`
				
				if(fs.existsSync(`${file_path}${filename}`)) {
					continue;
				} else {
					break;
				}
			
			}
		} 
			
	} catch (e) {
		console.error(e, 'File already exists');
	}


//	console.log(`${filename}`);


	//BackUp users table
	let sql_users = 'SELECT * FROM users';
	db.all(sql_users, [], (err, users_data) => {

		/*
		console.log(users_data);
		console.log(JSON.stringify(users_data));
		*/


		//BackUp products table
		let sql_products = 'SELECT * FROM products';
		db.all(sql_products, [], (err, products_data) => {


			/*
			console.log(products_data);
			console.log(JSON.stringify(products_data));
			*/


			//BackUp pdf table
			let sql_pdf = 'SELECT * FROM pdf';
			db.all(sql_pdf, [], (err, pdf_data) => {

				/*
				console.log(pdf_data);
				console.log(JSON.stringify(pdf_data));
				*/

				const backup_data = {
					'users': users_data,
					'products': products_data,
					'pdf_data': pdf_data
				}

				/*
				console.log(backup_data);
				console.log('-------------------------------------------------------------------------------------------------------------------------------');
				console.log(JSON.stringify(backup_data));
				console.log('-------------------------------------------------------------------------------------------------------------------------------');
				console.log(`${file_path}${filename}`);
				*/

				fs.writeFile(`${file_path}${filename}`, JSON.stringify(backup_data), err => console.error(err));
				
				let sql_insert = 'INSERT INTO reports (name, created_at, user_id, type) VALUES (?, ?, ?, ?)';
				let params = [filename, date, req.user.id, 'db'];
				db.run(sql_insert, params, function (err) {
					if (err) {
						console.error(err);
					}

					
					res.json({filename, date, user: req.user.username, id: this.lastID });

					/*
					console.log(this.lastID);
					console.log(this.changes);
					*/

				})


			})


		})
	})
	



})

router.get("/new_pdf", (req, res) => {

	var file_path = path.join(__dirname, '../public/pdf/'); 
	var date = new Date().toISOString().split('T')[0]; 
	var filename = `export_${date}.pdf`;

	// Check of filename already exists
	try {
		if(fs.existsSync(`${file_path}${filename}`)) {
			// File already exists

			date = new Date().toISOString().split('T')[0]; 
			for(i = 0; i <= 999; i++) {
				
				filename = `export_${date}`;
				filename += `-(${i}).pdf`
				
				if(fs.existsSync(`${file_path}${filename}`)) {
					continue;
				} else {
					break;
				}
			
			}
		} 
			
	} catch (e) {
		console.error(e, 'File already exists');
	}



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
	
	// Check if any input is empty
	for(key in req.body) {

		if(req.body[key] == "") {
			
			req.flash("error", `Ningun campo puede estar vacio`);
			return res.redirect(`/member/add_user`);
		}

	}
	

	// Check for already existing username and email
	let sql_check_existing = "SELECT id FROM users WHERE username = ? OR email = ?";
	let params_check_existing = [username, email];
	db.get(sql_check_existing, params_check_existing, (err, row) => {

		// Check Error
		if (err) {
			req.flash("error", `Ocurrio un error al momento de agregar el nuevo usuario`);
			return res.redirect(`/member/add_user`);
			console.error(err);
		}

		if(row) {

			req.flash("error", `Usuario o email ya esta siendo usado por otro usuario`);
			return res.redirect(`/member/add_user`);
		}


		// Inser user to database
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
	


})


router.get('/restore_db_backup', (req, res) => {
	let sql = 'SELECT * FROM reports WHERE type = ?';
	let params = ['db'];

	db.all(sql, params, (err, rows) => {
		if (err) console.error(err);

		res.render('pages/restore_db', {user: req.user, reports: rows});
	})

})

router.post('/restore_db_backup', (req, res) => {

	let report_id = parseInt(req.body.report_id);

	let sql = 'SELECT * FROM reports WHERE id = ?';
	let params = [report_id];

	db.get(sql, params, (err, row) => {
		if(err) console.error(err);
		
		try {
			let data = fs.readFileSync(`public/db_backup/${row.name}`, 'utf8');
			let data_json = JSON.parse(data);

			/*
			console.log(JSON.parse(data));
			console.log(data_json);
			*/

			// Loop through users, products, pdf
			/*
			for (key in data_json) {

					if(key != 'users' ) {continue};

				// Loop through all the elements of that section
				data_json[key].forEach(function(row) {


					var sql;
					var params;

					if (key == 'users' ) {
						console.log('Nojoda');
						sql = "SELECT id FROM users WHERE first_name = ? AND last_name = ? AND username = ? AND email = ? AND password = ? AND registered_at = ? AND role = ?";
						params = [row.first_name, row.last_name, row.username, row.email, row.password, row.registered_at, row.role];
					}

					sql = "SELECT id FROM users WHERE first_name = ? AND last_name = ? AND username = ? AND email = ? AND password = ? AND registered_at = ? AND role = ?";
					params = [row.first_name, row.last_name, row.username, row.email, row.password, row.registered_at, row.role];

					/*
					if (key == 'products' ) {
						var sql = 'select id from products where name = ? and price = ? and amount = ? and description = ? and user_id = ? ';
						var params = [row.name, row.price, row.amount, row.description, row.user_id];
					}

					if (key == 'pdf' ) {
						var sql = 'SELECT id FROM pdf WHERE name = ? AND created_at = ? AND user_id = ?';
						var params = [row.name, row.created_at, row.user_id];
					}

					db.get(sql, params, (err, row) => {
						if (err) console.error(err);

						if (row == undefined) {

							/*
							let sql_insert = 'INSERT INTO users (first_name, last_name, username, email, password, registered_at, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
							let params_insert = [row.first_name, row.last_name, row.username, row.email, row.password, row.registered_at, row.role];

						       var sql_insert; 
						       var params_insert;

							if (key == 'users' ) {
								sql_insert = 'INSERT INTO users (first_name, last_name, username, email, password, registered_at, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
								params_insert = [row.first_name, row.last_name, row.username, row.email, row.password, row.registered_at, row.role];
							}

							/*
							if (key == 'products' ) {
								var sql_insert = 'INSERT INTO products (name, price, amount, description, user_id) VALUES (?, ?, ?, ?, ?)';
								var params_insert = [row.name, row.price, row.amount, row.description, row.user_id];
							}

							if (key == 'pdf' ) {
								var sql_insert = 'INSERT INTO pdf (name, created_at, user_id) VALUES (?, ?, ?)';
								var params_insert = [row.name, row.created_at, row.user_id];
							}

							db.run(sql_insert, params_insert, err => {
								if (err) console.error(err);

								req.flash('success', 'Base de datos restaurada con excito');
								return res.redirect('/member/restore_db_backup');
							})

						}
					})
					
				})	

			}
		*/

			// users
			data_json['users'].forEach(user => {
				//console.log(user);

				let sql = 'SELECT id FROM users WHERE first_name = ? AND last_name = ? AND username = ? AND email = ? AND password = ? AND registered_at = ? AND role = ? ';
				let params = [user.first_name, user.last_name, user.username, user.email, user.password, user.registered_at, user.role];

				db.get(sql, params, (err, row) => {
					if (err) console.error(err);

					if (row == undefined) {

						let sql_insert = 'INSERT INTO users (first_name, last_name, username, email, password, registered_at, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
						let params_insert = [user.first_name, user.last_name, user.username, user.email, user.password, user.registered_at, user.role];

						db.run(sql_insert, params_insert, err => {
							if (err) console.error(err);


						})

					}

				})
			})

			data_json['products'].forEach(product => {
				//console.log(user);

				/*
				let sql = 'SELECT id FROM users WHERE first_name = ? AND last_name = ? AND username = ? AND email = ? AND password = ? AND registered_at = ? AND role = ? ';
				let params = [user.first_name, user.last_name, user.username, user.email, user.password, user.registered_at, user.role];
				*/

				let sql = 'SELECT id FROM products WHERE name = ? and price = ? and amount = ? and description = ? and user_id = ? ';
				let params = [product.name, product.price, product.amount, product.description, product.user_id];

				db.get(sql, params, (err, row) => {
					if (err) console.error(err);

					if (row == undefined) {

						/*
						let sql_insert = 'INSERT INTO users (first_name, last_name, username, email, password, registered_at, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
						let params_insert = [user.first_name, user.last_name, user.username, user.email, user.password, user.registered_at, user.role];
						*/

						var sql_insert = 'INSERT INTO products (name, price, amount, description, user_id) VALUES (?, ?, ?, ?, ?)';
						var params_insert = [product.name, product.price, product.amount, product.description, product.user_id];

						db.run(sql_insert, params_insert, err => {
							if (err) console.error(err);

						})

					}

				})
			})

			data_json['pdf_data'].forEach(pdf => {
				//console.log(user);

				/*
				let sql = 'SELECT id FROM users WHERE first_name = ? AND last_name = ? AND username = ? AND email = ? AND password = ? AND registered_at = ? AND role = ? ';
				let params = [user.first_name, user.last_name, user.username, user.email, user.password, user.registered_at, user.role];

				let sql = 'SELECT id FROM products WHERE name = ? and price = ? and amount = ? and description = ? and user_id = ? ';
				let params = [product.name, product.price, product.amount, product.description, product.user_id];
				*/

				var sql = 'SELECT id FROM pdf WHERE name = ? AND created_at = ? AND user_id = ?';
				var params = [pdf.name, pdf.created_at, pdf.user_id];

				db.get(sql, params, (err, row) => {
					if (err) console.error(err);

					if (row == undefined) {

						/*
						let sql_insert = 'INSERT INTO users (first_name, last_name, username, email, password, registered_at, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
						let params_insert = [user.first_name, user.last_name, user.username, user.email, user.password, user.registered_at, user.role];

						var sql_insert = 'INSERT INTO products (name, price, amount, description, user_id) VALUES (?, ?, ?, ?, ?)';
						var params_insert = [product.name, product.price, product.amount, product.description, product.user_id];
						*/


						var sql_insert = 'INSERT INTO pdf (name, created_at, user_id) VALUES (?, ?, ?)';

						db.run(sql_insert, params, err => {
							if (err) console.error(err);

						})

					}

				})
			})

			req.flash('success', 'Base de datos restaurada con excito');
			return res.redirect('/member/restore_db_backup');

			/*
			for(key in data_json) {
				data_json[key].forEach(row => console.log(row));
			}
			*/


		} catch(e) {
			console.log(e);

			req.flash('error', 'Ocurrio un error restaurando la base de datos')
			return res.redirect('/member/restore_db_backup');
		}
		
	})
})


/*
router.get('/new_db_backup', (req, res) => {
	db.run("'.dump'");
	res.json({data: 'nojoda'});
})
*/


router.post('/add', (req, res) => {

	let {name, price, amount, description } = req.body;
	price = parseInt(price);
	amount = parseInt(amount);



	// Check if any input is empty
	for(key in req.body) {

		if(req.body[key] == "") {
			
			req.flash("error", `Ningun campo puede estar vacio`);
			return res.redirect("/member/add");
		}

	}

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
			return res.redirect("/member/dashboard");
		}	


		req.flash("success", 'Su producto fue guardado con excito');
		return res.redirect("/member/dashboard");

	});
})

module.exports = router
