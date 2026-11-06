const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const musicIcons = require('../UI/icons/musicicons.js');
const queueNames = [];
const requesters = new Map();

async function play(client, interaction, lang) {
    try {
        const query = interaction.options.getString('name');

        if (!interaction.member.voice?.channelId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "Error", 
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons.heartIcon })
                .setDescription(lang?.play?.embed?.noVoiceChannel || "You must be in a voice channel to use this command!");

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (!client.riffy.nodes || client.riffy.nodes.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "Error", 
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons.heartIcon })
                .setDescription(lang?.play?.embed?.noLavalinkNodes || "No Lavalink nodes are currently available. Please try again shortly.");

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        await interaction.deferReply();

        let resolve;
        try {
            resolve = await client.riffy.resolve({ query: query, requester: interaction.user.username });
        } catch (resErr) {
            console.error("Resolve error:", resErr);
            resolve = null;
        }

        if (!resolve || !resolve.tracks || !Array.isArray(resolve.tracks) || resolve.tracks.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "No Results",
                    iconURL: musicIcons.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons.heartIcon })
                .setDescription("❌ Could not load this track or search query. The Lavalink node may be rate-limited on this source. Try a different track or link!");

            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        const { loadType, tracks } = resolve;

        // Establish or retrieve voice connection with explicit voice state flags
        let player = client.riffy.players.get(interaction.guildId);
        if (!player) {
            player = client.riffy.createConnection({
                guildId: interaction.guildId,
                voiceChannel: interaction.member.voice.channelId,
                textChannel: interaction.channelId,
                deaf: true,
                selfDeaf: true,
                selfMute: false
            });
        }

        if (loadType === 'playlist') {
            for (const track of tracks) {
                track.info.requester = interaction.user.username;
                player.queue.add(track);
                queueNames.push(`[${track.info.title} - ${track.info.author}](${track.info.uri})`);
                requesters.set(track.info.uri, interaction.user.username);
            }

            if (!player.playing && !player.paused) player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = interaction.user.username;

            player.queue.add(track);
            queueNames.push(`[${track.info.title} - ${track.info.author}](${track.info.uri})`);
            requesters.set(track.info.uri, interaction.user.username);

            if (!player.playing && !player.paused) player.play();
        }

        const randomEmbed = new EmbedBuilder()
            .setColor(config.embedColor || "#1db954")
            .setAuthor({
                name: lang?.play?.embed?.requestUpdated || "Request Added",
                iconURL: musicIcons.beats2Icon,
                url: config.SupportServer
            })
            .setDescription(lang?.play?.embed?.successProcessed || "✅ Successfully added to queue!")
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons.heartIcon });

        await interaction.editReply({ embeds: [randomEmbed] });

    } catch (error) {
        console.error('Error processing play command:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ 
                name: lang?.play?.embed?.error || "Execution Error",
                iconURL: musicIcons.alertIcon,
                url: config.SupportServer
            })
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons.heartIcon })
            .setDescription(lang?.play?.embed?.errorProcessing || "An unexpected error occurred while processing playback.");

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

module.exports = {
    name: "play",
    description: "Play a song from a name or link",
    permissions: "0x0000000000000800",
    options: [{
        name: 'name',
        description: 'Enter song name / link or playlist',
        type: ApplicationCommandOptionType.String,
        required: true
    }],
    run: play,
    queueNames: queueNames,
    requesters: requesters
};
