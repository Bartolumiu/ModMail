import Command from '../lib/structures/Command';
import MessageEmbed from '../lib/structures/MessageEmbed';
import ms from 'ms';
import { COLORS } from '../Constants';

export default new Command('close', async (caller, cmd, log, config) => {
	if (cmd.args[0]) {
		const delay = ms(cmd.args[0]);
		// No date, regular close with reason.
		if (!delay)
			return caller.utils.misc.closeThread(log!, config, cmd, cmd.args.join(' '));
		if (delay < 600000 || delay > 259200000)
			return caller.utils.discord.createMessage(cmd.channel.id, caller.lang.commands.close.invalidTime);

		const closureDate = new Date(Date.now() + delay);
		const closerUpdated = await caller.db.updateLog(log!._id, 'closer', {
			id: cmd.msg.author.id,
			username: cmd.msg.author.username,
			discriminator: cmd.msg.author.discriminator,
			avatarURL: cmd.msg.author.dynamicAvatarURL()
		});
		if (!closerUpdated)
			return caller.utils.discord.createMessage(cmd.channel.id, caller.lang.commands.close.closerUpdateError);

		const delayed = await caller.db.updateLog(log!._id, 'scheduledClosure', closureDate);
		if (!delayed)
			return caller.utils.discord.createMessage(cmd.channel.id, caller.lang.commands.close.closerUpdateError);

		if (cmd.args[1]) {
			const messageUpdated = await caller.db.updateLog(log!._id, 'closureMessage', cmd.args.slice(1).join(' '));
			if (!messageUpdated)
				return caller.utils.discord.createMessage(cmd.channel.id, caller.lang.commands.close.closerError);
		}

		const confirmationEmbed = new MessageEmbed()
			.setTitle(caller.lang.commands.close.title)
			.setDescription(caller.lang.commands.close.description.replace('%s', closureDate.toDateString()))
			.setColor(COLORS.LIGHT_BLUE);
		return caller.utils.discord.createMessage(cmd.channel.id, { embed: confirmationEmbed.code });
	}
	else
		await caller.utils.misc.closeThread(log!, config, cmd);
},
{
	level: 'SUPPORT',
	threadOnly: true,
	aliases: ['c']
});
