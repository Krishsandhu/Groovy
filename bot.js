const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require("path");
const initializePlayer = require("./player");
const mongoModule = require("./mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

// Safe colors loader to prevent MODULE_NOT_FOUND crashes on Render
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
    colors = require("./ui/colors/colors");
} catch (e) {
    // Falls back to standard ANSI codes if the file does not exist
}

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});

client.config = config;
initializePlayer(client);

client.on("ready", () => {
    console.log(`${colors.cyan}[ SYSTEM ]${colors.reset} ${colors.green}Client logged as ${colors.yellow}${client.user.tag}${colors.reset}`);
    console.log(`${colors.cyan}[ MUSIC ]${colors.reset} ${colors.green}Riffy Music System Ready 🎵${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace("T", " ").split(".")[0]}${colors.reset}`);
    client.riffy.init(client.user.id);
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

// Forward raw voice/server updates to Riffy
client.on("raw", (d) => {
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

// Safe database connection handler supporting both model exports and functions
async function startDatabase() {
    try {
        if (typeof mongoModule === "function") {
            await mongoModule();
        } else if (mongoModule && typeof mongoModule.connect === "function") {
            await mongoModule.connect();
        } else if (mongoModule && typeof mongoModule.connectToDatabase === "function") {
            await mongoModule.connectToDatabase();
        } else if (process.env.MONGO_URI || config.MONGO_URI || config.mongoUri) {
            const uri = process.env.MONGO_URI || config.MONGO_URI || config.mongoUri;
            await mongoose.connect(uri);
        }

        console.log("\n" + "-".repeat(40));
        console.log(`${colors.magenta}${colors.bright}  DATABASE STATUS${colors.reset}`);
        console.log("-".repeat(40));
        console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.green}MongoDB Online ✅${colors.reset}`);
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
    console.log(`${colors.cyan}[ PORT ]${colors.reset} ${colors.yellow}http://localhost:${port}${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace("T", " ").split(".")[0]}${colors.reset}`);
    console.log(`${colors.cyan}[ USER ]${colors.reset} ${colors.yellow}GlaceYT${colors.reset}`);
});
