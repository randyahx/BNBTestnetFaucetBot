const { SlashCommandBuilder } = require('@discordjs/builders');
const { BSC_TESTNET_RPC_URL, FROM_ADDRESS } = require('../config.json');
const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC_URL);
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with configured provider, faucet balance and donation address.'),
	async execute(interaction) {
		let balance;
		try {
			balance = await ethers.utils.formatEther(await provider.getBalance(FROM_ADDRESS));
		} catch (e) {
			console.log(e);
			return interaction.reply('Error getting balance. Please check logs.');
		}
		const balanceShort = balance.toString().slice(0, balance.toString().indexOf('.') + 3);
		return interaction.reply(`Provider: BSC Testnet. Current balance: ${balanceShort} BNB. Please use /faucet to request funds.\nDonate: ${FROM_ADDRESS}`);
	},
};