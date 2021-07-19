import discord
import random
from discord.ext import commands
import re
import yaml

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

	@commands.group(name = 'character', aliases = ['char'], brief = 'Commands for player characters.')
	async def character(self, ctx):
		if ctx.invoked_subcommand is None:
			await ctx.send('Invalid subcommand passed...')

	@character.command(name = 'create', aliases = ['c'], brief = 'Create new character.')
	async def create_new_character(self, ctx, name):
		data = self.get_player_data_from_file(ctx.author.id)
		if name in list(data['characters'].keys()):
			await ctx.send(ctx.author.mention + ', you already have a character with the name: ' + name + '.')
			return
		data['characters'][name] = {'attributes': {}, 'functions': {}}
		if data['current_character'] is None:
			data['current_character'] = name
		self.write_player_data_to_file(ctx.author.id, data)
		await ctx.send('You have created a new character: ' + name)

	@character.command(name = 'list', aliases = ['l'], brief = 'List your characters.')
	async def list_player_characters(self, ctx):
		data = self.get_player_data_from_file(ctx.author.id)
		if not data['characters']:
			await ctx.send(ctx.author.mention + ', you have no characters.')
		else:
			await ctx.send(ctx.author.mention + ', you have the following characters: ' + ', '.join(list(data['characters'].keys())))

	@character.command(name = 'current', aliases = ['curr'], brief = 'Show your current character.')
	async def show_current_character(self, ctx):
		data = self.get_player_data_from_file(ctx.author.id)
		if data['current_character'] is None:
			await ctx.send(ctx.author.mention + ', you have no current character.')
		else:
			e = discord.Embed(title = data['current_character'])
			ch = data['characters'][data['current_character']]
			e.add_field(name = 'Attributes', value = 'None' if not ch['attributes'] else '\n'.join([k + ': ' + str(ch['attributes'][k]) for k in list(ch['attributes'].keys())]))
			e.add_field(name = 'Functions', value = 'None' if not ch['functions'] else '\n'.join(list(ch['functions'].keys())))
			await ctx.send(embed = e)

	@character.command(name = 'select', aliases = ['s'], brief = 'Choose currently used character.')
	async def select_current_character(self, ctx, name):
		data = self.get_player_data_from_file(ctx.author.id)
		if not data['characters']:
			await ctx.send(ctx.author.mention + ', you have no characters.')
		if name in list(data['characters'].keys()):
			data['current_character'] = name
			self.write_player_data_to_file(ctx.author.id, data)
		else:
			await ctx.send(ctx.author.mention + ', you don\'t have character with such name.')

	@character.group(name = 'attribute', aliases = ['att', 'a'], brief = 'Commands for player character\'s attribute')
	async def attribute(self, ctx):
		if ctx.invoked_subcommand is None:
			await ctx.send('Invalid subcommand passed...')

	@attribute.command(name = 'add', aliases = ['a'], brief = 'Add new attribute or change existing.')
	async def add_new_attribute(self, ctx, name, value = 0):
		data = self.get_player_data_from_file(ctx.author.id)
		data['characters'][data['current_character']]['attributes'][name] = int(value)
		self.write_player_data_to_file(ctx.author.id, data)

	@attribute.command(name = 'remove', aliases = ['r'], brief = 'Remove attribute of selected name.')
	async def remove_attribute(self, ctx, name):
		data = self.get_player_data_from_file(ctx.author.id)
		data['characters'][data['current_character']]['attributes'].pop(name, None)
		self.write_player_data_to_file(ctx.author.id, data)

	@attribute.command(name = 'list', aliases = ['l'], brief = 'List all attributes.')
	async def list_attributes(self, ctx):
		data = self.get_player_data_from_file(ctx.author.id)
		if data['current_character'] is None:
			await ctx.send(ctx.author.mention + ', you have no current character.')
		else:
			e = discord.Embed(title = data['current_character'])
			ch = data['characters'][data['current_character']]
			e.add_field(name = 'Attributes', value = 'None' if not ch['attributes'] else '\n'.join([k + ': ' + str(ch['attributes'][k]) for k in list(ch['attributes'].keys())]))
			await ctx.send(embed = e)

	@character.group(name = 'function', aliases = ['f', 'fun'], brief = 'Commands for player character\'s functions.')
	async def function(self, ctx):
		if ctx.invoked_subcommand is None:
			await ctx.send('Invalid subcommand passed...')

	@function.command(name = 'add', aliases = ['a'], brief = 'Add new function.')
	async def add_new_function(self, ctx, name, rule):
		data = self.get_player_data_from_file(ctx.author.id)
		data['characters'][data['current_character']]['functions'][name] = rule
		self.write_player_data_to_file(ctx.author.id, data)

	@function.command(name = 'remove', aliases = ['r'], brief = 'Remove existing function.')
	async def remove_function(self, ctx, name):
		data = self.get_player_data_from_file(ctx.author.id)
		data['characters'][data['current_character']]['functions'].pop(name, None)
		self.write_player_data_to_file(ctx.author.id, data)

	@function.command(name = 'list', aliases = ['l'], brief = 'List all functions.')
	async def list_functions(self, ctx):
		data = self.get_player_data_from_file(ctx.author.id)
		if data['current_character'] is None:
			await ctx.send(ctx.author.mention + ', you have no current character.')
		else:
			e = discord.Embed(title = data['current_character'])
			ch = data['characters'][data['current_character']]
			e.add_field(name = 'Functions', value = 'None' if not ch['functions'] else '\n'.join([k + ': ' + str(ch['functions'][k]) for k in list(ch['functions'].keys())]))
			await ctx.send(embed = e)

	@function.command(name = 'execute', aliases = ['e'], brief = 'Execute the chosen function.')
	async def execute_function(self, ctx, fun):
		data = self.get_player_data_from_file(ctx.author.id)
		ch = data['characters'][data['current_character']]
		try:
			response, final_sum = self.perform_roll(self.change_attributes_in_funtion_to_values(ch['functions'][fun], ch['attributes']))
			await ctx.send(ctx.author.mention + ' ' + fun + ': ' + ' = '.join([response, str(final_sum)]))
		except KeyError:
			await ctx.send('No such function for your character.')

	def change_attributes_in_funtion_to_values(self, rule, attributes):
		arguments = re.split('\\+|\\-|x', rule)
		operations = list(filter(lambda a: a in ['+', '-', 'x'], rule))
		for i in range(len(arguments)):
			if arguments[i] in list(attributes.keys()):
				arguments[i] = str(attributes[arguments[i]])
		return arguments[0] + ''.join([operations[i] + arguments[i+1] for i in range(len(operations))])

	def get_player_data_from_file(self, id):
		try:
			with open('yaml/' + str(id) + '.yaml', 'r') as f:
				data = yaml.load(f, Loader=yaml.SafeLoader)
				if 'rpg' not in list(data.keys()):
					data['rpg'] = {'current_character': None, 'characters': {}}
				return data['rpg']
		except FileNotFoundError:
			data = {'rpg': {'current_character': None, 'characters': {}}}
			with open('yaml/' + str(id) + '.yaml', 'w') as f:
				yaml.dump(data, f)
			return data['rpg']

	def write_player_data_to_file(self, id, new_data):
		data = {}

		with open('yaml/' + str(id) + '.yaml', 'r') as f:
			data = yaml.load(f, Loader=yaml.SafeLoader)
			data['rpg'] = new_data

		with open('yaml/' + str(id) + '.yaml', 'w') as f:
			yaml.dump(data, f)
