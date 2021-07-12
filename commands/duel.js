const { Users, CardCompendium, Duels } = require('../dbObjects');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
	name: 'duel',
	description: 'Duel with another user.',
	args: true,
	usage: '[user_mention]',
	async execute(message, args) {
		const author = message.author;
		user1 = await Users.findByPrimary(author.id);
		if (!user1) user1 = await Users.create({ user_id: author.id, numOfCards: 0});
		if (user1.cardsInDeck != 4) return message.channel.send(`${author} has to have exactly 4 cards in his/her deck! Duel was cancelled.`);

		const target = message.mentions.users.first();
		if (!target) return  message.channel.send('No user mentioned!')
		user2 = await Users.findByPrimary(target.id);
		if (!user2) user2 = await Users.create({ user_id: target.id, numOfCards: 0});

		// Disabled for tests
		// if (user1.user_id === user2.user_id) return message.channel.send('You can\'t fight with yourself!')
		// if (user1.inDuel) return message.channel.send('You already are in a duel. End it to start another.')
		// if (user2.inDuel) return message.channel.send(`${target} already is in a duel. He must end it to start another.`)

		message.channel.send(`Awaiting confirmation from ${target} in less than 30 seconds (type \'?yes\').`);
		const filter = m => {
			return m.content.toLowerCase() === '?yes' && m.author.id === target.id;
		};
		const collector = message.channel.createMessageCollector(filter, { maxMatches: 1, time: 30000 });
		collector.on('collect', m => {
		    console.log(`Collected ${m.content} from ${m.author.tag}`);
		});

		collector.on('end', (collected, reason) => {
		    console.log(`Collected ${collected.size} items, ended because of ${reason}`);
		    if (reason === 'time') return message.channel.send(`Time's up! Duel wasn't accepted`);
		    if (reason === 'matchesLimit') {
		    	message.channel.send(`Received confirmation from ${target}`)
		    };
		});
		
		if (user2.cardsInDeck != 4) return message.channel.send(`${target} has to have exactly 4 cards in his/her deck! Duel was cancelled.`);

		// create duel object
		duel = await Duels.create({player1_id: user1.user_id, player2_id: user2.user_id});
		user1.setDuel(true);
		user2.setDuel(true);
		str = 'montage ';
		for (i = 0; i < 16; i++) {
			str += 'img/back.jpg ';
		}
		str += `-tile 4x4 -geometry +1+1 img/duels/${duel.id}.jpg`;
		const { stdout, stderr } = await exec(str);
		duel.table = `img/duels/${duel.id}.jpg`;
		duel.save()

		// get current decks
		const deck1 = await user1.getDeck();
		const deck2 = await user2.getDeck();

		// add cards from decks to duel
		for (i in deck1){
			for (j = 0; j < deck1[i].inDeck; j++) {
				user1.addCardToDuel(deck1[i].card);
			}
		}
		for (i in deck2){
			for (j = 0; j < deck2[i].inDeck; j++) {
				user2.addCardToDuel(deck2[i].card);
			}
		}

		return false;
		// console printing
		const cards1 = [];
		for (i in deck1){
			for (j = 0; j < deck1[i].inDeck; j++){
				cards1.push(new Map().set('name', `${deck1[i].card.name}`).set('body', `${deck1[i].card.body}`).set('mind', `${deck1[i].card.mind}`).set('flair', `${deck1[i].card.flair}`).set('charm', `${deck1[i].card.charm}`).set('used', false))
			}
		}
		console.log(`${cards1}`);
		for (i in cards1) {
			console.log(`${cards1[i].get('name')} ${cards1[i].get('body')} ${cards1[i].get('mind')} ${cards1[i].get('flair')} ${cards1[i].get('charm')} ${cards1[i].get('used')}`)
		}

		const cards2 = [];
		for (i in deck1){
			for (j = 0; j < deck2[i].inDeck; j++){
				cards2.push(new Map().set('name', `${deck2[i].card.name}`).set('body', `${deck2[i].card.body}`).set('mind', `${deck2[i].card.mind}`).set('flair', `${deck2[i].card.flair}`).set('charm', `${deck2[i].card.charm}`).set('used', false))
			}
		}
		console.log(`${cards2}`);
		for (i in cards2) {
			console.log(`${cards2[i].get('name')} ${cards2[i].get('body')} ${cards2[i].get('mind')} ${cards2[i].get('flair')} ${cards2[i].get('charm')} ${cards2[i].get('used')}`)
		}
	},
};
