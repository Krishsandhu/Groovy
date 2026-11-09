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
      name: "CRESCENDO MAIN NODE",
      host: "de4.bot-hosting.cloud",
      port: 26245,
      password: "glaceyt",
      secure: false
    }
  ]
};
