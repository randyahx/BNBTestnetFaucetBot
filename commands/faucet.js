const { amount } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const cooldowns = require('../utils/cooldowns.js');
const sendViaPublicDataseed = require('../utils/sendViaPublicDataseed.js');

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
		let request;
		for (let i = 0; i < 5; i++) {
			request = await sendViaPublicDataseed(address, amount);
			if (request.status === 'success') {
				break;
			}
			await (new Promise(resolve => setTimeout(resolve, 500)));
		}

		if (request.status === 'success') {
			cooldowns.setLastTx(interaction.user.id, Date.now());
			await (new Promise(resolve => setTimeout(resolve, 1000)));
			// allow map to set lastTx
			const reply = 'Request sent. Please check the link to see if it\'s mined.';
			await interaction.reply(reply);
			const embed = new MessageEmbed()
				.setColor('#3BA55C')
				.setDescription(`[View on Bscscan](https://testnet.bscscan.com/tx/${request.message})`);
			return interaction.followUp({ content: `Transaction for ${amount} BNB created.`, embeds: [embed], ephemeral: true });
		}
		else {
			const reply = 'Failed to send funds. Please try again.'
			await interaction.reply(reply)
			return interaction.followUp({ content: `Failed to send funds. Please try again. Error: ${request.message}`, ephemeral: true });
		}
	},
};
