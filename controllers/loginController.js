//controllers\loginController.js
export async function loginController(req, res) {
	const { email, password } = req.body;
	console.log(email, password);
	res.status(200).json({ email: email, status: 'Successfull' });
}
