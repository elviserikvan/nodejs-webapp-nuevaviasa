const btn = document.getElementById("new_db_backup");

function insert_new_row_in_table(data) {

	let html = `
	<td>${data.filename}</td>
	<td>${data.date}</td>
	<td>${data.user}</td>
	<td>
		<div class="dropdown">
			<button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				...
			</button>
			<div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
				<a class="dropdown-item" href="/member/delete_db_backup/${data.id}">Eliminar</a>
			</div>
		</div>
	</td>`;

	let reports_table_body = document.getElementById('backups_table');
	let tr = document.createElement('tr');	

	tr.innerHTML = html;
	reports_table_body.appendChild(tr);
}

btn.addEventListener('click', e => {
	fetch('/member/new_db_backup', {method: 'POST'})
		.then(response => response.json())
		.then(data => {
			insert_new_row_in_table(data);
			console.log(data);
		});
})
