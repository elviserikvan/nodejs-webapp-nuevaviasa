const express = require('express');
const mongoose = require('mongoose');
const unprotected_routes = require('./routes/unprotected');
const protected_routes = require('./routes/protected');
const PORT = 8080;

const app = express()

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

// Unprotected routes
app.use('/', unprotected_routes)
app.use('/member', protected_routes)


app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`)
})
