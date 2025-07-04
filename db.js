import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('❌ MONGODB_URI not found');

const client = new MongoClient(uri);
const dbName = 'fyvio_db';

export async function getDb() {
	if (!client.topology?.isConnected()) {
		await client.connect();
	}
	return client.db(dbName);
}
