import discord
import random
from discord.ext import commands
import re

# RPG commands class
class RPGCommands(commands.Cog, name = 'RPG commands'):

	# class initialization
	def __init__(self, bot):
		self.bot = bot

	# roll dice axccording to the rule, +/-
	@commands.command(name='roll', aliases = ['r'], brief='Simulates rolling dice.', help = 'The command can simulate any dice roll that consists of adding, subtracting or multiplying different dices and positive numbers, e.g. 1d3+2d3-2x2-1d3x2. Use the letter `x` instead of multiplication sign. This is passed as a `rule` argument. The optional `name` argument allows the user to set the title of the roll.')
	async def roll(self, ctx, rule = '1d20', name = None):
		# Split rule into operators and arguments
		operators = ['+', '-', 'x']
		arguments = re.split('|'.join(map(re.escape, operators)), rule)
		operations = [c if c in operators else '' for c in rule]
		operations = list(filter(lambda a: a != '', operations))
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
				l_rolls = []
				l_values = 0
				for i in range(int(amount)):
					l_rolls.append(str(random.choice(range(1, int(dice) + 1))))
					l_values += int(l_rolls[-1])
				rolls.append(l_rolls)
				values.append(l_values)
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
		await ctx.send(('' if name is None else name + ': ') + ' = '.join([response, str(final_sum)]))

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
