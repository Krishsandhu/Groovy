

module.exports = {
  TOKEN: "",
  language: "en",
  ownerID: ["937004195008102462", ""], 
  mongodbUri: process.env.MONGO_URI || "",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#1db954",
  activityName: "MUSIC", 
  activityType: "LISTENING",  // Available activity types : LISTENING , PLAYING
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5, 
  errorLog: "", 
  nodes: [
     {
      name: "Groovy",
      password: "https://discord.gg/XeSCnk57ZF",
      host: "lavalink.nazha.online",
      port: 443,
      secure: true
    }
  ]
}
