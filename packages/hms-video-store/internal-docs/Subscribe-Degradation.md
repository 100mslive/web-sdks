# Subscribe Degradation based on Packet Loss

## Added

- **RTCStatsMonitor** - monitors packetsLost(using peerconnection.getStats) every 1 second and emits RTC_STATS_CHANGE event.
- **TrackDegradationController** - listens to change in packetsLost and recovers/degrades accordingly.

### TrackDegradationController (TDC)

- If packetsLost increases beyond a threshold(fetched from policy), degrade.
- If packetsLost stabilizes, recover.

#### Degrade Action

- Get tracks to degrade from store sorted on their importance(Screenshare > Role Priority > Speaker > TrackId)
- Set the simulcast layer of least important track to NONE - stop receiving packets for this track.
- This prevents important tracks to play seamlessly on bad network condition.

#### Recover Action

- Get most important track that has previously been degraded, set simulcast layer to HIGH.

> The degrade/recover action will take some time to reflect on the packetsLost, hence there's a grace period before which we start degrade/recover again. These parameters(threshold, grace periods) comes from the peer's policy's subscribeParams.

- The TDC will emit events on degrade and recover, this is forwarded to the client through update listener through HMStransport and HMSSdk.
- Added `TRACK_DEGRADED`, `TRACK_RECOVERED` in `HMSTrackUpdate`.

- Added `sinks` in `HMSVideoTrack` to store the video elements attached with a video track.

> Tested using Network Link Conditioner to simulate bad network conditions.

## Future Improvements

- Degrade using the available simulcast layers. `high -> medium -> low -> none` instead of directly `high -> none`.
- Mock store, notifications and test store and comparators.
