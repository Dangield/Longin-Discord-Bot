const { Users } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'collection',
	description: 'Lists cards possesed by user.',
	usage: '[user_mention]',
	aliases: 'col',
	async execute(message, args) {
		const target = message.mentions.users.first() || message.author;
		user = await Users.findByPrimary(target.id);
		if (!user) user = await Users.create({ user_id: target.id, numOfCards: 0});
		const cards = await user.getCards();
		if (!cards.length) return message.channel.send(`${target.tag} has nothing!`);
		// message.channel.send(`${target.tag} currently has:${cards.map(i => {
		// 	return `\n${i.amount} ${i.card.name} --> ${i.card.body} ${i.card.mind} ${i.card.flair} ${i.card.charm}`; 
		// }).join('')}`);
		replyMessage = new Discord.RichEmbed({title: `${target.username}'s collection`});
		replyMessage.setColor('#FFFFFF');
		replyMessage.addField('Amount', `${cards.map(i => `${i.amount}`).join('\n')}`, true);
		replyMessage.addField('Name', `${cards.map(i => `${i.card.name}`).join('\n')}`, true);
		replyMessage.addField('Body Mind Flair Charm', `${cards.map(i => `${i.card.body}\t\t${i.card.mind}\t\t${i.card.flair}\t\t${i.card.charm}`).join('\n')}`, true);
		return message.channel.send(replyMessage)
	},
};
