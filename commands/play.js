const { Users, CardCompendium, DuelCards, Duels } = require('../dbObjects');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
	name: 'play',
	description: 'Play a card in duel.',
	args: true,
	usage: '[card_name] [row(1-4)] [column(1-4)]',
	guildOnly: true,
	async execute(message, args) {
		const author = message.author;
		user = await Users.findByPrimary(author.id);
		if (!user) user = await Users.create({ user_id: author.id, numOfCards: 0});
		if (!user.inDuel) return message.channel.send(`${author} is not in duel.`);

		// find cards
		cards = await user.getAvailableDuelCards();
		if(!cards) return message.channel.send(`You have already played all your cards.`)

		// get duel
		duel = await Duels.findOne({
			where: {player1_id: user.user_id}
		})
		if (!duel) {
			duel = await Duels.findOne({
				where: {player2_id: user.user_id}
			})
		}
		if (!duel) return message.channel.send('Your duel is missing.');

		if ((user.user_id === duel.player1_id && duel.turn === false) || (user.user_id === duel.player2_id && duel.turn === true)) {
			// decode arguments
			l = args.length;
			if (l < 3) return channel.message.send(`Not enough arguments provided.`);
			cardName = args;
			c = cardName.pop();
			r = cardName.pop();
			cardName = cardName.join(' ');
			const card = await CardCompendium.findOne({ where: { name: cardName } });
			if(!card) return message.channel.send(`There is no such card`);
			if (isNaN(c) || c < 1 || c > 4) return message.channel.send(`Wrong column number provided.`);
			if (isNaN(r) || r < 1 || r > 4) return message.channel.send(`Wrong row number provided.`);
			result = await user.playCard(duel,card,r,c);
			if (!result) return message.channel.send(`You don't have this card on hand or can't place a card here.`);

			// update table
			table = ['img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg','img/back.jpg'];
			p1 = await Users.findByPrimary(duel.player1_id);
			p2 = await Users.findByPrimary(duel.player2_id);
			p1Cards = await p1.getDuelCards();
			p2Cards = await p2.getDuelCards();
			for (i in p1Cards) {
				if (p1Cards[i].posX != 0 && p1Cards[i].posY != 0) {
					name = p1Cards[i].card.name.split(' ').join('_').toLowerCase();
					table[(p1Cards[i].posX-1)*4+p1Cards[i].posY-1] = 'img/attacker_' + name + '.jpg';
				}
				if (p2Cards[i].posX != 0 && p2Cards[i].posY != 0) {
					name = p2Cards[i].card.name.split(' ').join('_').toLowerCase();
					table[(p2Cards[i].posX-1)*4+p2Cards[i].posY-1] = 'img/defender_' + name + '.jpg';
				}
			}

			str = `montage ${table.join(' ')} -tile 4x4 -geometry +1+1 ${duel.table}`;
			const { stdout, stderr } = await exec(str);

			// check if the duel is ended and calculate points or change turn
			p1Av = await p1.getAvailableDuelCards();
			p2Av = await p2.getAvailableDuelCards();
			if (!p1Av.length && !p2Av.length) {
				msg = 'The match has ended. '
				// players = message.guild.members.array();
				// console.log(players);
				// player1 = await players.findOne({
				// 	where: {user: duel.player1_id}
				// })
				// player2 = await players.findOne({
				// 	where: {user: duel.player2_id}
				// })
				// points = duel.calculatePoints();
				// if (points[0] > points[1]) {
				// 	msg += `${player1.user} has won with ${player2.user}: ${points[0]}:${points[1]}`;
				// } else if (points[0] < points[1]) {
				// 	msg += `${player2.user} has won with ${player1.user}: ${points[1]}:${points[0]}`;
				// } else {
				// 	msg += `${player1.user} has a draw with ${player2.user}: ${points[0]}:${points[1]}`;
				// }
				await p1.removeCardsFromDuel();
				await p2.removeCardsFromDuel();
				duel.destroy();
				p1.setDuel(0);
				p2.setDuel(0);
			} else {
				msg = ''
				duel.turn = !duel.turn;
				duel.save();
			}

			// send table
			return message.channel.send(msg,{
				files: [`./${duel.table}`]
			});

		} else {
			return message.channel.send(`It's not your turn, ${author}!`)
		}
	},
};
