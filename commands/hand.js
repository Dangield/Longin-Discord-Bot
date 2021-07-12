const { Users, DuelCards } = require('../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'hand',
	description: 'Show your hand in duel.',
	async execute(message, args) {
		const author = message.author;
		user1 = await Users.findByPrimary(author.id);
		if (!user1) user1 = await Users.create({ user_id: author.id, numOfCards: 0});
		if (!user1.inDuel) return message.channel.send(`${author} is not in duel.`);

		// find cards
		cards = await user1.getAvailableDuelCards();
		if(!cards.length) return message.channel.send(`You have already played all your cards.`)

		// return message
		replyMessage = new Discord.RichEmbed({title: `${author.username}'s hand`});
		replyMessage.setColor('#FFFFFF');
		replyMessage.addField('Name', `${cards.map(i => `${i.card.name}`).join('\n')}`, true);
		replyMessage.addField('Body Mind Flair Charm', `${cards.map(i => `${i.card.body}\t\t${i.card.mind}\t\t${i.card.flair}\t\t${i.card.charm}`).join('\n')}`, true);
		return message.channel.send(replyMessage)
	},
};
