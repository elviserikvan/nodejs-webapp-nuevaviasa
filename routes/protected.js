
const router = require("express").Router();

router.get("/", (req, res) => {
	res.send("No content")
})

router.get("/dashboard", (req, res) => {
	res.render("pages/dashboard")
})

router.get("/modificar/:id", (req, res) => {
	console.log(req.params.id)
	res.render("pages/modify_products")
})


router.get("/add", (req, res) => {
	res.render("pages/añadir")
})

router.get("/exportpdf", (req, res) => {
	res.render("pages/export_pdf")
})

module.exports = router
