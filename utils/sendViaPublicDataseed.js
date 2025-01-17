const { BSC_TESTNET_RPC_URL, BSC_TESTNET_CHAIN_ID, PRIVATE_KEY, FROM_ADDRESS, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, BALANCE_ALERT_THRESHOLD, gasAmount} = require('../config.json');
const Web3 = require('web3');
const web3 = new Web3(BSC_TESTNET_RPC_URL);
const fetch = require('node-fetch')

const sendTelegramAlert = async (message) => {
	const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${message}`;
	await fetch(url);
}

module.exports = async (toAddress, amount) => {
	console.log('Received new request from ', toAddress, 'for', amount);
	if (!PRIVATE_KEY || !FROM_ADDRESS || !BSC_TESTNET_RPC_URL) {
		return { status: 'error', message: 'Missing environment variables, please ask human to set them up.' };
	}
	return new Promise(async (resolve, reject) => {
		const balance = web3.utils.fromWei(await web3.eth.getBalance(FROM_ADDRESS), 'ether');
		if (balance < BALANCE_ALERT_THRESHOLD) {
			await sendTelegramAlert(`The balance for the discord faucet is currently below specified threshold. Current balance: ${balance}`)
		}
		if (balance < parseFloat(amount)) {
			reject({ status: 'error', message: `I'm out of funds! Please donate: ${FROM_ADDRESS}` });
		}
		const nonce = await web3.eth.getTransactionCount(FROM_ADDRESS, 'pending');
		const amountInWei = web3.utils.toWei(amount);
		const gas = await web3.eth.getGasPrice();
		const transaction = {
			to: toAddress,
			value: amountInWei,
			gas: gasAmount,
			gasPrice: gas,
			nonce: nonce,
			chainId: BSC_TESTNET_CHAIN_ID,
		};
		const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
		web3.eth.sendSignedTransaction(signedTx.rawTransaction)
			.on('transactionHash', (hash) => {
				console.log('Transaction: https://testnet.bscscan.com/tx/' + hash);
				resolve({ status: 'success', message: hash });
			})
			.on('error', (error) => {
				console.log('error: ', error);
				reject({ status: 'error', message: error });
			});
	});
};