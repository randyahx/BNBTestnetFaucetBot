const { Client, Collection, Intents } = require('discord.js');
const { token, cooldown } = require('./config.json');
const { cooldowns } = require('./utils/cooldowns');
const fs = require('fs');
const isAddress = require('./utils/address');
const getBalance = require('./utils/getBalance');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

// Changed keyv to map
const map = new Map();

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
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	if (command.data.name === 'faucet') {
		const address = interaction.options.get('address').value.trim();
		if (!isAddress(address)) {
			return interaction.reply('Please enter a valid BSC Address');
		}

		const lastTx = cooldowns.getLastTx(interaction.user.id);
		if (lastTx) {
			if (Date.now() - lastTx < cooldown) {
				const timeLeftInSeconds = Math.floor((cooldown - (Date.now() - lastTx)) / 1000);
				const hours = Math.floor(timeLeftInSeconds / 3600);
				const minutes = Math.floor((timeLeftInSeconds % 3600) / 60);
				const seconds = timeLeftInSeconds % 60;
				return interaction.reply(`You can only request funds once every day. Please try again in ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`);
			}
		}
		if (await getBalance(address) > 1) {
			return interaction.reply('You are not allowed to claim more TBNB if your balance is over 1 TBNB');
		}
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		// await interaction.editReply({ content: 'Please wait 15 seconds before sending another command!', ephemeral: true });
	}
});

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);
