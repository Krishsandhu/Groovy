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
      name: "AjieDev-V4-SSL",
      host: "lava-v4.ajieblogs.eu.org",
      port: 443,
      password: "https://dsc.gg/ajidevserver",
      secure: true
    },
    {
      name: "Inari-V4-SSL",
      host: "lavalink.inari.site",
      port: 443,
      password: "youshallnotpass",
      secure: true
    }
  ]
};
