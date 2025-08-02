#!/usr/bin/env node

const figlet = require("figlet");
const clear = require("clear");
const llog = require("learninglab-log");
const path = require("path");

require("dotenv").config({ path: __dirname + `/.env.cli` });

if (process.env.OPENAI_API_KEY) {
  const apiKey = process.env.OPENAI_API_KEY;
  const maskedKey = `${apiKey.substring(0, 3)}...${apiKey.substring(
    apiKey.length - 3
  )}`;
  llog.info(`OPENAI_API_KEY found: ${maskedKey}`);
} else {
  llog.warn("OPENAI_API_KEY not found.");
}

// Store any arguments passed in using yargs
const yargs = require("yargs").argv;

// Handle un-hyphenated arguments
yargs._.forEach((arg) => {
  yargs[arg] = true;
});

// Determine shootFolder based on yargs.capture or current working directory
let shootFolder = null;

if (yargs.capture && yargs.capture !== true) {
  // Use the value passed to yargs.capture as the shootFolder
  shootFolder = path.resolve(yargs.capture);
} else if (yargs.capture === true) {
  // Use the current working directory as the shootFolder
  shootFolder = process.cwd();
}

console.log("Launching...");
console.log("ShootFolder:", shootFolder);

// Options: rename, makefolders, proxy, proxyf2
if (yargs.watch_hijack || yargs.hijack) {
  hijackBot.hijackWatcher({
    watchFolder: process.env.HIJACK_WATCH_FOLDER,
    archiveFolder: process.env.HIJACK_ARCHIVE_FOLDER,
  });
} else if (yargs.capture) {
  if (!shootFolder) {
    console.error("Error: No shoot folder specified.");
    process.exit(1);
  }
  capture(shootFolder);
} else if (yargs.trailer) {
  // Run the script with a video file argument
  const videoFile = yargs.trailer;
  if (!videoFile) {
    console.error("Usage: node processVideo.js <video-file>");
    process.exit(1);
  }
  trailerBot({ inputFile: videoFile });
} else {
  console.log("Sorry, you didn't enter a recognized command.");
}