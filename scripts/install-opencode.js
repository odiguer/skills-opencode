#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

function printUsage() {
  console.log(`Usage: install-opencode.sh [OPTIONS] [TARGET]

Install the promoted mattpocock skills into a project or globally.

Options:
  -g, --global    Install into ~/.config/opencode/skills/
  -h, --help      Show this help

Arguments:
  TARGET          Path to the target project directory (default: current directory)
                  Ignored when --global is used.

Examples:
  install-opencode.sh
  install-opencode.sh /path/to/project
  install-opencode.sh --global
`);
}

function parseArgs() {
  let globalInstall = false;
  let target = null;

  for (const arg of process.argv.slice(2)) {
    if (arg === '-g' || arg === '--global') {
      globalInstall = true;
    } else if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      target = arg;
    } else {
      console.error(`error: unknown option ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  return { globalInstall, target };
}

function symlinkSkill(src, dest) {
  const stat = fs.lstatSync(dest, { throwIfNoEntry: false });
  if (stat) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.symlinkSync(src, dest, 'dir');
}

function pruneStaleLinks(destDir, manifest, skillsRepo) {
  const manifestNames = new Set(manifest.skills.map((p) => path.basename(p)));
  const skillsRoot = path.join(skillsRepo, 'skills') + path.sep;
  for (const entry of fs.readdirSync(destDir)) {
    const entryPath = path.join(destDir, entry);
    const stat = fs.lstatSync(entryPath, { throwIfNoEntry: false });
    if (!stat || !stat.isSymbolicLink()) continue;
    const resolved = path.resolve(destDir, fs.readlinkSync(entryPath));
    if (!resolved.startsWith(skillsRoot)) continue;
    if (!manifestNames.has(entry)) {
      fs.rmSync(entryPath, { force: true });
      console.log(`pruned ${entry} (not in the manifest)`);
    }
  }
}

function installProject(targetRepo, manifest, skillsRepo) {
  const targetOpencodeSkills = path.join(targetRepo, '.opencode', 'skills');
  fs.mkdirSync(targetOpencodeSkills, { recursive: true });

  for (const skillPath of manifest.skills) {
    const src = path.join(skillsRepo, 'skills', skillPath);
    const name = path.basename(skillPath);
    const dest = path.join(targetOpencodeSkills, name);

    if (!fs.existsSync(src)) {
      console.error(`error: skill directory not found: ${src}`);
      process.exit(1);
    }

    symlinkSkill(src, dest);
    console.log(`linked ${name} -> ${src}`);
  }

  pruneStaleLinks(targetOpencodeSkills, manifest, skillsRepo);

  const targetConfigPath = path.join(targetRepo, 'opencode.json');
  let config = {};
  if (fs.existsSync(targetConfigPath)) {
    config = JSON.parse(fs.readFileSync(targetConfigPath, 'utf8'));
  }

  config.$schema = config.$schema || 'https://opencode.ai/config.json';
  config.skills = config.skills || {};
  config.skills.paths = config.skills.paths || [];

  const relativeSkillsPath = '.opencode/skills';
  if (!config.skills.paths.includes(relativeSkillsPath)) {
    config.skills.paths.push(relativeSkillsPath);
  }

  fs.writeFileSync(targetConfigPath, JSON.stringify(config, null, 2) + '\n');

  console.log(`\nInstalled mattpocock-skills into ${targetRepo}`);
  console.log('Restart opencode for changes to take effect.');
  console.log('Then run /setup-matt-pocock-skills in the project.');
}

function installGlobal(manifest, skillsRepo) {
  const globalSkillsDir = path.join(os.homedir(), '.config', 'opencode', 'skills');
  fs.mkdirSync(globalSkillsDir, { recursive: true });

  for (const skillPath of manifest.skills) {
    const src = path.join(skillsRepo, 'skills', skillPath);
    const name = path.basename(skillPath);
    const dest = path.join(globalSkillsDir, name);

    if (!fs.existsSync(src)) {
      console.error(`error: skill directory not found: ${src}`);
      process.exit(1);
    }

    symlinkSkill(src, dest);
    console.log(`linked ${name} -> ${src}`);
  }

  pruneStaleLinks(globalSkillsDir, manifest, skillsRepo);

  console.log(`\nInstalled mattpocock-skills globally into ${globalSkillsDir}`);
  console.log('Restart opencode for changes to take effect.');
}

function main() {
  const { globalInstall, target } = parseArgs();
  const skillsRepo = path.resolve(__dirname, '..');
  const manifestPath = path.join(skillsRepo, 'skills-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`error: manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (globalInstall) {
    installGlobal(manifest, skillsRepo);
  } else {
    const targetRepo = target ? path.resolve(target) : process.cwd();
    if (!fs.existsSync(targetRepo)) {
      console.error(`error: target directory does not exist: ${targetRepo}`);
      process.exit(1);
    }
    installProject(targetRepo, manifest, skillsRepo);
  }
}

main();
