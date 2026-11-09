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
  spotifyClientId: "f71a3da30e254962965ca2a89d6f74b9",
  spotifyClientSecret: "199a619d22dd4e55a4a2c1a7a3d70e63",
  nodes: [
    {
      name: "Serenetia-SSL",
      host: "lavalinkv4.serenetia.com",
      port: 443,
      password: "https://seretia.link/discord",
      secure: true
    }
  ]
};
