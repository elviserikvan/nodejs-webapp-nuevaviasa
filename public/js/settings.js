const new_backup = document.getElementById("new_backup_btn");

new_backup.addEventListener('click', e => {
	fetch('new_db_backup')
		.then(response => response.json())
		.then(data => console.log(data));
})
