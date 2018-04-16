module.exports = {
    name: 'stimulate',
    description: 'Stimulate Pokemon apperances.',
    guildOnly: true,
    execute(message, args) {
    	if (message.author.id === message.guild.ownerID){
            for (i = 0; i<100; i++){
                message.channel.send('Come here!');
            }
        }
    },
};