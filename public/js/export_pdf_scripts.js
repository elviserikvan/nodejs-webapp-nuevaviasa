
const new_pdf_btn = document.getElementById('new_pdf_btn');

function insert_new_row_in_table(data) {

	let reports_table_body = document.getElementById('reports_table_body');

	let tr = document.createElement('tr');	
	let td_name = document.createElement('td');	
	let td_name_link = document.createElement('a');
	let td_date = document.createElement('td');	
	let td_username = document.createElement('td');	


	td_name_link.setAttribute('href', `/pdf/${data.name}`);

	td_name_link.innerHTML = data.name;
	td_date.innerHTML = data.date;
	td_username.innerHTML = data.user;

	td_name.appendChild(td_name_link);
	tr.appendChild(td_name)
	tr.appendChild(td_date)
	tr.appendChild(td_username);


	reports_table_body.appendChild(tr);
}

new_pdf_btn.addEventListener('click', e => {
	fetch("/member/new_pdf")
		.then(response => response.json())
		.then(data => {
			insert_new_row_in_table(data);
			console.log(data);	
		});
});
