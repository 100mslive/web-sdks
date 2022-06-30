import Hls from "hls.js";
import { ToastManager } from "../../components/Toast/ToastManager";
import { FeatureFlags } from "../../services/FeatureFlags";
import {
  getSecondsFromTime,
  parseMetadataString,
  parseTagsList,
} from "./HLSUtils";

export class HLSController {
  hls;
  fragsTimeTable = {};
  constructor(hlsUrl, videoRef) {
    this.hls = new Hls(this.getHLSConfig());
    this.hls.loadSource(hlsUrl);
    this.hls.attachMedia(videoRef.current);
    this.registerEvents();
  }
  getHlsInstance() {
    return this.hls;
  }
  registerEvents() {
    /**
     * Everytime a fragment is appended to the buffer,
     * we parse the tags and see if the metadata is
     * in the tags. If it does, we parse the metadatastring
     * and create a timetable. This timetable is an array of key value
     * pairs with timeinSeconds as key and the value is an object
     * of the parsed metadata.
     * (e.g)
     *  {
     *   36206: {
     *     duration: "20",
     *     id: "c382fce1-d551-4862-bdb3-c255ca668154",
     *     payload: "hello2572",
     *     starTime: Tue Jun 28 2022 10:03:26 GMT+0530 (India Standard Time)
     *   }
     * }
     */
    this.hls.on(Hls.Events.BUFFER_APPENDED, (event, data) => {
      const frag = data?.frag;
      const tagList = frag?.tagList;

      const tagsMap = parseTagsList(tagList);
      const metadataString = tagsMap.rawTags["EXT-X-DATERANGE"];
      if (metadataString) {
        console.log(
          `%c fragment ${data.frag.relurl} containing Metadata added to buffer`,
          "background: #d9ed92; color: #184e77"
        );

        const tagMetadata = parseMetadataString(metadataString);
        const timeSegment = getSecondsFromTime(tagMetadata.starTime);
        this.fragsTimeTable[timeSegment.toString()] = {
          ...tagMetadata,
        };
        console.log(
          "%c TIMETABLE",
          "background: #d9ed92; color: #184e77",
          this.fragsTimeTable
        );
      }
    });

    /**
     * on Every Fragment change, we check if the fragment's
     * PROGRAM_TIME is nearby a possible metadata's START_TIME
     * If it does, we start a setTimeout and try to show it
     * on the right time.
     * NOTE: Javascript cannot gaurantee exact time, it
     * only gaurantees minimum time before trying to show.
     */
    this.hls.on(Hls.Events.FRAG_CHANGED, (event, data) => {
      const tagsList = parseTagsList(data?.frag.tagList);
      console.log(
        `%c Fragment Loaded. Program Time: ${tagsList.fragmentStartAt}`,
        "background: #264653; color: #Fafafa"
      );

      const timeSegment = getSecondsFromTime(tagsList.fragmentStartAt);
      const timeStampStrings = Object.keys(this.fragsTimeTable);
      const timeStamps = timeStampStrings.map(timeStamp => Number(timeStamp));
      let nearestTimeStamp = timeSegment;
      /**
       * There are two scenarios here.
       * 1) the program time is exactly same as a startime,
       * which means the below 'if' will fail.
       * 2) the program time is less than the startime,
       * which means it is not in the timeStamps array
       * which goes into the below if condition
       *
       * NOTE: PROGRAM_TIME canot be greated than START_TIME,
       * because the backend gaurantee that every time it sends
       * a metadata, its always for an event in the future.
       */
      if (timeStamps.indexOf(timeSegment) === -1) {
        /**
         * since we don't have the exact time in timeStamps, we push
         * our fragment's timeSegment(programtime) to the timestamp
         * and sort it. Once it's sorted, the next element to our
         * timeSegement is the nearest happening of a metadata startTime.
         * (e.g)
         * timestamp  = [5,10,12,15,16]
         * timeSegment = 13
         * we push timeSegment to timestamp => [5,10,12,15,16,13]
         * we sort it => [5,10,12,13,15,16]
         * now next element of timeSegment 13 is 15 which is always the nearest future
         * occurence of a metadata.
         */
        timeStamps.push(timeSegment);
        timeStamps.sort();
        console.log(
          `%c current segment starting at ${timeSegment} secs since stream started`,
          "background: #E76F51; color: #264653"
        );
        const whereAmI = timeStamps.indexOf(timeSegment);
        nearestTimeStamp = timeStamps[whereAmI + 1];
      } else {
        /**
         * If the timeSegment matches one of the startime,
         * then we dont need to push it, we can just sort it
         * and by the same logic above, the next element of
         * our timesegment is the nearest future occurence of
         * metadata.
         */
        timeStamps.sort();
        const whereAmI = timeStamps.indexOf(timeSegment);
        nearestTimeStamp = timeStamps[whereAmI];
      }

      /**
       * This check is if timestamp ends up on the
       * end of the array after sorting meaning
       * there is no possible future events.
       * Hence NearestTimeStamp will be undefined.
       */
      if (isNaN(nearestTimeStamp)) {
        return;
      }

      /**
       * at this point its gauranteed that we have a timesegment and a possible
       * future event very close. We now take the difference between them.
       * The difference must always be from 0(start of the fragment) to INF duration(end of the fragment)
       * if it is not, then the metadata doesn't belong to this fragment and we leavae it
       * 'as-is' so future fragments can try to parse it.
       *
       * (e.g) timestamp => [5,11,12,15,20,22], duration = 2.
       *
       * Fragment1_timesegment = 11 => nearestTimeStamp=>11 => 11 - 11 = 0 (play at start of the fragment)
       *
       * Fragment2_timesegment = 13 => nearestTimeStamp=>15 => 15 - 13 = 2 (still inside duration.
       * so play after 2 sec of the start of the fragment)
       *
       * Fragment3_timesegment = 15 => nearestTimeStamp=>20 => 20 - 15 = 5 (5 is greated than duration 2. so
       * this does not belong to this fragment. ignore and move on to next fragment)
       *
       * Fragment4_timesegment = 19 => nearestTimeStamp=>20 => 20 - 19 = 1 (valid)
       *
       */

      const timeDifference = nearestTimeStamp - timeSegment;
      if (timeDifference >= 0 && timeDifference < tagsList.duration) {
        console.log(
          `%c found metadata with start time ${nearestTimeStamp}. playing in current segment ${timeDifference} sec later. Fetching payload...`,
          "background: #ffba08; color: #370617"
        );

        const payload = this.fragsTimeTable[nearestTimeStamp].payload;
        console.log(
          `%c Payload: ${payload}`,
          "color:#2b2d42; background:#d80032"
        );
        /**
         * we start a timeout for difference seconds.
         * NOTE: Due to how setTimeout works, the time is only the minimum gauranteed
         * time JS will wait before calling Toast and confetti. It's not guaranteed even
         * for timeDifference = 0.
         */
        setTimeout(() => {
          ToastManager.addToast({
            title: `Payload shown at ${this.fragsTimeTable[nearestTimeStamp].starTime}: ${payload}`,
          });
          window.sendConfetti();
          console.log(
            `Finished delivering payload.Deleting ${nearestTimeStamp} from timetable`
          );
          /** we delete the occured events from the timetable. This is not
           * needed for the operation. Just a bit of optimisation as a really
           * long stream with many metadata can quickly make the timetable really big.
           */
          delete this.fragsTimeTable[nearestTimeStamp];
        }, timeDifference * 1000);
      }
    });
  }

  getHLSConfig() {
    if (FeatureFlags.optimiseHLSLatency()) {
      // should reduce the latency by around 2-3 more seconds. Won't work well without good internet.
      return {
        enableWorker: true,
        liveSyncDuration: 1,
        liveMaxLatencyDuration: 5,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 1,
      };
    }
    return {};
  }
}
