const { Users, CardCompendium } = require('../dbObjects');

module.exports = {
	name: 'add',
	description: 'Adds card to player\'s deck.',
	args: true,
	usage: '[card_name]',
	guildOnly: true,
	async execute(message, args) {
		const target = message.author;
		user = await Users.findByPrimary(target.id);
		if (!user) user = await Users.create({ user_id: target.id, numOfCards: 0});
		cardName = args;
		cardName = cardName.join(' ');
		const card = await CardCompendium.findOne({ where: { name: cardName } });
		if (!card) return message.channel.send('There is no such card!');
		if (await  user.addToDeck(card)) {
			user.cardsInDeck += 1;
			user.save();
			return message.channel.send(`${target.tag} added ${cardName} to deck.`);
		}
		return message.channel.send(`You don't have enough of ${cardName} cards.`);
	},
};
