# Mini DVR Streamer

This project is a mini DVR streamer that records video streams from an RTSP source and saves the recordings to a specified directory. It also provides a live streaming feature with a web server to view the stream.

# Related Blogs Posts
1. https://mroplus.medium.com/reviving-an-outdated-ip-camera-a-journey-through-legacy-tech-and-modern-solutions-671f8e3c7ac1
2. https://mroplus.medium.com/turn-your-raspberrypi-into-a-nvr-3f1cc58a8497

## Features

- **Continuous Recording:** The script continuously records the video stream and starts a new recording when the previous one ends.
- **File Naming:** Recordings are named based on the start time, with the filename format `hour-minute-second.mp4`.
- **Automatic Deletion:** Monitors the available disk space, and if it exceeds the defined threshold, it deletes the oldest recordings to free up space.
- **Live Streaming:** Provides a live streaming feature with a web server to view the stream.
- **Basic Authentication:** Supports basic authentication for the live stream.

## Configuration

To use the script, create a `config.json` file with the following parameters (based on `config.example.json` file):

- **controlUrl:** The URL for controlling the camera.
- **timeZone:** The time zone used to name the recordings (list of time zones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
- **liveStream:** Configuration for the live stream.
  - **url:** The RTSP stream URL for live streaming.
  - **enabled:** Whether the live stream is enabled.
  - **port:** The port for the web server.
  - **credentials:** Basic authentication credentials for the live stream.
    - **username:** The username for the live stream.
    - **password:** The password for the live stream.
- **recording:** Configuration for the recording.
  - **url:** The RTSP stream URL for recording.
  - **recordingsDirectory:** The base directory where recordings are saved.
  - **diskSpaceThresholdMb:** The maximum size of the recording directory in megabytes. After the directory exceeds this size, the script will delete the oldest recordings to free up space.
  - **segmentTimeSeconds:** The duration of each recording segment in seconds.
  - **enabled:** Whether the recording is enabled.

Example `config.json`:

```json
{
    "controlUrl": "http://admin:admin@192.168.100.2/web/cgi-bin/hi3510/ptzctrl.cgi",
    "timeZone": "Asia/Dubai",
    "liveStream": {
        "url": "rtsp://admin:admin@192.168.100.2/2",
        "enabled": true,
        "port": 8054,
        "credentials": {
            "username": "admin",
            "password": "admin"
        }
    },
    "recording": {
        "url": "rtsp://admin:admin@192.168.100.2/1",
        "recordingsDirectory": "recordings",
        "diskSpaceThresholdMb": 10000,
        "segmentTimeSeconds": 600,
        "enabled": true
    }
}
```

## Running the Project

To run the project, first install the dependencies:

```bash
npm install
```

Then run the project:

```bash
npm start
```

or

```bash
node index.js
```

## Stopping the Project

To stop the project, press `Ctrl + C` in the terminal window where it is running.

## Tested Against

This project has been tested against `Prolynx IP Camera PL-WC0521` with software version `V7.7.4.1.1-20160920` and Device Id: `C6F0SeZ0N0P0L0`.
