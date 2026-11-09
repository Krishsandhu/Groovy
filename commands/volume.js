const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const config = require("../config.js");
const musicIcons = require('../UI/icons/musicicons.js');

async function volume(client, interaction, lang) {
    try {
        const player = client.riffy?.players?.get(interaction.guildId);

        if (!player) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.volume?.embed?.noActivePlayer || "No Active Player", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.volume?.embed?.noActivePlayerDescription || "There is no music playing right now!");

            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Voice channel validation
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== player.voiceChannel) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription("⚠️ **You must be in the same voice channel as the bot to adjust volume!**")
                ],
                ephemeral: true
            });
        }

        const volumeLevel = interaction.options.getInteger('level');

        if (volumeLevel < 0 || volumeLevel > 100) {
            return await interaction.reply({ 
                content: lang?.volume?.volumeRangeError || "⚠️ Volume level must be between 0 and 100!", 
                ephemeral: true 
            });
        }

        player.setVolume(volumeLevel);

        const description = lang?.volume?.embed?.volumeUpdatedDescription 
            ? lang.volume.embed.volumeUpdatedDescription.replace("{volume}", volumeLevel)
            : `🔊 **Volume has been set to ${volumeLevel}%!**`;

        const embed = new EmbedBuilder()
            .setColor(config.embedColor || "#FF7A00")
            .setAuthor({ 
                name: lang?.volume?.embed?.volumeUpdated || "Volume Updated", 
                iconURL: musicIcons?.volumeIcon,
                url: config.SupportServer
            })
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
            .setDescription(description);

        return await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error setting volume:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ 
                name: lang?.volume?.embed?.error || "Error", 
                iconURL: musicIcons?.alertIcon,
                url: config.SupportServer
            })
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
            .setDescription(lang?.volume?.embed?.errorDescription || "An error occurred while setting the volume.");

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

module.exports = {
    name: "volume",
    description: "Set the volume of the current song",
    permissions: "0x0000000000000800",
    options: [{
        name: 'level',
        description: 'Volume level (0-100)',
        type: ApplicationCommandOptionType.Integer,
        minValue: 0,
        maxValue: 100,
        required: true
    }],
    run: volume
};
