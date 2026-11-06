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
      name: "Riffy-India",
      password: "horizxon.studio",
      host: "lava4.horizxon.studio",
      port: 80,
      secure: false
    },
    {
      name: "Riffy-Europe",
      password: "horizxon.studio",
      host: "lava3.horizxon.studio",
      port: 80,
      secure: false
    }
  ]
};
