const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const { monitorDiskSpace , cleanupStreamLeftOver } = require('./utils');
const {startRecording , killRecording } = require('./recording');
const {startLiveStream , startWebServer , killStream } = require('./stream');
const configPath = 'config.json';
if (!fs.existsSync(configPath)) {
  console.error("No config file ", configPath, " found");
  process.exit(1);
}
cleanupStreamLeftOver();
let config = {};
try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configContent);
} catch (error) {
  console.error('Error while reading config:', error);
}

const liveStream = config.liveStream || false;
const recording = config.recording || false;
if (liveStream && liveStream.enabled) {
  startLiveStream(config);
  startWebServer(config);
}
if (recording && recording.enabled) {
  startRecording(config);
}
monitorDiskSpace(config.recording);

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, function () {
    console.log('Exiting..');
    killRecording();
    killStream();
    process.exit(0);
  });
})
