const { Users, CardCompendium } = require('../dbObjects');

module.exports = {
	name: 'takeaway',
	description: 'Takes card away from the user.',
	args: true,
	usage: '[user_mention] [card_name]',
	aliases: 'take',
	async execute(message, args) {
		if (message.channel.type !== 'dm' && message.author.id !== message.guild.ownerID){
			return message.reply('Only owner can do it on the server.')
		}
		const target = message.mentions.users.first();
		if (!target) return  message.channel.send('No user mentioned!')
		user = await Users.findByPrimary(target.id);
		if (!user) return message.channel.send("User does not have any cards!");
		cardName = args;
		cardName.shift();
		cardName = cardName.join(' ');
		const card = await CardCompendium.findOne({ where: { name: cardName } });
		if (!card) return message.channel.send('There is no such card!');
		await user.removeCard(card);
		return message.channel.send(`${target.tag} lost ${cardName} card.`);
	},
};
