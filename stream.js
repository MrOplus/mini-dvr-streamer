const ffmpeg = require('fluent-ffmpeg');
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const axios = require('axios');
var currentStream = null;
function startLiveStream(config) {
    const rtspUrl = config.rtspUrl;
    fs.ensureDirSync('stream');

    currentStream = ffmpeg(rtspUrl)
        .inputFormat('rtsp')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
            '-f', 'hls',
            '-hls_time', '2',
            '-hls_list_size', '10',
            '-hls_flags', 'delete_segments',
            '-hls_segment_filename', 'stream/stream%03d.ts'
        ])
        .output('stream/stream.m3u8')
        .on('start', (commandLine) => {
            commandLine = commandLine.replace(rtspUrl, '[REDACTED]');
            console.log('Live stream started with command:', commandLine);
        })
        .on('end', () => {
            console.log('Live stream ended, starting a new one.');
            setTimeout(() => {
                startLiveStream(config);
            }, 50);
        })
        .on('error', (err) => {
            var errorMessage = err.message.replace(rtspUrl, '[REDACTED]');
            console.error('Error during live stream:', errorMessage);
            if (errorMessage.includes('401 Unauthorized')) {
                console.error('Check if the RTSP URL is correct and credentials are provided.');
                process.exit(1);
                return;
            }
            setTimeout(() => {
                startLiveStream(config);
            }, 50);
        });

    currentStream.run();
}
function startWebServer(config) {
    const app = express();
    const port = config.liveStream.port || 3000;
    app.use(cors());
    const controlUrl = config.controlUrl;
    //basic credentials
    if (config.liveStream.credentials) {
        app.use((req, res, next) => {
            const auth = { login: config.liveStream.credentials.username, password: config.liveStream.credentials.password }
            const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
            const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
            if (!login || !password || login !== auth.login || password !== auth.password) {
                res.set('WWW-Authenticate', 'Basic realm="401"')
                res.status(401).send('Authentication required.')
                return
            }
            next()
        });
    }
    app.use(express.json());
    app.use(express.static('stream'));
    app.post('/move', (req, res) => {
        const direction = req.body.direction;
        axios.get(`${controlUrl}?-step=0&-act=${direction}&-speed=45`).then((response) => {
            res.send(response.data);
        }).catch((error) => {
            res.send(error);
        });
    });
    app.post('/release', (req, res) => {
        axios.get(`${controlUrl}?-step=0&-act=stop&-speed=45`).then((response) => {
            res.send(response.data);
        }).catch((error) => {
            res.send(error);
        });
    });
    app.listen(port, () => {
        console.log(`Web server started on http://localhost:${port}`);
    });
}
function killStream() {
    if (currentStream) {
        currentStream.ffmpegProc.stdin.write('q');
        currentStream.ffmpegProc.stdin.end();
        currentStream.kill('SIGKILL');
        currentStream.kill('SIGTERM');
        console.log('Killed live stream');
    }
}
module.exports = {
    startLiveStream,
    startWebServer,
    killStream
}