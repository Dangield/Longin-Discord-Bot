module.exports = {
	name: 'react-await',
	description: 'Awaots for reactions',
	execute(message, args) {
		message.react('👍').then(() => message.react('👎'));

		const filter = (reaction, user) => {
			return ['👍', '👎'].includes(reaction.emoji.name) && user.id === message.author.id;
		};

		message.awaitReactions(filter, { max: 4, time: 60000, errors: ['time'] })
			.then(collected => {
				const reaction = collected.first();

				if (reaction.emoji.name === '👍') {
					message.reply('you reacted with a thumbs up.');
				}
				else {
					message.reply('you reacted with a thumbs down.');
				}
			})
			.catch(collected => {
				console.log(`After a minute, only ${collected.size} out of 4 reacted.`);
				message.reply('you didn\'t react with neither a thumbs up, nor a thumbs down.');
			});
	},
};