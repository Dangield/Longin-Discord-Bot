var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    bot.setPresence({
        idle_since: null,
        game: {
            name: '?help'
        }
    })
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '?') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // ping
            case 'help':
                bot.sendMessage({
                    to: channelID,
                    message: 'help - show this message\nping - pong\nhello - hello there, General Kenobi'
                })
                break;
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;
            // hello
            case 'hello':
                bot.sendMessage({
                    to: channelID,
                    message: 'Hello <@!' + userID + '>!'
                });
                break;
            // tested command
            case 'debug1':
                bot.sendMessage({
                    to: channelID,
                    message: user,
                    embed: {
                        title: "Test",
                        color: 1752220,
                        description: "blabla",
                        footer: {
                            text: "xxx"
                        },
                        author: {
                            name: user
                        },
                        fields: [
                            {
                                name: user,
                                value: 'ggg'
                            }
                        ]
                    }
                })
                break;
            case 'debug2':
                var server = bot.servers
                logger.info(JSON.stringify(server, null, 4))
                break;
            break;
         }
     }
});
