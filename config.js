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
      name: "Riffy-Mumbai-V4",
      host: "lava4.horizxon.studio",
      port: 80,
      password: "horizxon.studio",
      secure: false
    },
    {
      name: "Riffy-Singapore-V4",
      host: "lava1.horizxon.studio",
      port: 80,
      password: "horizxon.studio",
      secure: false
    },
    {
      name: "Riffy-AjieDev-V4",
      host: "lava-v4.ajieblogs.eu.org",
      port: 80,
      password: "https://dsc.gg/ajidevserver",
      secure: false
    }
  ]
};
