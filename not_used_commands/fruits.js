module.exports = {
	name: 'fruits',
	description: 'Reacts to sent message',
	execute(message, args) {
		message.react('🍎')
			.then(() => message.react('🍊'))
			.then(() => message.react('🍇'))
			.catch(() => console.error('One of the emojis failed to react.'));
	},
};