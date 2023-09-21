const { Mutex } = require('async-mutex');
const mutex = new Mutex();
const redis = require('redis');
const config = require('../config.json')

const redisClient = redis.createClient({
	host: config.host,
	port: config.port,
});

async function connectToRedis() {
	await redisClient.connect();
}
connectToRedis().catch(err => console.error(err)).then(console.log('redis connected'));

redisClient.on('error', (err) => {
	console.error(err);
});

redisClient.on('connect', () => {
	console.log('Connected to Redis.');
});

async function setLastTx(userId, timestamp) {
	const release = await mutex.acquire();
	try {
		redisClient.set(userId, timestamp);
	} finally {
		release()
	}
}

async function getLastTx(userId) {
	const release = await mutex.acquire();
	try {
		redisClient.get(userId)
	} catch (error) {
		console.error("Error in getLastTx:", error);
		throw error;
	} finally {
		release();
	}
}

module.exports = { getLastTx, setLastTx, redisClient };