const { amount } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Mutex } = require('async-mutex');
const mutex = new Mutex();
const sendViaPublicDataseed = require('../utils/sendViaPublicDataseed.js');
const { redisClient } = require('../utils/cooldowns');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('faucet')
		.setDescription('Request testnet funds from the faucet. Limited to one request per day.')
		.addStringOption(option =>
			option.setName('address')
				.setDescription('The address to request funds from the faucet')
				.setRequired(true)),
	async execute(interaction) {
		const address = interaction.options.get('address').value.trim();

		if (!interaction.deferred) await interaction.deferReply()

		let request;
		for (let i = 0; i < 5; i++) {
			request = await sendViaPublicDataseed(address, amount);
			if (request.status === 'success') {
				break;
			} else {
				console.log(`Request failed at attempt ${i + 1}. Status: ${request.status}`);
			}
			await (new Promise(resolve => setTimeout(resolve, 500)));
		}

		let release = await mutex.acquire();
		if (request.status === 'success') {
			// await (new Promise(resolve => setTimeout(resolve, 1000)));
			try {
				await redisClient.set(interaction.user.id, Date.now());
			} finally {
				release()
			}
			const embed = new MessageEmbed()
				.setColor('#3BA55C')
				.setDescription(`[View on Bscscan](https://testnet.bscscan.com/tx/${request.message})`);
			await interaction.editReply({ content: `Transaction for ${amount} BNB created.`, embeds: [embed], ephemeral: true });
		}
		else {
			console.log(`Request failed. Status: ${request.status}`);
			try {
				await redisClient.del(interaction.user.id);
			} finally {
				release()
			}
			await interaction.editReply({ content: `Failed to send funds. Please try again. Error: ${request.message}`, ephemeral: true });
		}
	},
};
