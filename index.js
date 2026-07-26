//      ___                            _    ___        _
//    / __> _ _  ___  ___  ___  _ _ _| |_ | . > ___ _| |_
//     \__ \| | || . \| . \/ . \| '_> | |  | . \/ . \ | |
//     <___/`___||  _/|  _/\___/|_|   |_|  |___/\___/ |_|
//                |_|  |_|
//
//           SupportBot created by Emerald Services
//           Installed with MIT License
//
//           Discord Support: https://emeraldsrv.dev/discord
//           Community Resources: https://community.emeraldsrv.dev

const fs = require("fs");
const path = require("path");

// Structures/Database.js, AIDatabase.js, TranscriptStore.js, DashboardUserStore.js
// and several commands/addons read/write under ./Data without ever creating it,
// and better-sqlite3 throws if the parent directory doesn't exist. Data/ isn't
// committed to git (git doesn't track empty directories), so it must be created
// here before any module that touches it is required below.
for (const dir of ["./Data", "./Data/Profiles", "./Data/Transcripts"]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const configStore = require("./Structures/ConfigStore.js");

const Client = require("./Structures/Client.js");
const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

const APIServer = require("./API/server.js");

// Start dashboard API immediately — do not wait for Discord clientReady
const api = new APIServer(client);
client.apiServer = api;

if (api.config?.Enabled) {
  const port = api.config.Port || 3000;
  api.start(port);
  console.log(
    `[Dashboard] API listening on http://localhost:${port} (bot may still be connecting)`,
  );
} else {
  console.warn("[Dashboard] API disabled in Configs/api.yml");
}

client.start(configStore.supportbot.General.Token);

client.on("clientReady", () => {
  console.log("[Dashboard] Discord bot is ready — full stats and guild tools are available");
});

// SupportBot - New Logging System

const logTypes = ["Output", "Warn", "Error"];

if (!fs.existsSync("./Logs")) {
  fs.mkdirSync("./Logs");
}
logTypes.forEach((type) => {
  const dir = `./Logs/${type}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

function logToFile(type, data) {
  const date = new Date().toISOString().split("T")[0];
  const file = path.join(`./Logs/${type}`, `${type}-${date}.log`);
  fs.appendFileSync(file, `[${new Date().toISOString()}] ${data}\n`);
}

const origLog = console.log;
console.log = (...args) => {
  origLog(...args);
  logToFile("Output", args.join(" "));
};

const origWarn = console.warn;
console.warn = (...args) => {
  origWarn(...args);
  logToFile("Warn", args.join(" "));
};

const origError = console.error;
console.error = (...args) => {
  origError(...args);
  logToFile("Error", args.join(" "));
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
