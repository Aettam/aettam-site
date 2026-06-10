# Raspberry Pi → Sanctuary Stream Setup

The camera setup for tomorrow. The Pi captures video and pushes it to the VPS,
which relays it as HLS to the Sanctuary page. **The VPS side is already done** —
MediaMTX is running and the HLS route is wired through Caddy.

## The pipeline (already built)
```
┌──────────────┐   RTMP    ┌─────────────────────┐   HLS    ┌──────────────┐
│ Raspberry Pi │ ───────►  │ VPS: MediaMTX :1935 │ ──────►  │  Sanctuary   │
│ + camera/mic │  push     │ → HLS :8888 (Caddy) │  watch   │  /sanctuary  │
└──────────────┘           └─────────────────────┘          └──────────────┘
```

- **RTMP ingest:** `rtmp://24.199.123.34:1935/sanctuary` (port 1935 open on the VPS firewall)
- **HLS output:** `https://sanctuary.24-199-123-34.nip.io/hls/sanctuary/index.m3u8`
  (or `https://sanctuary.aettam.com/hls/sanctuary/index.m3u8` once DNS is pointed)

## On the Pi (tomorrow)

### 1. Install ffmpeg
```bash
sudo apt update && sudo apt install -y ffmpeg
```

### 2. Find the camera + mic
```bash
# Pi Camera Module → uses libcamera (no /dev/video0 by default on Bookworm)
libcamera-hello --list-cameras
# USB webcam → shows up as /dev/video0
v4l2-ctl --list-devices
# Microphone
arecord -l
```

### 3a. Push the stream — Pi Camera Module (libcamera)
```bash
libcamera-vid -t 0 --width 1280 --height 720 --framerate 30 --inline --codec h264 -o - | \
ffmpeg -re -i - -c:v copy -f flv rtmp://24.199.123.34:1935/sanctuary
```

### 3b. Push the stream — USB webcam + mic (re-encode, most compatible)
```bash
ffmpeg -f v4l2 -framerate 30 -video_size 1280x720 -i /dev/video0 \
       -f alsa -i default \
       -c:v libx264 -preset veryfast -tune zerolatency \
       -b:v 2500k -maxrate 2500k -bufsize 5000k -g 60 -pix_fmt yuv420p \
       -c:a aac -b:a 128k -ar 44100 \
       -f flv rtmp://24.199.123.34:1935/sanctuary
```

### 4. Flip the stream "live" in the admin dashboard
Go to **https://sanctuary.24-199-123-34.nip.io/admin-dashboard** → Stream Settings:
- **Stream URL:** `https://sanctuary.24-199-123-34.nip.io/hls/sanctuary/index.m3u8`
- **Status:** Live
- Save.

Initiates watching `/sanctuary` will see the feed within a few seconds.

## Make the Pi auto-stream on boot (optional)
Create `/etc/systemd/system/sanctuary-stream.service` on the Pi:
```ini
[Unit]
Description=AETTAM Sanctuary camera stream
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/bin/bash -c 'libcamera-vid -t 0 --width 1280 --height 720 --framerate 30 --inline --codec h264 -o - | ffmpeg -re -i - -c:v copy -f flv rtmp://24.199.123.34:1935/sanctuary'
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
Then: `sudo systemctl enable --now sanctuary-stream`

## Verify the relay (from any machine)
```bash
# When the Pi is pushing, this returns the HLS playlist:
curl -s https://sanctuary.24-199-123-34.nip.io/hls/sanctuary/index.m3u8
# Or open it in VLC: Media → Open Network Stream → paste the URL
```

## VPS-side reference (already configured)
- MediaMTX container: `docker ps --filter name=sanctuary-stream` (auto-restarts)
- Config: `/opt/sanctuary-stream/mediamtx.yml`
- Restart relay: `docker restart sanctuary-stream`
- Low-latency HLS is enabled (~1-2s delay)

## Security note
Right now anyone who knows the RTMP URL could publish. To lock it down, set
`publishUser`/`publishPass` in `mediamtx.yml` and add `?user=X&pass=Y` to the
Pi's RTMP URL. Fine to leave open for testing; lock before going public.
