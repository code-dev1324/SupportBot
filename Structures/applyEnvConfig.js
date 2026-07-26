// One-time, best-effort substitution of secret fields in Configs/*.yml from
// environment variables, run before the app boots. This lets the deployment
// target inject real secrets via standard env vars instead of committing
// them to git. Every field is optional; if its env var is unset, the
// checked-in default is left untouched.

const fs = require("fs");
const path = require("path");

const CONFIGS_DIR = path.join(__dirname, "..", "Configs");
// __dirname is Structures/, so ../Configs resolves to the repo-root Configs/ dir.

// Replaces `Key: "anything"` with `Key: "<value>"` for the first match of
// `key` in the file, only if `envVar` is set in the environment.
function setYamlField(file, key, envVar) {
  const value = process.env[envVar];
  if (!value) return;

  const filePath = path.join(CONFIGS_DIR, file);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(`^(\\s*${key}:\\s*)["'][^"']*["']`, "m");
  if (!pattern.test(content)) return;

  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const updated = content.replace(pattern, `$1"${escaped}"`);
  fs.writeFileSync(filePath, updated);
  console.log(`[apply-env-config] Set ${key} in ${file} from ${envVar}.`);
}

// Replaces a single-item `Key:\n  - "anything"` list entry.
function setYamlListItem(file, key, envVar) {
  const value = process.env[envVar];
  if (!value) return;

  const filePath = path.join(CONFIGS_DIR, file);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  const pattern = new RegExp(`(^\\s*${key}:\\s*\\n\\s*-\\s*)["'][^"']*["']`, "m");
  if (!pattern.test(content)) return;

  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const updated = content.replace(pattern, `$1"${escaped}"`);
  fs.writeFileSync(filePath, updated);
  console.log(`[apply-env-config] Set ${key}[0] in ${file} from ${envVar}.`);
}

setYamlField("supportbot.yml", "Token", "BOT_TOKEN");
setYamlField("supportbot.yml", "GuildId", "GUILD_ID");

setYamlField("api.yml", "SecretKey", "API_SECRET_KEY");
setYamlField("api.yml", "ClientId", "OAUTH_CLIENT_ID");
setYamlField("api.yml", "ClientSecret", "OAUTH_CLIENT_SECRET");
setYamlField("api.yml", "RedirectUri", "OAUTH_REDIRECT_URI");
setYamlListItem("api.yml", "OwnerUserIds", "OWNER_USER_ID");

setYamlField("supportbot-ai.yml", "Provider", "AI_PROVIDER");
setYamlField("supportbot-ai.yml", "Model", "AI_MODEL");
setYamlField("supportbot-ai.yml", "Model_API_Key", "AI_MODEL_API_KEY");
