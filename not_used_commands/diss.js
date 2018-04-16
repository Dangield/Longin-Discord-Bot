module.exports = {
    name: 'diss',
    description: 'Diss your enemies.',
    cooldown: 10,
    args: true,
    usage: '[user_mention]',
    guildOnly: true,
    execute(message, args) {
		const data = [];
		const taggedUser = message.mentions.users.first();
        if (taggedUser.id === message.author.id){
            return message.reply("You can't diss yourself!");
        }
    	if (taggedUser.id === message.guild.ownerID){
    		data.push(`${message.author}`);
    	} else {
    		data.push(`${taggedUser}`);
    	}
    	data.push(":middle_finger:");
        message.channel.send(data);
    },
};