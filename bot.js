// require the discord.js module
const Discord = require('discord.js');
// require config.json file
const { prefix, token } = require('./config.json');
// require fs
const fs = require('fs');

// create a new Discord client
const bot = new Discord.Client();

// load tables from database
const { Users, CardCompendium } = require('./dbObjects');

// create collection of commands
bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands');
for (const file of commandFiles) {
	console.log('Loaded command: ' + file);
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    bot.commands.set(command.name, command);
}
//create collection for cooldowns
const cooldowns = new Discord.Collection();

// when the client is ready, run this code
// this event will trigger whenever your bot:
// - finishes logging in
// - reconnects after disconnecting
bot.on('ready', () => {
    console.log('Ready!');
	// bot.user.setUsername('Longin');
	// bot.user.setAvatar('./longin_avatar.png');
	bot.user.setActivity(prefix + 'help');
});

bot.on('message', message => {
	// if (!message.content.startsWith(prefix) || message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	// log command
    console.log(message.author.username + ':' + message.content);
    // get command name and arguments
	const args = message.content.slice(prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();

	// check if the command exist and get it if it does
	const command = bot.commands.get(commandName)
        || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

	// check if the command is guild only
	if (command.guildOnly && message.channel.type !== 'text') {
	    return message.reply('I can\'t execute that command inside DMs!');
	}

	// check if arguments were provided
	if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }

	// cooldowns handling
	if (!cooldowns.has(command.name)) {
	    cooldowns.set(command.name, new Discord.Collection());
	}
	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 1) * 1000;
	if (!timestamps.has(message.author.id)) {
	    timestamps.set(message.author.id, now);
	    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	}
	else {
	    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

	    if (now < expirationTime) {
	        const timeLeft = (expirationTime - now) / 1000;
	        return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
	    }

	    timestamps.set(message.author.id, now);
	    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	}

    // execute command
	try {
		command.execute(message, args);
	}
	catch (error) {
	    console.error(error);
	    message.reply('there was an error trying to execute that command!');
	}
});

// login to Discord with your app's token
bot.login(token);