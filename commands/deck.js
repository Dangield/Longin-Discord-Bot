const { Users } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'deck',
	description: 'Lists cards possesed by user.',
	usage: '[user_mention]',
	async execute(message, args) {
		const target = message.mentions.users.first() || message.author;
		user = await Users.findByPrimary(target.id);
		if (!user) user = await Users.create({ user_id: target.id, numOfCards: 0});
		const cards = await user.getDeck();
		if (!cards.length) return message.channel.send(`${target.tag} has nothing in his deck!`);
		replyMessage = new Discord.RichEmbed({title: `${target.username}'s deck of ${user.cardsInDeck} cards`});
		replyMessage.setColor('#FFFFFF');
		replyMessage.addField('Amount', `${cards.map(i => `${i.inDeck}`).join('\n')}`, true);
		replyMessage.addField('Name', `${cards.map(i => `${i.card.name}`).join('\n')}`, true);
		replyMessage.addField('Body Mind Flair Charm', `${cards.map(i => `${i.card.body}\t\t${i.card.mind}\t\t${i.card.flair}\t\t${i.card.charm}`).join('\n')}`, true);
		return message.channel.send(replyMessage)
	},
};