const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const config = require("../config.js");
const musicIcons = require('../UI/icons/musicicons.js');

async function filters(client, interaction, lang) {
    try {
        const player = client.riffy.players.get(interaction.guildId);

        if (!player) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: lang?.filters?.embed?.error || "Error",
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.filters?.embed?.noPlayer || "No active player found!");

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (!interaction.member.voice.channelId || interaction.member.voice.channelId !== player.voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({
                    name: lang?.filters?.embed?.error || "Error",
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.filters?.embed?.wrongChannel || "You must be in the same voice channel as the bot!");

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const selectedFilter = interaction.options.getString('filter');

        if (selectedFilter === 'clear') {
            player.filters.clearFilters();
            await interaction.reply({ content: lang?.filters?.embed?.filtersCleared || "✨ All filters cleared!", ephemeral: true });
            return;
        }

        // Reset previous filters so effects don't stack unintentionally
        player.filters.clearFilters();

        switch (selectedFilter) {
            case 'karaoke':
                player.filters.setKaraoke({
                    level: 1.0,
                    monoLevel: 1.0,
                    filterBand: 220.0,
                    filterWidth: 100.0
                });
                break;
            case 'timescale':
                player.filters.setTimescale({ speed: 1.2, pitch: 1.2, rate: 1.0 });
                break;
            case 'tremolo':
                player.filters.setTremolo({ frequency: 4.0, depth: 0.75 });
                break;
            case 'vibrato':
                player.filters.setVibrato({ frequency: 4.0, depth: 0.75 });
                break;
            case 'rotation':
                player.filters.setRotation({ rotationHz: 0.2 });
                break;
            case 'distortion':
                player.filters.setDistortion({ sinScale: 1, cosScale: 1 });
                break;
            case 'channelmix':
                player.filters.setChannelMix({ leftToLeft: 0.5, leftToRight: 0.5, rightToLeft: 0.5, rightToRight: 0.5 });
                break;
            case 'lowpass':
                player.filters.setLowPass({ smoothing: 20.0 });
                break;
            case 'bassboost':
                // Clean equalizer curve for deep punchy bass
                player.filters.setEqualizer([
                    { band: 0, gain: 0.35 },
                    { band: 1, gain: 0.25 },
                    { band: 2, gain: 0.15 },
                    { band: 3, gain: 0.05 }
                ]);
                break;
            default:
                await interaction.reply({ content: lang?.filters?.embed?.invalidFilter || "Invalid filter selected.", ephemeral: true });
                return;
        }

        const replyMsg = lang?.filters?.embed?.filterApplied 
            ? lang.filters.embed.filterApplied.replace("{filter}", selectedFilter) 
            : `🎵 Applied **${selectedFilter}** filter!`;

        await interaction.reply({ content: replyMsg, ephemeral: true });

    } catch (error) {
        console.error('Error processing filters command:', error);

        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({
                name: lang?.filters?.embed?.error || "Error",
                iconURL: musicIcons?.alertIcon,
                url: config.SupportServer
            })
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
            .setDescription(lang?.filters?.embed?.errorProcessing || "An error occurred while processing the filter.");

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

module.exports = {
    name: "filters",
    description: "Apply audio filters like Bassboost, 3D, and Timescale",
    permissions: "0x0000000000000800",
    options: [
        {
            name: 'filter',
            description: 'Select a filter to apply',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Bassboost', value: 'bassboost' },
                { name: 'Timescale / Nightcore', value: 'timescale' },
                { name: '3D Audio', value: 'rotation' },
                { name: 'Karaoke', value: 'karaoke' },
                { name: 'Tremolo', value: 'tremolo' },
                { name: 'Vibrato', value: 'vibrato' },
                { name: 'Distortion', value: 'distortion' },
                { name: 'Channel Mix', value: 'channelmix' },
                { name: 'Low Pass', value: 'lowpass' },
                { name: 'Clear Filters', value: 'clear' }
            ]
        }
    ],
    run: filters
};
