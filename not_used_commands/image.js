const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
	name: 'image',
	description: 'image',
	async execute(message, args) {
		const { stdout, stderr } = await exec('montage 4.jpg 4.jpg -tile 1x2 -geometry +1+1 out.jpg');
		console.log(`stdout: ${stdout}`);
		console.error(`stderr: ${stderr}`);
		return message.channel.send(`Image`, {
			files: ["./out.jpg"]
		});
	},
};
