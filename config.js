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
      name: "G3V-Lavalink-V4",
      host: "lava.g3v.co.uk",
      port: 9008,
      password: "lavalinklol",
      secure: false
    },
    {
      name: "Ajie-V4-Fallback",
      host: "lava-v4.ajieblogs.eu.org",
      port: 80,
      password: "https://dsc.gg/ajidevserver",
      secure: false
    }
  ]
};
