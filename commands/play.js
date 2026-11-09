const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const musicIcons = require('../UI/icons/musicicons.js');
const queueNames = [];
const requesters = new Map();

async function play(client, interaction, lang) {
    try {
        // 1. Acknowledge Discord immediately
        await interaction.deferReply();

        const query = interaction.options.getString('name');

        if (!interaction.member.voice?.channelId) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "Error", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.play?.embed?.noVoiceChannel || "You must be in a voice channel to use this command!");

            return await interaction.editReply({ embeds: [embed] });
        }

        if (!client.riffy?.nodes || client.riffy.nodes.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "Error", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.play?.embed?.noLavalinkNodes || "No Lavalink nodes are currently available. Please try again shortly.");

            return await interaction.editReply({ embeds: [embed] });
        }

        let rawQuery = query.trim();
        const isUrl = /^https?:\/\//i.test(rawQuery);
        let resolve = null;

        // 2. Direct URLs are passed as-is. Plain song names use scsearch: (SoundCloud search)
        // scsearch: resolves instantly without YouTube IP bans or LavaSearch timeouts.
        const targetQuery = isUrl ? rawQuery : `scsearch:${rawQuery}`;

        try {
            resolve = await client.riffy.resolve({ 
                query: targetQuery, 
                requester: interaction.user.username 
            });
            console.log("Riffy Resolve Response:", JSON.stringify(resolve, null, 2));
        } catch (resErr) {
            console.error("Resolve Error:", resErr);
        }

        // 3. Fallback: If a YouTube link was provided and failed due to IP blocks, inform the user cleanly
        if (!resolve || resolve.loadType === "error" || resolve.loadType === "empty" || !resolve.tracks || resolve.tracks.length === 0) {
            let errorMsg = "❌ Could not find or play this track.";
            if (isUrl && /youtube\.com|youtu\.be/i.test(rawQuery)) {
                errorMsg = "❌ YouTube has blocked this link on the node. Please **type the song name** or use a **Spotify link** instead!";
            }

            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "No Results",
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(errorMsg);

            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        // 4. Establish Voice Connection
        let player = client.riffy.players.get(interaction.guildId);
        if (!player) {
            player = client.riffy.createConnection({
                guildId: interaction.guildId,
                voiceChannel: interaction.member.voice.channelId,
                textChannel: interaction.channelId,
                deaf: true
            });
        }

        const { loadType, tracks, playlistInfo } = resolve;

        // 5. Handle Playlists
        if (loadType === 'playlist' || loadType === 'PLAYLIST_LOADED') {
            for (const track of tracks) {
                track.info.requester = interaction.user.username;
                player.queue.add(track);
                queueNames.push(`[${track.info.title} - ${track.info.author}](${track.info.uri})`);
                requesters.set(track.info.uri, interaction.user.username);
            }

            if (!player.playing && !player.paused) player.play();

            const playlistEmbed = new EmbedBuilder()
                .setColor(config.embedColor || "#1db954")
                .setAuthor({
                    name: lang?.play?.embed?.requestUpdated || "Playlist Added",
                    iconURL: musicIcons?.beats2Icon,
                    url: config.SupportServer
                })
                .setDescription(`📋 Added playlist **${playlistInfo?.name || "Unknown"}** (${tracks.length} tracks) to queue!`)
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon });

            return await interaction.editReply({ embeds: [playlistEmbed] });

        // 6. Handle Single Tracks / Searches
        } else if (loadType === 'search' || loadType === 'track' || loadType === 'SEARCH_RESULT' || loadType === 'TRACK_LOADED') {
            const track = tracks.shift();
            track.info.requester = interaction.user.username;

            player.queue.add(track);
            queueNames.push(`[${track.info.title} - ${track.info.author}](${track.info.uri})`);
            requesters.set(track.info.uri, interaction.user.username);

            if (!player.playing && !player.paused) player.play();

            const trackEmbed = new EmbedBuilder()
                .setColor(config.embedColor || "#1db954")
                .setAuthor({
                    name: lang?.play?.embed?.requestUpdated || "Request Added",
                    iconURL: musicIcons?.beats2Icon,
                    url: config.SupportServer
                })
                .setDescription(`🎵 Added **[${track.info.title}](${track.info.uri})** by \`${track.info.author}\` to queue!`)
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon });

            return await interaction.editReply({ embeds: [trackEmbed] });
        }

    } catch (error) {
        console.error('Error processing play command:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setAuthor({ 
                name: lang?.play?.embed?.error || "Execution Error",
                iconURL: musicIcons?.alertIcon,
                url: config.SupportServer
            })
            .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
            .setDescription(lang?.play?.embed?.errorProcessing || "An unexpected error occurred while processing playback.");

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        } catch (replyErr) {
            console.error('Failed to send error reply:', replyErr);
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
