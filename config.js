module.exports = {
  TOKEN: "",
  language: "en",
  ownerID: ["937004195008102462", ""],
  mongodbUri: process.env.MONGO_URI || "",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',
  embedColor: "#1db954",
  activityName: "MUSIC",
  activityType: "LISTENING",
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5,
  errorLog: "",
  nodes: [
    {
      name: "Jirayu-SSL",
      password: "youshallnotpass",
      host: "lavalink.jirayu.net",
      port: 443,
      secure: true
    },
    {
      name: "Nazha-Free",
      password: "nazhafreelava",
      host: "lavalink.nazha.online",
      port: 443,
      secure: true
    },
    {
      name: "Huntolls-SSL",
      password: "youshallnotpass",
      host: "lavalink-v4.huntolls-bot.xyz",
      port: 443,
      secure: true
    }
  ]
};
