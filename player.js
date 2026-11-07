const { Riffy } = require("riffy");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, PermissionsBitField } = require("discord.js");
const { queueNames, requesters } = require("./commands/play");
const musicardModule = require("musicard");
const Dynamic = musicardModule?.Dynamic || musicardModule?.dynamic || musicardModule;
const config = require("./config.js");
const fs = require("fs");
const path = require("path");
const autoplayCollection = require("./mongodb.js");

// Safe icon loader
let musicIcons = {
    playerIcon: "https://cdn.discordapp.com/emojis/853635608099684373.png",
    heartIcon: "https://cdn.discordapp.com/emojis/853635608099684373.png"
};
const iconPaths = [
    "./UI/icons/musicicons.js",
    "./UI/icons/musicIcons.js",
    "./ui/icons/musicicons.js",
    "./ui/icons/musicIcons.js"
];
for (const p of iconPaths) {
    try {
        const loaded = require(p);
        if (loaded) {
            musicIcons = { ...musicIcons, ...loaded };
            break;
        }
    } catch (e) {}
}

let colors = {
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
    reset: "\x1b[0m"
};
const colorPaths = [
    "./UI/colors/colors.js",
    "./ui/colors/colors.js",
    "./ui/colors/colors"
];
for (const p of colorPaths) {
    try {
        const loaded = require(p);
        if (loaded) {
            colors = { ...colors, ...loaded };
            break;
        }
    } catch (e) {}
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function sendMessageWithPermissionsCheck(channel, embed, attachment, actionRow1, actionRow2) {
    try {
        const permissions = channel.permissionsFor(channel.guild.members.me);
        if (
            !permissions.has(PermissionsBitField.Flags.SendMessages) ||
            !permissions.has(PermissionsBitField.Flags.EmbedLinks) ||
            !permissions.has(PermissionsBitField.Flags.AttachFiles) ||
            !permissions.has(PermissionsBitField.Flags.UseExternalEmojis)
        ) {
            console.error("Bot lacks necessary permissions to send messages in this channel.");
            return;
        }

        const payload = {
            embeds: [embed],
            components: [actionRow1, actionRow2],
        };
        if (attachment) {
            payload.files = [attachment];
        }

        const message = await channel.send(payload);
        return message;
    } catch (error) {
        console.error("Error sending message:", error.message);
    }
}

function initializePlayer(client) {
    // Explicitly configure v4 for WebSocket and REST routing
    const nodes = config.nodes.map((node) => ({
        name: node.name,
        host: node.host,
        port: node.port,
        password: node.password,
        secure: node.secure,
        version: "v4",
        restVersion: "v4",
        path: "/v4/websocket",
        reconnectTimeout: 5000,
        reconnectTries: Infinity,
    }));

    client.riffy = new Riffy(client, nodes, {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d?.guild_id);
            if (guild && guild.shard) {
                guild.shard.send(payload);
            }
        },
        defaultSearchPlatform: "scsearch", // SoundCloud search bypasses Render YouTube 429 blocks
        restVersion: "v4",
    });

    let currentTrackMessageId = null;
    let collector = null;

    client.riffy.on("nodeConnect", (node) => {
        console.log(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.green}Node ${node.name} Connected ✅${colors.reset}`);
    });

    client.riffy.on("nodeError", (node, error) => {
        console.log(`${colors.cyan}[ LAVALINK ]${colors.reset} ${colors.red}Node ${node.name} Error ❌ | ${error.message}${colors.reset}`);
    });

    client.riffy.on("trackError", (player, track, payload) => {
        console.error(`[ TRACK ERROR ] ${track?.info?.title}:`, payload);
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            sendEmbed(channel, `⚠️ Failed to play **${track?.info?.title || "Track"}**: \`${payload?.exception?.message || "Playback error"}\``);
        }
    });

    client.riffy.on("trackStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (!channel) return;

        const trackUri = track.info.uri;
        const requester = requesters.get(trackUri) || "Unknown User";

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setDescription(
                `**Title:** [${track.info.title}](${track.info.uri})\n` +
                `**Author:** ${track.info.author || "Unknown Artist"}\n` +
                `**Length:** ${formatDuration(track.info.length)}\n` +
                `**Requester:** ${requester}\n` +
                `**Source:** ${track.info.sourceName}\n\n` +
                `**Controls:** 🔁 \`Loop\`, ❌ \`Disable\`, ⏭️ \`Skip\``
            )
            .setColor("#FF7A00");

        if (isValidUrl(musicIcons.playerIcon)) {
            embed.setAuthor({
                name: "Playing Song...",
                iconURL: musicIcons.playerIcon,
                url: isValidUrl(config.SupportServer) ? config.SupportServer : undefined,
            });
        } else {
            embed.setAuthor({ name: "Playing Song..." });
        }

        if (isValidUrl(musicIcons.heartIcon)) {
            embed.setFooter({ text: "Developed by Krish | Groover v1.2", iconURL: musicIcons.heartIcon });
        } else {
            embed.setFooter({ text: "Developed by Krish | Groover v1.2" });
        }

        let attachment = null;
        try {
            const cardGenerator = typeof Dynamic === "function" 
                ? Dynamic 
                : (musicardModule?.Dynamic || musicardModule?.dynamic);

            if (typeof cardGenerator === "function") {
                const musicard = await cardGenerator({
                    thumbnailImage: track.info.thumbnail || "https://cdn.discordapp.com/embed/avatars/0.png",
                    backgroundColor: "#070707",
                    progress: 10,
                    progressColor: "#FF7A00",
                    progressBarColor: "#5F2D00",
                    name: track.info.title,
                    nameColor: "#FF7A00",
                    author: track.info.author || "Unknown Artist",
                    authorColor: "#696969",
                });

                const cardPath = path.join(__dirname, "musicard.png");
                fs.writeFileSync(cardPath, musicard);
                attachment = new AttachmentBuilder(cardPath, { name: "musicard.png" });
                embed.setImage("attachment://musicard.png");
            } else if (track.info.thumbnail && isValidUrl(track.info.thumbnail)) {
                embed.setImage(track.info.thumbnail);
            }
        } catch (imgError) {
            console.error("Musicard canvas render skipped:", imgError.message);
            if (track.info.thumbnail && isValidUrl(track.info.thumbnail)) {
                embed.setImage(track.info.thumbnail);
            }
        }

        const actionRow1 = createActionRow1(false);
        const actionRow2 = createActionRow2(false);

        const message = await sendMessageWithPermissionsCheck(channel, embed, attachment, actionRow1, actionRow2);
        if (message) {
            currentTrackMessageId = message.id;
            if (collector) collector.stop();
            collector = setupCollector(client, player, channel, message);
        }
    });

    client.riffy.on("trackEnd", async (player) => {
        await disableTrackMessage(client, player);
        currentTrackMessageId = null;
    });

    client.riffy.on("playerDisconnect", async (player) => {
        await disableTrackMessage(client, player);
        currentTrackMessageId = null;
    });

    client.riffy.on("queueEnd", async (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        const guildId = player.guildId;

        try {
            let autoplaySetting = null;
            if (autoplayCollection && typeof autoplayCollection.findOne === "function") {
                autoplaySetting = await autoplayCollection.findOne({ guildId });
            }

            if (autoplaySetting?.autoplay) {
                if (!player.connected) {
                    return player.destroy();
                }

                try {
                    await player.autoplay(player);
                } catch (autoErr) {
                    console.error("Autoplay failed:", autoErr.message);
                    player.destroy();
                }
            } else {
                player.destroy();
                if (channel) {
                    sendEmbed(channel, "Queue has ended. Leaving voice channel.");
                }
            }
        } catch (error) {
            console.error("Error handling queueEnd:", error);
            player.destroy();
        }
    });

    async function disableTrackMessage(client, player) {
        try {
            const channel = client.channels.cache.get(player.textChannel);
            if (!channel || !currentTrackMessageId) return;
            const message = await channel.messages.fetch(currentTrackMessageId).catch(() => null);
            if (message) {
                const disabledRow1 = createActionRow1(true);
                const disabledRow2 = createActionRow2(true);
                await message.edit({ components: [disabledRow1, disabledRow2] });
            }
        } catch (error) {
            console.error("Failed to disable message components:", error);
        }
    }

    function formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

        return [
            hours > 0 ? `${hours}h` : null,
            minutes > 0 ? `${minutes}m` : null,
            `${seconds}s`,
        ]
            .filter(Boolean)
            .join(" ");
    }

    function setupCollector(client, player, channel, message) {
        const filter = (i) => [
            "loopToggle",
            "skipTrack",
            "disableLoop",
            "showQueue",
            "clearQueue",
            "stopTrack",
            "pauseTrack",
            "resumeTrack",
            "volumeUp",
            "volumeDown",
        ].includes(i.customId);

        const collector = message.createMessageComponentCollector({ filter, time: 600000 });

        collector.on("collect", async (i) => {
            await i.deferUpdate();

            const member = i.member;
            const voiceChannel = member.voice.channel;
            const playerChannel = player.voiceChannel;

            if (!voiceChannel || voiceChannel.id !== playerChannel) {
                const vcEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription("⚠️ **You need to be in the same voice channel to use the controls!**");
                const sentMessage = await channel.send({ embeds: [vcEmbed] });
                setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
                return;
            }

            handleInteraction(i, player, channel);
        });

        collector.on("end", () => {
            console.log("Collector stopped.");
        });

        return collector;
    }

    async function handleInteraction(i, player, channel) {
        switch (i.customId) {
            case "loopToggle":
                toggleLoop(player, channel);
                break;
            case "skipTrack":
                player.stop();
                await sendEmbed(channel, "⏭️ **Player will play the next song!**");
                break;
            case "disableLoop":
                disableLoop(player, channel);
                break;
            case "showQueue":
                showQueue(channel);
                break;
            case "clearQueue":
                player.queue.clear();
                await sendEmbed(channel, "🗑️ **Queue has been cleared!**");
                break;
            case "stopTrack":
                player.stop();
                player.destroy();
                await sendEmbed(channel, "⏹️ **Playback has been stopped and player destroyed!**");
                break;
            case "pauseTrack":
                if (player.paused) {
                    await sendEmbed(channel, "⚠️ **Playback is already paused!**");
                } else {
                    player.pause(true);
                    await sendEmbed(channel, "⏸️ **Playback has been paused!**");
                }
                break;
            case "resumeTrack":
                if (!player.paused) {
                    await sendEmbed(channel, "⚠️ **Playback is already resumed!**");
                } else {
                    player.pause(false);
                    await sendEmbed(channel, "▶️ **Playback has been resumed!**");
                }
                break;
            case "volumeUp":
                adjustVolume(player, channel, 10);
                break;
            case "volumeDown":
                adjustVolume(player, channel, -10);
                break;
        }
    }

    async function sendEmbed(channel, message) {
        const embed = new EmbedBuilder().setColor(config.embedColor).setDescription(message);
        const sentMessage = await channel.send({ embeds: [embed] }).catch(() => null);
        if (sentMessage) {
            setTimeout(() => sentMessage.delete().catch(console.error), config.embedTimeout * 1000);
        }
    }

    function adjustVolume(player, channel, amount) {
        const newVolume = Math.min(100, Math.max(10, player.volume + amount));
        if (newVolume === player.volume) {
            sendEmbed(channel, amount > 0 ? "⚠️ **Volume is already at maximum!**" : "⚠️ **Volume is already at minimum!**");
        } else {
            player.setVolume(newVolume);
            sendEmbed(channel, `🔊 **Volume changed to ${newVolume}%!**`);
        }
    }

    function toggleLoop(player, channel) {
        player.setLoop(player.loop === "track" ? "queue" : "track");
        sendEmbed(channel, player.loop === "track" ? "🔁 **Track loop is activated!**" : "🔁 **Queue loop is activated!**");
    }

    function disableLoop(player, channel) {
        player.setLoop("none");
        sendEmbed(channel, "❌ **Loop is disabled!**");
    }

    function showQueue(channel) {
        if (queueNames.length === 0) {
            sendEmbed(channel, "The queue is empty.");
            return;
        }

        const queueChunks = [];
        for (let i = 1; i < queueNames.length; i += 10) {
            const chunk = queueNames
                .slice(i, i + 10)
                .map((song, index) => `${i + index}. ${formatTrack(song)}`)
                .join("\n");
            queueChunks.push(chunk);
        }

        channel.send({
            embeds: [new EmbedBuilder().setColor(config.embedColor).setDescription(queueNames[0])],
        }).catch(console.error);

        queueChunks.forEach(async (chunk) => {
            const embed = new EmbedBuilder().setColor(config.embedColor).setDescription(`### Queue:\n${chunk}`);
            await channel.send({ embeds: [embed] }).catch(console.error);
        });
    }

    function formatTrack(track) {
        if (!track || typeof track !== "string") return track;
        const match = track.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
            const [, title, uri] = match;
            return `[${title}](${uri})`;
        }
        return track;
    }

    function createActionRow1(disabled) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("loopToggle").setEmoji("🔁").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("disableLoop").setEmoji("❌").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("skipTrack").setEmoji("⏭️").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("showQueue").setEmoji("📜").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("clearQueue").setEmoji("🗑️").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
        );
    }

    function createActionRow2(disabled) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("stopTrack").setEmoji("⏹️").setStyle(ButtonStyle.Danger).setDisabled(disabled),
            new ButtonBuilder().setCustomId("pauseTrack").setEmoji("⏸️").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("resumeTrack").setEmoji("▶️").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("volumeUp").setEmoji("🔊").setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId("volumeDown").setEmoji("🔉").setStyle(ButtonStyle.Secondary).setDisabled(disabled)
        );
    }
}

module.exports = initializePlayer;
