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
      name: "Darren-LavalinkV4",
      password: "https://dsc.gg/ajidevserver",
      host: "lava-v4.ajieblogs.eu.org",
      port: 443,
      secure: true
    },
    {
      name: "IncaDevs-V4",
      password: "youshallnotpass",
      host: "lavalink.incadevs.com",
      port: 443,
      secure: true
    },
    {
      name: "FreeLava-SSL",
      password: "youshallnotpass",
      host: "lava.link",
      port: 443,
      secure: true
    }
  ]
};
