module.exports = {
	name: 'collect',
	description: 'Basic collector',
	execute(message, args) {
		const filter = m => m.content.includes('discord');
		const collector = message.channel.createMessageCollector(filter, { time: 15000 });

		collector.on('collect', m => {
		    console.log(`Collected ${m.content}`);
		});

		collector.on('end', collected => {
		    console.log(`Collected ${collected.size} items`);
		});
	},
};