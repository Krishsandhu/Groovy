

module.exports = {
  TOKEN: "",
  language: "en",
  ownerID: ["937004195008102462", ""], 
  mongodbUri : "mongodb+srv://krish:B3CoiLQ4hcxASQWZ@groover.3b9rn.mongodb.net/?retryWrites=true&w=majority",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#1db954",
  activityName: "YouTube Music", 
  activityType: "LISTENING",  // Available activity types : LISTENING , PLAYING
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5, 
  errorLog: "", 
  nodes: [
     {
      name: "Groovy",
      password: "krish",
      host: "utopia.pylex.xyz",
      port: 11503,
      secure: false
    }
  ]
}
