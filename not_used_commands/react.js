module.exports = {
	name: 'react',
	description: 'Reacts to sent message',
	execute(message, args) {
	    message.react('😄');
	    message.react('🤠');
	},
};