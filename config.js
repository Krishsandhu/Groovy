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
      name: "Nazha-SG1",
      password: "https://discord.gg/XeSCnk57ZF",
      host: "sg-1.nazha.online",
      port: 443,
      secure: true
    },
    {
      name: "Ajie-Node",
      password: "https://dsc.gg/ajidevserver",
      host: "lava-v4.ajieblogs.eu.org",
      port: 443,
      secure: true
    }
  ]
};
