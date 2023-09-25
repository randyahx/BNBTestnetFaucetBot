const { Client, Collection, Intents } = require('discord.js');
const { token, cooldown } = require('./config.json');
const { Mutex } = require('async-mutex');
const mutex = new Mutex();
const { getLastTx, setLastTx, redisClient } = require('./utils/cooldowns');
const fs = require('fs');
const isAddress = require('./utils/address');
const getBalance = require('./utils/getBalance');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on('interactionCreate', async interaction => {
	try {
		if (!interaction.isCommand()) return;
		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		await interaction.deferReply();

		if (command.data.name === 'faucet') {
			const address = interaction.options.get('address').value.trim();

			if (!isAddress(address)) {
				return interaction.editReply({content: 'Please enter a valid BSC Address', ephemeral: true });
			}

			let release = await mutex.acquire();
			let lastTx = null
			try {
				lastTx = await redisClient.get(interaction.user.id)
			} finally {
				release()
			}

			if (lastTx && (Date.now() - lastTx < cooldown)) {
				const timeLeftInSeconds = Math.floor((cooldown - (Date.now() - lastTx)) / 1000);
				const hours = Math.floor(timeLeftInSeconds / 3600);
				const minutes = Math.floor((timeLeftInSeconds % 3600) / 60);
				const seconds = timeLeftInSeconds % 60;
				return interaction.editReply({ content: `You can only request funds once every day. Please try again in ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`, ephemeral: true });
			}

			release = await mutex.acquire();
			try {
				await redisClient.set(interaction.user.id, Date.now());
			} finally {
				release()
			}

			if (await getBalance(address) > 1) {
				await redisClient.del(interaction.user.id);
				await interaction.editReply({content: 'You are not allowed to claim more TBNB if your balance is over 1 TBNB.', ephemeral: true });
				return
			}
		}

		await command.execute(interaction);
	} catch (error) {
		interaction.editReply({content: `An error occurred while executing the command. Check your wallet to see if the transaction went through. ${error}`, ephemeral: true });
	}
});

client.login(token);