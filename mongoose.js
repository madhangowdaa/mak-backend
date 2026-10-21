import mongoose from 'mongoose';

const mongoURI = process.env.MONGODB_URI;

console.log(mongoURI);

const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function main() {
	console.log('Entering Main Function');
	try {
		const isConnected = await mongoose.connect(mongoURI);
		console.log('Mongodb is conneccted', isConnected);
	} catch (err) {
		console.log('Error Occured', err);
	}
}
main();

export default User;
