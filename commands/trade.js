const { Users, CardCompendium } = require('../dbObjects');

module.exports = {
	name: 'trade',
	description: 'Trade/give card to another user.',
	args: true,
	usage: '[user_mention] [your_card_name] | [his_card_name]',
	async execute(message, args) {
		const author = message.author;
		user1 = await Users.findByPrimary(author.id);
		if (!user1) user1 = await Users.create({ user_id: author.id, numOfCards: 0});

		const target = message.mentions.users.first();
		if (!target) return  message.channel.send('No user mentioned!')
		user2 = await Users.findByPrimary(target.id);
		if (!user2) user2 = await Users.create({ user_id: target.id, numOfCards: 0});

		cardNames = args;
		cardNames.shift();
		cardNames = cardNames.join(' ');
		[cardName1, cardName2] = cardNames.split(' | ');

		const card1 = await CardCompendium.findOne({ where: { name: cardName1 } });
		if (!card1) return message.channel.send(`There is no such card as ${cardName1}!`);
		if (!await user1.hasCard(card1)) return message.channel.send(`You don't have ${cardName1} card!`);

		const card2 = await CardCompendium.findOne({ where: { name: cardName2 } });
		if (cardName2){
			if (!card2) return message.channel.send(`There is no such card as ${cardName2}!`);
			if (!await user2.hasCard(card2)) return message.channel.send(`${target.username} don't have ${cardName2} card!`);
		}

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
		    if (reason === 'time') return message.channel.send(`Time's up!`);
		    if (reason === 'matchesLimit') {
		    	message.channel.send(`Received confirmation from ${target.username}`)

		    	user1.removeCard(card1);
		    	user2.addCard(card1)
		    	if (cardName2) {
		    		user2.removeCard(card2);
		    		user1.addCard(card2);
		    	} else {
		    		user1.numOfCards -= 1;
		    		user2.numOfCards += 1;
		    		user1.save();
		    		user2.save();
		    	}

		    	return message.channel.send('Trade succesfull!');
		    }
		});
	},
};
