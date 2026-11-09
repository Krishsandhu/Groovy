const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const musicIcons = require('../UI/icons/musicicons.js');
const queueNames = [];
const requesters = new Map();

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+/i;

/**
 * Fetch song title from YouTube using a browser user-agent
 */
async function getYouTubeTitle(url) {
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const res = await fetch(oembedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.title || null;
    } catch (e) {
        return null;
    }
}

/**
 * Resolves any song query to a direct Spotify URL using Spotify's public embed endpoint
 */
async function searchSpotifyTrackUrl(query) {
    try {
        // Query Spotify embed search (no API keys required)
        const cleanQuery = query.replace(/[^\w\s]/gi, ' ').trim();
        const searchUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/`;
        // Fallback: If it's already a spotify link, return it
        if (/open\.spotify\.com/i.test(query)) return query;

        // Fetch track metadata through iTunes/Spotify fallback to get high-fidelity matching
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=1`;
        const res = await fetch(itunesUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const track = data.results[0];
                return {
                    title: track.trackName,
                    artist: track.artistName,
                    searchStr: `${track.trackName} ${track.artistName}`
                };
            }
        }
        return { searchStr: cleanQuery };
    } catch (err) {
        return { searchStr: query };
    }
}

async function play(client, interaction, lang) {
    try {
        // 1. Immediately acknowledge Discord interaction
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
        let targetQuery = rawQuery;
        let originalYTTitle = "";

        // 2. Handle YouTube Links
        if (YOUTUBE_REGEX.test(rawQuery)) {
            const ytTitle = await getYouTubeTitle(rawQuery);
            if (ytTitle) {
                originalYTTitle = ytTitle;
                targetQuery = ytTitle;
            } else {
                const ytNoticeEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setAuthor({ name: "YouTube Error", iconURL: musicIcons?.alertIcon, url: config.SupportServer })
                    .setDescription("❌ Could not read this YouTube URL. Direct YouTube streams are blocked; please type the song name or use a Spotify link!");

                return await interaction.editReply({ embeds: [ytNoticeEmbed] });
            }
        }

        const isDirectUrl = /^https?:\/\//i.test(targetQuery);
        let resolve = null;

        // 3. Resolve using Riffy with safe null handling
        try {
            if (isDirectUrl) {
                // Direct Spotify / URL
                resolve = await client.riffy.resolve({ 
                    query: targetQuery, 
                    requester: interaction.user.username 
                });
            } else {
                // Search resolution: query Spotify search engine supported by LavaSrc
                // If LavaSrc uses spsearch:
                resolve = await client.riffy.resolve({
                    query: `spsearch:${targetQuery}`,
                    requester: interaction.user.username
                }).catch(() => null);

                // If spsearch returned null or empty, try direct query
                if (!resolve || resolve.loadType === "error" || resolve.loadType === "empty" || !resolve.tracks?.length) {
                    resolve = await client.riffy.resolve({
                        query: targetQuery,
                        requester: interaction.user.username
                    }).catch(() => null);
                }
            }
        } catch (resErr) {
            console.error("Resolve Error caught safely:", resErr);
            resolve = null;
        }

        // 4. If nothing resolved
        if (!resolve || resolve.loadType === "error" || resolve.loadType === "empty" || !resolve.tracks || resolve.tracks.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "No Results",
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription("❌ Could not load this track. Because YouTube blocks datacenter nodes, please use a **Spotify link** (e.g. `https://open.spotify.com/track/...`) for 100% reliable playback!");

            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        // 5. Connect to Voice
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

        // 6. Handle Playlists
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

        // 7. Handle Single Tracks
        } else if (loadType === 'search' || loadType === 'track' || loadType === 'SEARCH_RESULT' || loadType === 'TRACK_LOADED') {
            const track = tracks.shift();
            track.info.requester = interaction.user.username;

            player.queue.add(track);
            queueNames.push(`[${track.info.title} - ${track.info.author}](${track.info.uri})`);
            requesters.set(track.info.uri, interaction.user.username);

            if (!player.playing && !player.paused) player.play();

            let descriptionText = `🎵 Added **[${track.info.title}](${track.info.uri})** by \`${track.info.author}\` to queue!`;
            if (originalYTTitle) {
                descriptionText += `\n*(Redirected from: **${originalYTTitle}**)*`;
            }

            const trackEmbed = new EmbedBuilder()
                .setColor(config.embedColor || "#1db954")
                .setAuthor({
                    name: lang?.play?.embed?.requestUpdated || "Request Added",
                    iconURL: musicIcons?.beats2Icon,
                    url: config.SupportServer
                })
                .setDescription(descriptionText)
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
