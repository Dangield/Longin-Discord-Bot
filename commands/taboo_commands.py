import discord
import random
from discord.ext import tasks, commands
import asyncio

# taboo game class
class TabooGame(object):

	def __init__(self):
		self.teamNames = ['blue', 'red']
		self.teamMembers = [[], []]
		self.turn = 0
		self.roundsPassed = 0
		self.points = [0, 0]
		self.guesser = None
		self.controller = None
		with open('taboo_deck', 'r') as f:
			contents = f.read().split('\n')
			self.deck = [{'title': line.split(':')[0], 'words': line.split(':')[1].split(',')} for line in contents]

	def readyToPlay(self):
		for i in range(2):
			if len(self.teamMembers[i]) == 0:
				return False
		return True

	def addToTeam(self, team, user):
		i = self.teamNames.index(team)
		self.teamMembers[i].append(user)
		if user in self.teamMembers[1-i]:
			self.teamMembers.remove(user)

	def nextRound(self):
		self.turn = 1 - self.turn
		self.roundsPassed += 1

	def generateContestants(self):
		self.hinter = random.choice(self.teamMembers[self.turn])
		self.controller = random.choice(self.teamMembers[1 - self.turn])
		return self.hinter, self.controller

	def reset(self):
		self.turn = 0
		self.roundsPassed = 0
		for i in range(2):
			self.points[i] = 0

	def getCard(self):
		card = random.choice(self.deck)
		return '**' + card['title'] + '**\n' + '\n'.join(card['words'])

	def awardPoint(self):
		self.points[self.turn] += 1

	def deductPoint(self):
		self.points[self.turn] -= 1

	def __repr__(self):
		return 'Rounds passed: ' + str(self.roundsPassed) + '\n' + '\n'.join(['**' + self.teamNames[i].capitalize() + ' team**\nPoints: ' + str(self.points[i]) + '\nMembers: ' + ', '.join([str(m) for m in self.teamMembers[i]]) for i in range(2)])

# commands for taoo game class
class TabooCommands(commands.Cog, name = 'Taboo Commands'):

	def __init__(self, bot):
		self.bot = bot
		self.game = None
		self.roundStarted = False
		self.gameChannel = None

	@commands.group(name = 'taboo', aliases = ['t'], brief = 'Commands for taboo game.')
	async def taboo(self, ctx):
		if ctx.invoked_subcommand is None:
			await ctx.send('Invalid git command passed...')

	@taboo.command(name = 'init', aliases = ['i'], brief = 'Initiate a taboo game.', help = 'Initiate a taboo game. If one already exists a completely newone will be created. Everything will be reset, including teams.')
	async def init(self, ctx):
		if self.roundStarted:
			await ctx.send('You can\'t use this command while taboo round is running.')
			return
		if self.game is not None:
			del self.game
		self.game = TabooGame()
		await ctx.send('Taboo gama initiated. Available teams are: ' + str(self.game.teamNames) + '.')

	@taboo.command(name = 'team', brief = 'Join one of the teams.')
	async def team(self, ctx, teamName):
		if self.roundStarted:
			await ctx.send('You can\'t use this command while taboo round is running.')
			return
		if self.game is None:
			await ctx.send('Initiate the game first!')
			return
		if teamName not in self.game.teamNames:
			await ctx.send(f'There is not such team as {teamName}.')
		else:
			self.game.addToTeam(teamName, ctx.author)
			await ctx.send(f'User {ctx.author} was added to the {teamName} team.')

	@taboo.command(name = 'prepare', aliases = ['prep', 'p'], brief = 'Prepare to start a game.', help = 'Prepare to start a game. Run after assigning people to teams, but before the first round. This command will reset everything apart from team members.')
	async def prepare(self, ctx):
		if self.roundStarted:
			await ctx.send('You can\'t use this command while taboo round is running.')
			return
		if self.game is None:
			await ctx.send('Initiate the game first!')
			return
		if not self.game.readyToPlay():
			await ctx.send('One of the teams has no members. Each team has to have at least one member!')
			return
		self.game.reset()
		self.gameChannel = ctx.channel
		hinter, controller = self.game.generateContestants()
		await ctx.send(f'Taboo game is ready to play. {hinter} from {self.game.teamNames[self.game.turn]} team will be the first hinting. {controller} will be controlling him.')

	@taboo.command(name = 'status', aliases = ['s'], brief = 'Prints the game status.')
	async def status(self, ctx):
		if self.game is None:
			await ctx.send('Initiate the game first!')
			return
		await ctx.send(f'{self.game}')

	@taboo.command(name = 'round_start', aliases = ['start'], brief = 'Start new round.')
	async def start(self, ctx):
		if self.roundStarted:
			await ctx.send('You can\'t use this command while taboo round is running.')
			return
		if self.game is None:
			await ctx.send('Initiate the game first!')
			return
		if not self.game.readyToPlay():
			await ctx.send('One of the teams has no members. Each team has to have at least one member!')
			return
		self.roundStarted = True
		card = self.game.getCard()
		if self.game.hinter.dm_channel is None:
			await self.game.hinter.create_dm()
		await self.game.hinter.dm_channel.send(card)
		if self.game.controller.dm_channel is None:
			await self.game.controller.create_dm()
		await self.game.controller.dm_channel.send(card)
		self.bot.add_listener(self.on_message, name = 'on_message')
		self.round.start()

	async def on_message(self, message):
		print(message.contents)
		if message.channel == self.game.controller.dm_channel:
			if message.contents in ['y', 'yes']:
				self.game.awardPoint()
				card = self.game.getCard()
				await self.game.hinter.dm_channel.send(card)
				await self.game.controller.dm_channel.send(card)
			elif message.contents in ['n', 'no']:
				self.game.deductPoint()
				card = self.game.getCard()
				await self.game.hinter.dm_channel.send(card)
				await self.game.controller.dm_channel.send(card)
		elif message.channel == self.game.hinter.dm_channel:
			if message.contents == ['s', 'skip']:
				card = self.game.getCard()
				await self.game.hinter.dm_channel.send(card)
				await self.game.controller.dm_channel.send(card)

	@tasks.loop(seconds = 60, count = 1)
	async def round(self):
		await asyncio.sleep(60)
		self.bot.remove_listener(self.on_message, name = 'on_message')
		# self.round.after_loop(self.roundEndedText)
		self.roundStarted = False
		self.game.nextRound()
		hinter, controller = self.game.generateContestants()
		await self.gameChannel.send('Round ended.')
		await self.gameChannel.send(f'{self.game}')
		await self.gameChannel.send(f'Next round is ready to play. {hinter} from {self.game.teamNames[self.game.turn]} team will be hinting. {controller} will be controlling him.')

	# async def roundEndedText(self, ctx):
