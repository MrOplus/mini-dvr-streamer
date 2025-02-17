const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');


var currentRecording = null;
function startRecording(config) {
    const localTimeZone = config.timeZone || 'Europe/Warsaw';
    const startTimestamp = moment().tz(localTimeZone);
    const dateFolder = startTimestamp.format('YYYY.MM.DD');
    const timeFilename = startTimestamp.format('HH-mm-ss');
    const rtspUrl = config.rtspUrl;
    const baseRecordingsDirectory = config.recording.recordingsDirectory;
    const segmentTime = config.recording.segmentTimeSeconds || 120;

    const recordingsDirectory = path.join(baseRecordingsDirectory, dateFolder);

    // create recordings directory if not exists
    fs.ensureDirSync(recordingsDirectory);

    const outputPath = path.join(recordingsDirectory, `${timeFilename}.mp4`);

    currentRecording = ffmpeg(rtspUrl)
        .inputFormat('rtsp')
        .videoCodec('libx265')
        .audioCodec('aac')
        .outputOptions([
            '-reset_timestamps', '1',
            '-rtsp_transport', 'tcp',
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
            console.log('Recording started with command:', commandLine);
        })
        .on('end', () => {
            console.log('Recording ended, starting a new one.');
            setTimeout(() => {
                startRecording(config);
            }, 50);
        })
        .on('error', (err) => {
            var errorMessage = err.message;
            console.error('Error during recording:', errorMessage);
            if (errorMessage.includes('401 Unauthorized')) {
                console.error('Check if the RTSP URL is correct and credentials are provided.');
                process.exit(1);
                return;
            }
            setTimeout(() => {
                startRecording(config);
            }, 50);
        });

    // stop recording after x seconds
    setTimeout(() => {
        console.log('Stopping segment..');
        stopRecording();
    }, segmentTime * 1000);

    currentRecording.run();
}

function stopRecording() {
    if (currentRecording) {
        currentRecording.ffmpegProc.stdin.write('q');
        currentRecording.ffmpegProc.stdin.end();
        console.log('Recording stopped.');
    }
}

function killRecording() {
    if (currentRecording) {
        currentRecording.ffmpegProc.stdin.write('q');
        currentRecording.ffmpegProc.stdin.end();
        currentRecording.kill('SIGKILL');
        currentRecording.kill('SIGTERM');
        console.log('Killed recording');
    }
}

module.exports = {
    startRecording,
    stopRecording,
    killRecording
}