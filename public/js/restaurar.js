function validation_email(email){

	let validated = true;
	//let regexp = new RegExp("/^[a-zA-Z0-9.! #$%&'*+/=? ^_`{|}~-]+@[a-zA-Z0-9-]+(?:\. [a-zA-Z0-9-]+)*$/");;

	if(email == '') {
		validated = false;
	}

//	if(regexp.test(email)) {
//		console.log('REGEXP FAILED');
//		validated = false;
//	}

	return validated;
}


const buscar_cuenta_btn = document.getElementById("buscar_restaurar_btn");
buscar_cuenta_btn.addEventListener('click', async event => {
	//event.preventDefault();

	const email = document.getElementById("email-input").value;
	let email_valid =  validation_email(email);

	if(email_valid) {
		const url = "/restaurar";


		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				test: "testing"
			})
		};


		const options_2 = {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({test: 'testing'})

			//body: `email=testing`
			//body: {test: 'testing'}

		};
		//console.log(options);
		
		const axios_test = await axios.post(url, {test: 'testomn'});

		const response = await fetch(url, options);
		const data = await response.text();
		console.log(data);
	}

	console.log(`EMAIL VALID: ${email_valid}`);
});
