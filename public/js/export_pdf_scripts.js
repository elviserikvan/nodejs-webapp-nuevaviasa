
const new_pdf_btn = document.getElementById('new_pdf_btn');

new_pdf_btn.addEventListener('click', e => {
	fetch("/member/new_pdf")
		.then(response => response.json())
		.then(data => console.log(data));
});
