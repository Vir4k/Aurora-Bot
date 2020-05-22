/** 
 * @author ZYROUGE
 * @license MIT
*/

const path = require('path');
const Command = require(path.resolve(`src`, `base`, `Command`));
const CaseHandler = require(path.resolve(`src`, `core`, `Creators`, `Case`));

class _Command extends Command {
    constructor (client) {
        super(client, {
            name: "unmute",
            description: "Unmute a Member in a Guild.",
            usage: "<user> -r [reason]",
            guildOnly: true,
            aliases: ["umu", "unm"],
            permission: {
                bot: ["manageRoles", "embedLinks"],
                user: ["manageMessages"]
            },
            args: [
                { name: `user`, type: String, defaultOption: true },
                { name: `reason`, alias: `r`, type: String, multiple: true, defaultValue: [ `No reason was provided` ] }
            ],
            enabled: true
        });
    }

    async run(message, args) {
        const responder = new this.client.responder(message.channel);
        try {
            /* Check args */
            if(!args.user) {
                const embed = this.client.embeds.error();
                embed.description = `${this.client.emojis.cross} No User **Mention** (or) **ID** was found!`;
                return responder.send({ embed: embed });
            }
            const argsMute = args.user;
            const toBeMuted = await this.client.parseMention(argsMute) || false;
            const member = message.channel.guild.members.get(toBeMuted) || false;
            if(!toBeMuted || !member) {
                const embed = this.client.embeds.error();
                embed.description = `${this.client.emojis.cross} No User was found with \`${argsMute}\``;
                return responder.send({ embed: embed });
            }

            /* Check if Mod */
            if(member && member.isModerator()) {
                const embed = this.client.embeds.error();
                embed.description = `${this.client.emojis.cross} **${tag}** is a Moderator!`;
                return responder.send({ embed: embed });
            }

            /* Check if Admin */
            if(member && member.isAdministrator()) {
                const embed = this.client.embeds.error();
                embed.description = `${this.client.emojis.cross} **${tag}** is a Administrator!`;
                return responder.send({ embed: embed });
            }

            /* Check if could be Punished */
            if(!member.punishable) {
                const embed = this.client.embeds.error();
                embed.description = `${this.client.emojis.cross} I don\'t have permissions to unmute **${member.user.tag}**!`;
                return responder.send({ embed: embed });
            }
            const reason = args.reason.join(" ");

            /* Get the Mute role */
            let muteRole = message.channel.guild.roles.find(x => x.name == "Muted");
            if(GuildDB && GuildDB.dataValues && GuildDB.dataValues.muteRole) {
                muteRole = message.channel.guild.roles.get(`${GuildDB.dataValues.muteRole}`);
            }
            if(muteRole && (!GuildDB || !GuildDB.dataValues || !GuildDB.dataValues.muteRole)) {
                await this.client.database.Guild.update({ muteRole: muteRole.id }, { where: key });
            }
            if(!muteRole) {
                const roleOptions = {
                    name: "Muted",
                    permissions: 0,
                    hoist: false,
                    mentionable: false,
                }
                muteRole = await message.channel.guild.createRole(roleOptions, "Mute Role");
                if(!GuildDB) GuildDB = await this.client.database.Guild.create(key);
                await this.client.database.Guild.update({ muteRole: muteRole.id }, { where: key });
            }

            /* Check if member has Mute Role */
            if(!member.roles.includes(muteRole.id)) {
                const embed = this.client.embeds.error();
                embed.description = `${this.client.emojis.cross} **${member.user.tag}** isn\'t Muted!`;
                return responder.send({ embed: embed });
            }

            /* Create a Case */
            await CaseHandler(this.client, message.channel.guild, {
                affected: `${member.user.id}`,
                reason,
                moderatorID: `${message.author.id}`,
                type: `Unmute`
            }).catch(() => {});

            /* Lets Mute */
            member.removeRole(muteRole.id, reason)
            .then(() => {
                const embed = this.client.embeds.success();
                embed.description = `${this.client.emojis.tick} **${member.user.tag}** was unmuted!`;
                return responder.send({ embed: embed });
            })
            .catch((e) => {
                const embed = this.client.embeds.error();
                embed.description = `${this.client.emojis.cross} Something went wrong! (${e})`;
                return responder.send({ embed: embed });
            });
        } catch (e) {
            responder.send({
                embed: this.client.embeds.error(message.author, {
                    description: `${this.client.emojis.cross} Something went wrong. **${e}**`
                })
            });
        }
    }
}

module.exports = _Command;