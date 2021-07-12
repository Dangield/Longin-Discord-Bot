const { Users, CardCompendium } = require('../dbObjects');

module.exports = {
	name: 'remove',
	description: 'Takes card away from the user (owner only).',
	args: true,
	usage: '[user_mention] [card_name]',
	guildOnly: true,
	async execute(message, args) {
		const target = message.author;
		user = await Users.findByPrimary(target.id);
		if (!user) return message.channel.send("User does not have any cards!");
		cardName = args;
		cardName = cardName.join(' ');
		const card = await CardCompendium.findOne({ where: { name: cardName } });
		if (!card) return message.channel.send('There is no such card!');
		if (await user.removeFromDeck(card)) return message.channel.send(`${target.tag} removed ${cardName} card from deck.`);
		return message.channel.send(`${cardName} card cannot be removed from deck.`);
	},
};
