const { EmbedBuilder } = require('discord.js');
const config = require("../config.js");
const musicIcons = require('../UI/icons/musicicons.js');

async function skip(client, interaction, lang) {
    try {
        const player = client.riffy?.players?.get(interaction.guildId);

        if (!player) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.skip?.embed?.noActivePlayer || "No Active Player", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.skip?.embed?.noActivePlayerDescription || "There is no music currently playing in this server!");

            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Only allow skipping if there are actually tracks waiting in queue
        if (!player.queue || player.queue.length === 0) {
            const emptyQueueEmbed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setAuthor({ 
                    name: "Queue Empty", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription("⚠️ **There are no more songs in the queue to skip to!** Autoplay will load a new song once this one finishes.");

            return await interaction.reply({ embeds: [emptyQueueEmbed], ephemeral: true });
        }

        player.stop();

        const embed = new EmbedBuilder()
            .setColor(config.embedColor || "#1db954")
            .setAuthor({ 
                name: lang?.skip?.embed?.songSkipped || "Song Skipped", 
                iconURL: musicIcons?.skipIcon,
                url: config.SupportServer
            })
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
            .setDescription(lang?.skip?.embed?.songSkippedDescription || "⏭️ **Skipped to the next song in the queue!**");

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Error processing skip command:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ 
                name: lang?.skip?.embed?.error || "Error", 
                iconURL: musicIcons?.alertIcon,
                url: config.SupportServer
            })
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
            .setDescription(lang?.skip?.embed?.errorDescription || "An error occurred while skipping the song.");

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}

module.exports = {
    name: "skip",
    description: "Skip the current song",
    permissions: "0x0000000000000800",
    options: [],
    run: skip
};
