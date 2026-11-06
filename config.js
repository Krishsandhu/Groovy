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
      name: "CloudeWave-India",
      password: "cloudewave.in",
      host: "lavalink.cloudewave.in",
      port: 2336,
      secure: false
    }
  ]
