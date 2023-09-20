const { Client, Intents } = require('discord.js');

const token = 'MTE1Mzg0OTYxOTQ5OTk4Mjk3OA.GNygV9.zvq5j_wjg_6nDniDhGHrN494gQ-IJrxz_bzUnY';
const guildId = '1100290232965935246';
const channelId = '1100290232965935249';
const clientId = '1118787552896364554'; // Client ID of the bot you want to test
const testUserId = 'potato'; // The ID of the user that the test bot should simulate
const testAddress = '0xa11AbE8eCaad160b1CFAB5Ce13476faE40407dC2'; // The BSC address to use in the faucet command

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
});

client.once('ready', () => {
	console.log('Test bot ready');
});

client.on('messageCreate', async message => {
	if (message.guild.id !== guildId || message.channel.id !== channelId) {
		return;
	}

	if (message.author.id === clientId && message.mentions.has(testUserId)) {
		console.log('Received a reply from the faucet bot:', message.content);
	}
});

client.login(token).then(() => {
	setTimeout(async () => {
		const guild = await client.guilds.fetch(guildId);
		const channel = await guild.channels.fetch(channelId);
		const command = `/faucet ${testAddress}`;
		console.log('Sending faucet command 5 times in rapid succession.');
		for (let i = 0; i < 5; i++) {
			await channel.send(command);
		}
	}, 5000);
});