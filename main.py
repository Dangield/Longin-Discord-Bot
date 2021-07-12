#!/usr/bin/env python3
import os
import discord
import random
from dotenv import load_dotenv
from discord.ext import commands
from commands.test_commands import *
from commands.rpg_commands import *
from commands.music_commands import *
from commands.taboo_commands import *
import time

# get enviromental values
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')
GUILD = os.getenv('DISCORD_GUILD')

# bot class
class Bot(commands.Bot):
	# startup
	async def on_ready(self):
		print(f'{self.user} has connected to Discord!')
		guild = discord.utils.find(lambda g: g.name == GUILD, self.guilds)
		print(
			f'{self.user} is connected to the following guild:\n'
			f'{guild.name}(id: {guild.id})'
		)

		members = ', '.join([member.name for member in guild.members])
		print(f'Guild Members:\n{members}')

		with open('err.log', 'a') as f:
			f.write('\nSesstion start: ' + time.asctime() + '\n')
		with open('cmd.log', 'a') as f:
			f.write('\nSesstion start: ' + time.asctime() + '\n')

	# log every command being ran
	async def on_command(self, ctx):
		text = ' '.join([time.asctime(), ': ', str(ctx.author), ' called: ', str(ctx.message.content), '\n'])
		print(text)
		with open('cmd.log', 'a') as f:
			f.write(text)

	# catch event error
	async def on_error(self, event, *args, **kwargs):
		with open('err.log', 'a') as f:
			f.write(f'{time.asctime()}: Event \'{event}\' error: {args[0]}\n')

	# catch command error
	async def on_command_error(self, ctx, error):
		with open('err.log', 'a') as f:
			f.write(f'{time.asctime()}: Command \'{ctx.message.content}\' error: {error}\n')
		if isinstance(error, commands.errors.CheckFailure):
			await ctx.send('You probably do not have the correct role for this command, do you?.')
		else:
			await ctx.send(str(error))

	# new member join
	async def on_member_join(self, member):
		await member.create_dm()
		await member.dm_channel.send(
			f'Hi {member.name}, welcome to Daniel Giełdowski\'s server!'
		)

# initialization of intents
intents = discord.Intents.default()
intents.members = True
# initialization of activity
activity = discord.Game(name = '?help')
# initialization of bot
bot = Bot(command_prefix = '?', intents = intents, activity = activity)
# add categories
bot.add_cog(TestCommands(bot))
bot.add_cog(RPGCommands(bot))
bot.add_cog(MusicCommands(bot))
bot.add_cog(TabooCommands(bot))
# add no category commands
# @bot.command(name='create-channel', help = 'Creates a new text channel with specified name')
# @commands.is_owner()
# async def create_channel(ctx, channel_name='real-python'):
# 	guild = ctx.guild
# 	existing_channel = discord.utils.get(guild.channels, name=channel_name)
# 	if not existing_channel:
# 		print(f'Creating a new channel: {channel_name}')
# 		await guild.create_text_channel(channel_name)	# delete previous message
@bot.command(name = 'del', help = 'delete set aomount of previous messages (admin only)')
@commands.has_permissions(administrator=True)
async def delete_previous_message(ctx, a = '1'):
	await ctx.message.channel.purge(limit = int(a)+1)
# run bot
bot.run(TOKEN)
