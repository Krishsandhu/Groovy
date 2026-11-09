const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const config = require('../config.js');
const musicIcons = require('../UI/icons/musicicons.js');
const queueNames = [];
const requesters = new Map();

// Matches standard YouTube video, music, and short links
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+/i;

// In-memory token cache for Spotify API
let spotifyAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Generates an official Spotify Access Token using Client Credentials Flow
 */
async function getSpotifyToken() {
    if (spotifyAccessToken && Date.now() < tokenExpiresAt) {
        return spotifyAccessToken;
    }

    try {
        const authString = Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString('base64');
        const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        });

        if (!res.ok) {
            console.error("Spotify Auth Failed with status:", res.status);
            return null;
        }

        const data = await res.json();
        spotifyAccessToken = data.access_token;
        // Token is valid for 1 hour; refresh 60 seconds before expiration
        tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
        return spotifyAccessToken;
    } catch (err) {
        console.error("Error fetching Spotify token:", err);
        return null;
    }
}

/**
 * Searches Spotify's official API for a song query and returns its Spotify track link
 */
async function searchSpotify(query) {
    try {
        const token = await getSpotifyToken();
        if (!token) return null;

        const endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
        const res = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) return null;
        const data = await res.json();
        const item = data?.tracks?.items?.[0];
        return item ? item.external_urls?.spotify : null;
    } catch (e) {
        console.error("Spotify Search Error:", e);
        return null;
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
                    name: lang?.play?.embed?.error || "Voice Channel Required", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.play?.embed?.noVoiceChannel || "You must join a voice channel before using this command!");

            return await interaction.editReply({ embeds: [embed] });
        }

        if (!client.riffy?.nodes || client.riffy.nodes.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "Node Offline", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription(lang?.play?.embed?.noLavalinkNodes || "No audio nodes are currently connected. Please try again in a few moments.");

            return await interaction.editReply({ embeds: [embed] });
        }

        let rawQuery = query.trim();

        // 2. Intercept YouTube links immediately with guidance
        if (YOUTUBE_REGEX.test(rawQuery)) {
            const ytEmbed = new EmbedBuilder()
                .setColor('#ff3333')
                .setAuthor({ 
                    name: "YouTube Link Unavailable", 
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setTitle("⚠️ Direct YouTube Links Are Blocked")
                .setDescription(
                    "Datacenter audio nodes are restricted by YouTube from streaming direct links.\n\n" +
                    "**How to play your track:**\n" +
                    "• **Type the song name directly:** `/play name: song title - artist`\n" +
                    "• **Use a Spotify link:** `/play name: https://open.spotify.com/track/...`\n" +
                    "• **Use a Spotify playlist:** `/play name: https://open.spotify.com/playlist/...`"
                )
                .setFooter({ text: "Groover Music | Spotify Engine", iconURL: musicIcons?.heartIcon });

            return await interaction.editReply({ embeds: [ytEmbed] });
        }

        const isDirectUrl = /^https?:\/\//i.test(rawQuery);
        let targetQuery = rawQuery;

        // 3. Convert keyword searches to direct Spotify URLs using your credentials
        if (!isDirectUrl) {
            const resolvedUrl = await searchSpotify(rawQuery);
            if (resolvedUrl) {
                targetQuery = resolvedUrl;
            }
        }

        let resolve = null;
        try {
            resolve = await client.riffy.resolve({ 
                query: targetQuery, 
                requester: interaction.user.username 
            });
        } catch (resErr) {
            console.error("Resolve Error:", resErr);
            resolve = null;
        }

        // 4. Handle unresolved / empty responses
        if (!resolve || resolve.loadType === "error" || resolve.loadType === "empty" || !resolve.tracks || resolve.tracks.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setAuthor({ 
                    name: lang?.play?.embed?.error || "Track Not Found",
                    iconURL: musicIcons?.alertIcon,
                    url: config.SupportServer
                })
                .setFooter({ text: lang?.footer || "Groover Music", iconURL: musicIcons?.heartIcon })
                .setDescription("❌ Could not find this track on Spotify. Try typing the **song name and artist**, or paste a direct Spotify link!");

            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        // 5. Connect to Voice Channel
        let player = client.riffy.players.get(interaction.guildId);
        if (!player) {
            player = client.riffy.createConnection({
                guildId: interaction.guildId,
                voiceChannel: interaction.member.voice.channelId,
                textChannel: interaction.channelId,
                deaf: true
            });
        }

        // Tag player for autoplay support
        player.isAutoplay = true;

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

            // Store current track ID for autoplay recommendations
            if (track.info.identifier) {
                player.set('lastTrackId', track.info.identifier);
            }

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
    requesters: requesters,
    getSpotifyToken: getSpotifyToken
};
