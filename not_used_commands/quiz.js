module.exports = {
	name: 'quiz',
	description: 'Quiz',
	execute(message, args) {
		// const quiz = require('./quiz.json');
		const quiz = 
			[
			    {
			        "question": "What colour is the sky?",
			        "answers": ["blue"]
			    },
			    {
			        "question": "How many letters are there in the alphabet?",
			        "answers": ["26", "twenty-six", "twenty six", "twentysix"]
			    }
			]
		const item = quiz[Math.floor(Math.random() * quiz.length)];
		const filter = response => {
		    return item.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase());
		};

		message.channel.send(item.question).then(() => {
		    message.channel.awaitMessages(filter, { maxMatches: 1, time: 30000, errors: ['time'] })
		        .then(collected => {
		            message.channel.send(`${collected.first().author} got the correct answer!`);
		        })
		        .catch(collected => {
		            message.channel.send('Looks like nobody got the answer this time.');
		        });
		});
	},
};