const { amount } = require('../config.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const sendViaAlchemy = require('../utils/sendViaPublicDataseed.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('faucet')
		.setDescription('Request testnet funds from the faucet')
		.addStringOption(option =>
			option.setName('address')
				.setDescription('The address to request funds from the faucet')
				.setRequired(true)),
	async execute(interaction) {
		const address = interaction.options.get('address').value.trim();

		const reply =
			'Request sent. Please check the link to see if it\'s mined.';

		await interaction.reply(reply);

		const request = await sendViaAlchemy(address, amount);

		if (request.status === 'success') {
			const embed = new MessageEmbed()
				.setColor('#3BA55C')
				.setDescription(`[View on Bscscan](https://testnet.bscscan.com/tx/${request.message})`);
			return interaction.followUp({ content: `Transaction for ${amount} BNB created.`, embeds: [embed] });
		}
		else {
			return interaction.followUp(`Failed to send funds. Error: ${request.message}`);
		}
	},
};