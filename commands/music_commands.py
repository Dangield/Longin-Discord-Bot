import discord
from discord.ext import commands
import youtube_dl
import asyncio
from youtube_search import YoutubeSearch
import yaml

# Music commands class
class MusicCommands(commands.Cog, name = 'Music commands'):

	def __init__(self, bot):
		self.bot = bot
		self.vchannel = None
		self.vclient = None
		self.playlist = []
		self.volume = 1.0
		self.playInLoop = False
		self.ignoreLoop = False

	# play music
	@commands.command(name = 'play', brief = 'Play music from youtube.', help = 'Play music from youtube. Pass an youtube url or a song name.')
	async def play(self, ctx, *, url_or_name):
		# message author is not in voice channel
		if ctx.author.voice is None:
			await ctx.send(ctx.author.mention + ', you are not connected to any voice channel.')
			return

		# url_or_name is a youtube url
		if 'youtube.com' in url_or_name:
			url = url_or_name
		# url_or_name is a song name
		else:
			search_result = YoutubeSearch(url_or_name, max_results=1).to_dict()[0]
			url = 'https://www.youtube.com' + search_result['url_suffix']
			# url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

		# youtubedl options
		ydl = youtube_dl.YoutubeDL({
			'format': 'bestaudio/best',
			'ignoreerrors': True,
			'nocheckcertificate': True,
			'logtostderr': False,
			'quiet': True
		})

		# get song urls from youtube
		info = ydl.extract_info(url, download = False)
		if '_type' in info and info['_type'] == 'playlist':
			entries = info['entries']
		else:
			entries = [info]

		# add songs to playlist
		for e in entries:
			self.playlist.append((e['title'], e['url']))
			await ctx.send(ctx.author.mention + ' added \'' + str(e['title']) + '\' to playlist.')

		# voice client doesn't exist
		if self.vclient is None:
			self.vchannel = ctx.author.voice.channel
			self.vclient = await self.vchannel.connect()

		# voice client exists but is not connected
		if not self.vclient.is_connected():
			self.vchannel = ctx.author.voice.channel
			self.vclient = await self.vchannel.connect()

		# bot was on a different channel before
		if self.vchannel is not ctx.author.voice.channel:
			self.vchannel = ctx.author.voice.channel
			if self.vclient.is_connected():
				await self.vclient.move_to(self.vchannel)
			else:
				self.vclient = await self.vchannel.connect()

		# if not already playing, then play
		if (not self.vclient.is_playing()) and (not self.vclient.is_paused()):
			source = self.playlist[0][1]
			source = discord.FFmpegPCMAudio(source, before_options = '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5')
			self.vclient.play(source, after = self.continue_playlist_after_playing)
			self.vclient.source = discord.PCMVolumeTransformer(self.vclient.source, volume = 1.0)
			self.vclient.source.volume = self.volume

	# stop the music
	@commands.command(name = 'stop', brief = 'Stop the music.')
	async def stop(self, ctx):
		if self.vclient is None:
			return

		self.playInLoop = False
		self.ignoreLoop = False
		if self.vclient.is_playing() or self.vclient.is_paused():
			self.vclient.stop()
			await self.vclient.disconnect()
			self.playlist = []
			return

		if self.vclient.is_connected():
			await self.vclient.disconnect()
			self.playlist = []
			return

		if len(self.playlist) != 0:
			self.playlist = []
			await ctx.send('Playlist purged.')
		else:
			await ctx.send('The music is not playing or paused.')

	# pause the music
	@commands.command(name = 'pause', brief = 'Pause the music.')
	async def pause(self, ctx):
		if self.vclient is None:
			return

		if self.vclient.is_playing():
			self.vclient.pause()
			return

		await ctx.send('The music is not playing.')

	# resume the music
	@commands.command(name = 'resume', brief = 'Resume paused music.')
	async def resume(self, ctx):
		if self.vclient is None:
			return

		if self.vclient.is_paused():
			self.vclient.resume()
			return
		elif len(self.playlist) != 0:
			source = self.playlist[0][1]
			source = discord.FFmpegPCMAudio(source, before_options = '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5')
			self.vclient.play(source, after = self.continue_playlist_after_playing)
			self.vclient.source = discord.PCMVolumeTransformer(self.vclient.source, volume = 1.0)
			self.vclient.source.volume = self.volume
			return

		await ctx.send('The music is not paused.')

	# play next song in playlist
	@commands.command(name = 'next', aliases = ['n'], brief = 'Play next song on playlist.')
	async def next(self, ctx):
		if self.vclient is None:
			await ctx.send('The music is not playing.')
			return

		if self.playInLoop:
			self.ignoreLoop = True
		if self.vclient.is_playing():
			self.vclient.stop()
			return
		elif self.vclient.is_paused():
			self.vclient.stop()
			counter = 0
			while (not self.vclient.is_playing()):
				counter += 1
				if counter == 1000000:
					return
			self.vclient.pause()
			return

		await ctx.send('The music is not playing.')

	# display playlist
	@commands.command(name = 'playlist', aliases = ['pl'], brief = 'Displays current playlist.')
	async def playlist(self, ctx):
		if len(self.playlist) == 0:
			await ctx.send('Nothing to see here.')
			return

		entries = min(20, len(self.playlist))
		await ctx.send('Current playlist' + (' (20 first entries)' if entries == 20 else '') + ':\n' + '\n'.join([str(i+1) + '. ' + self.playlist[i][0] for i in range(entries)]))

	# change the volume
	@commands.command(name = 'volume', aliases = ['vol'], brief = 'Changes the volume. Pass no argument to read the current volume.')
	async def volume(self, ctx, value = None):
		if value is None:
			await ctx.send('Current volume: ' + str(self.volume*100) + '%')
		else:
			try:
				self.volume = max(0.0, min(1.0, int(value)/100))
				if self.vclient is not None:
					self.vclient.source.volume = self.volume
				await ctx.send('Volume set to: ' + str(self.volume*100) + '%')
			except ValueError:
				await ctx.send('Function argument should be an integer betwen 0 and 100.')

	def continue_playlist_after_playing(self, error):
		if len(self.playlist) == 1 and (not self.playInLoop or self.ignoreLoop):
			self.ignoreLoop = False
			self.playInLoop = False
			self.playlist = []
			self.vclient.stop()
			coro = self.vclient.disconnect()
			fut = asyncio.run_coroutine_threadsafe(coro, self.vclient.loop)
			fut.result()
		elif len(self.playlist) is 0:
			return
		else:
			if (not self.playInLoop) or self.ignoreLoop:
				del self.playlist[0]
				self.ignoreLoop = False
			source = self.playlist[0][1]
			source = discord.FFmpegPCMAudio(source, before_options = '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5')
			self.vclient.play(source, after = self.continue_playlist_after_playing)
			self.vclient.source = discord.PCMVolumeTransformer(self.vclient.source, volume = 1.0)
			self.vclient.source.volume = self.volume

	@commands.command(name = 'skip', brief = 'Skip some of the songs in playlist.')
	async def skip(self, ctx, amount: int):
		if amount <= 0:
			await ctx.send('\'Amount\' paremeter must be positive.')
			return
		if amount > len(self.playlist):
			await self.stop(ctx)
		else:
			for i in range(amount):
				await self.next(ctx)
				counter = 0
				while(not self.vclient.is_playing()):
					counter += 1
					if counter == 1000000:
						break

	@commands.command(name = 'loop', brief = 'Play the current song on loop.')
	async def loop(self, ctx):
		self.playInLoop = not self.playInLoop
		if self.playInLoop:
			await ctx.send('Loop enabled.')
		else:
			await ctx.send('Loop disabled.')

	@commands.group(name='favourites', aliases=['fav'], brief='Save list of favourite music links.')
	async def favourites(self, ctx):
		if ctx.invoked_subcommand is None:
			await ctx.send('Invalid subcommand passed...')

	@favourites.command(name = 'add', aliases = ['a'], brief = 'Find song and add it to favourites.')
	async def add_song_to_favourites(self, ctx, *, songname_or_url):
		data = self.get_player_data_from_file(ctx.author.id)

		if 'youtube.com' in songname_or_url:
			data['favourites'].append({'name': 'Song' + str(len(data['favourites'])), 'url': songname_or_url})
		else:
			search_result = YoutubeSearch(songname, max_results=1).to_dict()[0]
			data['favourites'].append({'name': songname, 'url': 'https://www.youtube.com' + search_result['url_suffix']})

		self.write_player_data_to_file(ctx.author.id, data)

	@favourites.command(name = 'remove', aliases = ['r'], brief = 'Remove song from favourites by index number or name.')
	async def remove_song_from_favourites(self, ctx, *, id_or_songname):
		data = self.get_player_data_from_file(ctx.author.id)

		try:
			index = int(id_or_songname)
		except ValueError:
			try:
				index = [song['name'] for song in data['favourites']].index(id_or_songname)
			except ValueError:
				index = -1

		if index < 0 or index >= len(data['favourites']):
			await ctx.send('Wrong song name or id.')
		else:
			data['favourites'].pop(index)

		self.write_player_data_to_file(ctx.author.id, data)

	@favourites.command(name = 'rename', aliases = ['n'], brief = 'Rename the song in your favourites.')
	async def rename_song_in_favourites(self, ctx, song_index, *, new_name):
		data = self.get_player_data_from_file(ctx.author.id)

		try:
			index = int(song_index)
		except ValueError:
			index = -1

		if index < 0 or index >= len(data['favourites']):
			await ctx.send('You must pass a valid song id.')
		else:
			data['favourites'][index]['name'] = new_name

		self.write_player_data_to_file(ctx.author.id, data)

	@favourites.command(name = 'list', aliases = ['l'], brief = 'List your favourite songs.')
	async def list_favourite_songs(self, ctx):
		data = self.get_player_data_from_file(ctx.author.id)

		e = discord.Embed(title = ctx.author.name + '\'s favourite songs')
		songs = data['favourites']
		e.add_field(name = 'Id', value = '\n'.join([str(i) for i in range(len(songs))]))
		e.add_field(name = 'Song', value = '\n'.join([song['name'] for song in songs]))
		e.add_field(name = 'Url', value = '\n'.join([song['url'] for song in songs]))
		await ctx.send(embed = e)

	@favourites.command(name = 'play', aliases = ['p'], brief = 'Play song from your favourites.')
	async def play_song_from_favourites(self, ctx, *, id_or_songname):
		data = self.get_player_data_from_file(ctx.author.id)

		try:
			index = int(id_or_songname)
		except ValueError:
			try:
				index = [song['name'] for song in data['favourites']].index(id_or_songname)
			except ValueError:
				index = -1

		if index < 0 or index >= len(data['favourites']):
			await ctx.send('Wrong song name or id.')
		else:
			await self.play(ctx, url_or_name = data['favourites'][index]['url'])

	def get_player_data_from_file(self, id):
		try:
			with open('yaml/' + str(id) + '.yaml', 'r') as f:
				data = yaml.load(f, Loader=yaml.SafeLoader)
				if 'music' not in list(data.keys()):
					data['music'] = {'favourites': []}
				return data['music']
		except FileNotFoundError:
			data = {'music': {'favourites': []}}
			with open('yaml/' + str(id) + '.yaml', 'w') as f:
				yaml.dump(data, f)
			return data['music']

	def write_player_data_to_file(self, id, new_data):
		data = {}

		with open('yaml/' + str(id) + '.yaml', 'r') as f:
			data = yaml.load(f, Loader=yaml.SafeLoader)
			data['music'] = new_data

		with open('yaml/' + str(id) + '.yaml', 'w') as f:
			yaml.dump(data, f)
