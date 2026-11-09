module.exports = {
  TOKEN: process.env.TOKEN || "",
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
      name: "Serenetia-SSL",
      host: "lavalinkv4.serenetia.com",
      port: 443,
      password: "https://seretia.link/discord",
      secure: true
    },
    {
      name: "Nazha-Global",
      host: "lavalink.nazha.online",
      port: 443,
      password: "nazhafreelava",
      secure: true
    },
    {
      name: "Jirayu-Backup",
      host: "lavalink.jirayu.net",
      port: 13592,
      password: "youshallnotpass",
      secure: false
    }
  ]
};
