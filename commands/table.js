const { Users, DuelCards, Duels } = require('../dbObjects');

module.exports = {
	name: 'table',
	description: 'Show your duel table.',
	async execute(message, args) {
		const author = message.author;
		user1 = await Users.findByPrimary(author.id);
		if (!user1) user1 = await Users.create({ user_id: author.id, numOfCards: 0});
		if (!user1.inDuel) return message.channel.send(`${author} is not in duel.`);

		// find duel
		duel = await Duels.findOne({
			where: {player1_id: user1.user_id}
		})
		if (!duel) {
			duel = await Duels.findOne({
				where: {player2_id: user1.user_id}
			})
		}

		return message.channel.send(`Image`, {
			files: [`./${duel.id}.jpg`]
		});

	},
};
