const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require("path");
const initializePlayer = require("./player");
const mongoModule = require("./mongodb");
require("dotenv").config();

// Safe colors loader supporting both UI and ui directory casing
let colors = {
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
    magenta: "\x1b[35m",
    bright: "\x1b[1m",
    reset: "\x1b[0m"
};

try {
    colors = require("./UI/colors/colors.js");
} catch (e1) {
    try {
        colors = require("./ui/colors/colors.js");
    } catch (e2) {
        try {
            colors = require("./ui/colors/colors");
        } catch (e3) {
            // Falls back to defined ANSI codes
        }
    }
}

// Explicit standard gateway intents including essential voice state tracking
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.config = config;
initializePlayer(client);

client.on("ready", () => {
    console.log(`${colors.cyan}[ SYSTEM ]${colors.reset} ${colors.green}Client logged as ${colors.yellow}${client.user.tag}${colors.reset}`);
    console.log(`${colors.cyan}[ MUSIC ]${colors.reset} ${colors.green}Riffy Music System Ready 🎵${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace("T", " ").split(".")[0]}${colors.reset}`);
    if (client.riffy) client.riffy.init(client.user.id);
});

fs.readdir("./events", (err, files) => {
    if (err) return console.error(err);
    files.forEach((file) => {
        if (!file.endsWith(".js")) return;
        const event = require(`./events/${file}`);
        let eventName = file.split(".")[0];
        client.on(eventName, event.bind(null, client));
        delete require.cache[require.resolve(`./events/${file}`)];
    });
});

client.commands = [];
fs.readdir(config.commandsDir, (err, files) => {
    if (err) throw err;
    files.forEach(async (f) => {
        try {
            if (f.endsWith(".js")) {
                let props = require(`${config.commandsDir}/${f}`);
                client.commands.push({
                    name: props.name,
                    description: props.description,
                    options: props.options,
                });
            }
        } catch (err) {
            console.log(err);
        }
    });
});

// Pass voice state updates directly to Riffy with strict dispatch filtering
client.on("raw", (d) => {
    if (!["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(d.t)) return;
    if (client.riffy) {
        client.riffy.updateVoiceState(d);
    }
});

client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
    console.log("\n" + "-".repeat(40));
    console.log(`${colors.magenta}${colors.bright}🔐 TOKEN VERIFICATION${colors.reset}`);
    console.log("-".repeat(40));
    console.log(`${colors.cyan}[ TOKEN ]${colors.reset} ${colors.red}Authentication Failed ❌${colors.reset}`);
    console.log(`${colors.gray}Error: Turn On Intents or Reset New Token${colors.reset}`);
});

// Safe database connection handler with 24/7 anti-pause keepalive
async function startDatabase() {
    try {
        let dbInstance = null;
        if (typeof mongoModule === "function") {
            dbInstance = await mongoModule();
        } else if (mongoModule && typeof mongoModule.connect === "function") {
            dbInstance = await mongoModule.connect();
        } else if (mongoModule && typeof mongoModule.connectToDatabase === "function") {
            dbInstance = await mongoModule.connectToDatabase();
        }

        console.log("\n" + "-".repeat(40));
        console.log(`${colors.magenta}${colors.bright}  DATABASE STATUS${colors.reset}`);
        console.log("-".repeat(40));
        console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.green}MongoDB Online ✅${colors.reset}`);

        setInterval(async () => {
            try {
                if (dbInstance && typeof dbInstance.command === "function") {
                    await dbInstance.command({ ping: 1 });
                } else if (mongoModule?.db?.command) {
                    await mongoModule.db.command({ ping: 1 });
                } else if (mongoModule?.findOne) {
                    await mongoModule.findOne({});
                }
            } catch (_) {}
        }, 1000 * 60 * 60 * 12);

    } catch (err) {
        console.log("\n" + "-".repeat(40));
        console.log(`${colors.magenta}${colors.bright}  DATABASE STATUS${colors.reset}`);
        console.log("-".repeat(40));
        console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.red}Connection Failed ❌${colors.reset}`);
        console.log(`${colors.gray}Error: ${err.message}${colors.reset}`);
    }
}

startDatabase();

const express = require("express");
const app = express();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    const imagePath = path.join(__dirname, "index.html");
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(200).send("Bot is online and running!");
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log("\n" + "-".repeat(40));
    console.log(`${colors.magenta}${colors.bright}🌐 SERVER STATUS${colors.reset}`);
    console.log("-".repeat(40));
    console.log(`${colors.cyan}[ SERVER ]${colors.reset} ${colors.green}Online ✅${colors.reset}`);
    console.log(`${colors.cyan}[ PORT ]${colors.yellow}http://localhost:${port}${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace("T", " ").split(".")[0]}${colors.reset}`);
    console.log(`${colors.cyan}[ USER ]${colors.yellow}Krish${colors.reset}`);
});
