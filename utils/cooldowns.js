const { Mutex } = require('async-mutex');
const mutex = new Mutex();

// your existing code
let lastTxMap = new Map();

const getLastTx = (userId) => {
	return lastTxMap.get(userId);
};

const setLastTx = async (userId, timestamp) => {
	const release = await mutex.acquire();
	try {
		lastTxMap.set(userId, timestamp);
	} finally {
		release();
	}
};

module.exports = { getLastTx, setLastTx };