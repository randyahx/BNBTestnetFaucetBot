const fetch = require('node-fetch');
const { BSCSCAN_API_KEY } = require('../config.json');

module.exports = async (address) => {
	const url = `https://api-testnet.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${BSCSCAN_API_KEY}`;
	try {
		const response = await fetch(url);
		const data = await response.json();
		return data.result / 1e18;
	} catch (error) {
		console.error(`Error fetching balance: ${error}`);
		return null;
	}
}