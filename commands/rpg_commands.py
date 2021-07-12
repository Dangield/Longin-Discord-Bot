import discord
import random
from discord.ext import commands
import re

# RPG commands class
class RPGCommands(commands.Cog, name = 'RPG commands'):

	# class initialization
	def __init__(self, bot):
		self.bot = bot

	def perform_roll(self, rule):
		# Split rule into operations and arguments
		arguments = re.split('\\+|\\-|x', rule)
		operations = list(filter(lambda a: a in ['+', '-', 'x'], rule))
		# Init lists
		rolls = []
		values = []
		# Perform dice rolls
		for arg in arguments:
			if 'd' in arg:
				if arg[0] == 'd':
					amount = '1'
					dice = arg[1:]
				else:
					[amount, dice] = arg.split('d')
				if dice is '':
					dice = 20
				rolls.append([str(random.choice(range(1, int(dice) + 1))) for i in range(int(amount))])
				values.append(sum([int(roll) for roll in rolls[-1]]))
			else:
				rolls.append(None)
				values.append(int(arg))
		# Create partial response
		response = (arguments[0] if rolls[0] is None else ''.join([arguments[0], '(', ','.join(rolls[0]), ')'])) + ''.join([''.join([operations[i], arguments[i+1]]) if rolls[i+1] is None else ''.join([operations[i], arguments[i+1], '(', ','.join(rolls[i+1]), ')']) for i in range(len(operations))])
		# Resolve multiplying
		while 'x' in operations:
			i = operations.index('x')
			values[i] = values[i] * values[i+1]
			operations.remove('x')
			del values[i+1]
		final_sum = sum([values[0]] + [values[i+1] if operations[i] is '+' else -values[i+1] for i in range(len(operations))])
		return response, final_sum

	# roll dice according to the rule, +/-/x
	@commands.command(name='roll', aliases = ['r'], brief='Simulates rolling dice.', help = 'The command can simulate any dice roll that consists of adding, subtracting or multiplying different dices and positive numbers, e.g. 1d3+2d3-2x2-1d3x2. Use the letter `x` instead of multiplication sign. This is passed as a `rule` argument. The optional `name` argument allows the user to set the title of the roll.')
	async def roll(self, ctx, rule = '1d20', *, name = None):
		response, final_sum = self.perform_roll(rule)
		await ctx.send(ctx.author.mention + ('' if name is None else ' ' + name) + ': ' + ' = '.join([response, str(final_sum)]))

	# roll the same dice multiple times
	@commands.command(name='multiroll', aliases = ['rr'], brief = 'Simulates rolling the same dice set amount of times.', help = 'Makes the same dice roll multiple times. First argument `amount` is the number of rolls to do. Second is `rule` argument is the actual roll to be made (see roll command). At the end you may set the roll\'s `name` (optional).')
	async def multiroll(self, ctx, amount = '2', rule = '1d20', *, name = None):
		full_response = ctx.author.mention + ('' if name is None else ' ' + name) + ':'
		try:
			if int(amount) > 30:
				raise ValueError
			for i in range(int(amount)):
				response, final_sum = self.perform_roll(rule)
				full_response += '\n' + ' = '.join([response, str(final_sum)])
			await ctx.send(full_response)
		except ValueError:
			await ctx.send(ctx.author.mention + ', you can\'t perform more than 30 rolls in one multiroll.')

	# roll classical dnd stats
	@commands.command(name='dnd_stats', aliases = ['dnds'], help='Rolls statistics for dnd character in classical way.')
	async def roll_dnd_stats(self, ctx):
		response = ''
		for _ in range(6):
			rolls = [random.choice(range(1, 7)) for _ in range(4)]
			minimum = min(rolls)
			rolls.remove(minimum)
			rolls.sort()
			rolls.reverse()
			response += '[' + ','.join([str(roll) for roll in rolls]) + ',~~' + str(minimum) + '~~]: ' + str(sum(rolls)) + '\n'
		await ctx.send(response[0:-1])
