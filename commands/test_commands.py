import discord
import random
from discord.ext import commands
import youtube_dl
import time
# import os
# from os import system

# test commands class
class TestCommands(commands.Cog, name = 'Test commands'):

	# class initialization
	def __init__(self, bot):
		self.bot = bot
		self._last_member = None
		self.voice = None

	# say hello
	@commands.command(name = 'hello', help = 'Say hello.')
	async def hello(self, ctx, *, member: discord.Member = None):
		member = member or ctx.author
		if self._last_member is None or self._last_member.id != member.id:
			await ctx.send('Hello {0.name}~'.format(member))
		else:
			await ctx.send('Hello {0.name}... This feels familiar.'.format(member))
		self._last_member = member

	# 99 quote
	@commands.command(name='99', help='Responds with a random quote from Brooklyn 99.')
	async def nine_nine(self, ctx):
		brooklyn_99_quotes = [
			'I\'m the human form of the 💯 emoji.',
			'Bingpot!',
			(
				'Cool. Cool cool cool cool cool cool cool, '
				'no doubt no doubt no doubt no doubt.'
			),
		]

		response = random.choice(brooklyn_99_quotes)
		await ctx.send(response)

	# roll dice
	@commands.command(name='roll_dice', help='Simulates rolling dice.')
	async def roll(self, ctx, number_of_dice: int, number_of_sides: int):
		dice = [
			str(random.choice(range(1, number_of_sides + 1)))
			for _ in range(number_of_dice)
		]
		await ctx.send(', '.join(dice))

	# rick-roll
	@commands.command(name = 'rick', help = 'roll')
	async def rick_roll(self, ctx):
		self.voice = await ctx.author.voice.channel.connect()

		# song_there = os.path.isfile("song.mp3")
		# try:
		# 	if song_there:
		# 		os.remove("song.mp3")
		# except PermissionError:
		# 	return
		# ydl_opts = {
		# 	'format': 'bestaudio/best',
		# 	'postprocessors': [{
		# 		'key': 'FFmpegExtractAudio',
		# 		'preferredcodec': 'mp3',
		# 		'preferredquality': '192',
		# 	}],
		# }
		# with youtube_dl.YoutubeDL(ydl_opts) as ydl:
		# 	ydl.download(['https://www.youtube.com/watch?v=dQw4w9WgXcQ'])
		# for file in os.listdir("./"):
		# 	if file.endswith(".mp3"):
		# 		os.rename(file, 'song.mp3')
		# voice.play(discord.FFmpegPCMAudio("song.mp3"))

		url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
		ydl = youtube_dl.YoutubeDL({
			'format': 'bestaudio/best',
			'ignoreerrors': True,
			'nocheckcertificate': True,
			'logtostderr': False,
			'quiet': True
		})
		info = ydl.extract_info(url, download=False)
		if '_type' in info and info['_type'] == 'playlist':
			entries = info['entries']
		else:
			entries = [info]
		# results = [(e['title'], e['url']) for e in entries]
		# title, source = results[0]
		results = [e['url'] for e in entries]
		source = results[0]
		print(source)
		source = discord.FFmpegPCMAudio(source)
		self.voice.play(source)
		self.voice.volume = 100
		time.sleep(5)
		self.voice.stop()
		await self.voice.disconnect()
