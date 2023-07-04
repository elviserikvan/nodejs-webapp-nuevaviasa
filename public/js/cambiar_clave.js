

const submit_btn = document.getElementById('submit_btn');

if(submit_btn) {
	submit_btn.addEventListener('click', event => {
		event.preventDefault();

		const password1 = document.getElementById('password').value;
		const password2 = document.getElementById('password-2').value;

		console.log(password1);
		console.log(password2);

		if( (password1 != password2) || (password1 == '') || (password2 == '') ) {

			// Mostrar alert
			document.getElementById("no_match_alert").classList.remove('hide');

		}else {
			//console.log("Passwords match");
			document.getElementById("no_match_alert").classList.add('hide');
			document.getElementById('change_password_form').submit();
		}
	});
}

