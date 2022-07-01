import Hls from "hls.js";
import { FeatureFlags } from "../../services/FeatureFlags";
import { HLSEvent, HLSEventReactor } from "./HLSEvent";
import {
  getSecondsFromTime,
  isMetadataAlreadyInTimeTable,
  parseMetadataString,
  parseTagsList,
} from "./HLSUtils";

export class HLSController {
  hls;
  fragsTimeTable = new Map();
  reactor = new HLSEventReactor();
  constructor(hlsUrl, videoRef) {
    this.hls = new Hls(this.getHLSConfig());
    this.hls.loadSource(hlsUrl);
    this.hls.attachMedia(videoRef.current);
    this.handleHLSTimedMetadataParsing();
    this.ControllerEvents = [HLSEvent.HLS_TIMED_METADATA_LOADED];
  }

  reset() {
    this.fragsTimeTable = null;
    this.reactor = null;
    this.hls = null;
  }

  getHlsInstance() {
    return this.hls;
  }

  /**
   * Event listener. Also takes HLS JS events. If its
   * not a Controller's event, it just forwards the
   * request to hlsjs
   * @param {string | Hls.Events} eventName
   * @param {Function} eventCallback
   */
  on(eventName, eventCallback) {
    if (this.ControllerEvents.indexOf(eventName) === -1) {
      this.hls.on(eventName, eventCallback);
    } else {
      this.reactor.registerEvent(eventName);
      this.reactor.addEventListener(eventName, eventCallback);
    }
  }

  handleHLSTimedMetadataParsing() {
    /**
     * Everytime a fragment is appended to the buffer,
     * we parse the tags and see if the metadata is
     * in the tags. If it does, we parse the metadatastrings
     * and create a timetable. This timetable is an array of key value
     * pairs with timeinSeconds as key and the value is an array of objects
     * of the parsed metadata.
     * (e.g)
     *  {
     *   36206: [{
     *     duration: "20",
     *     id: "c382fce1-d551-4862-bdb3-c255ca668154",
     *     payload: "hello2572",
     *     starTime: Tue Jun 28 2022 10:03:26 GMT+0530 (India Standard Time)
     *   }]
     * }
     */
    this.hls.on(Hls.Events.BUFFER_APPENDED, (event, data) => {
      const frag = data?.frag;
      const tagList = frag?.tagList;
      const tagsMap = parseTagsList(tagList);
      /**
       * There could be more than one EXT-X-DATERANGE tags in a fragment.
       * Currently its limited to 3 by backend.
       */
      const metadataStrings = tagsMap.rawTags["EXT-X-DATERANGE"];
      if (metadataStrings.length > 0) {
        for (let metadataString of metadataStrings) {
          const tagMetadata = parseMetadataString(metadataString);
          const timeSegment = getSecondsFromTime(tagMetadata.starTime);
          /**
           * a single timestamp can have upto 3 DATERANGE tags.
           * so we accumulate everything into a single key such that
           * <timesegment>: [mt1, mt2, mt3]
           */
          if (this.fragsTimeTable.has(timeSegment)) {
            // timetable already exist
            const fragsTimeTableEntries = this.fragsTimeTable.get(timeSegment);

            /**
             * Backend will keep sending the same metadata tags in each fragments
             * until the fragment programtime exceed metadata starttime. so to prevent
             * same tags getting parsed into timetable, we do a quick check here.
             */
            if (
              !isMetadataAlreadyInTimeTable(fragsTimeTableEntries, tagMetadata)
            ) {
              // append current metadata to existing timestamp
              this.fragsTimeTable.get(timeSegment).push({
                ...tagMetadata,
              });
            }
          } else {
            // no entry in timetable exist. So add a new entry
            this.fragsTimeTable.set(timeSegment, [
              {
                ...tagMetadata,
              },
            ]);
          }
        }
      }
    });

    /**
     * on Every Fragment change, we check if the fragment's
     * PROGRAM_TIME is nearby a possible metadata's START_TIME
     * If it does, we start a setTimeout and try to dispatch an event
     * on the right time.
     * NOTE: Javascript cannot gaurantee exact time, it
     * only gaurantees minimum time before trying to dispatch.
     */
    this.hls.on(Hls.Events.FRAG_CHANGED, (event, data) => {
      const tagsList = parseTagsList(data?.frag.tagList);
      const timeSegment = getSecondsFromTime(tagsList.fragmentStartAt);
      const timeStamps = [];
      this.fragsTimeTable.forEach((value, key) => {
        timeStamps.push(key);
      });
      let nearestTimeStamp = timeSegment;
      /**
       * There are two scenarios here.
       * 1) the program time is exactly same as a startime,
       * which means the below 'if' will fail.
       * 2) the program time is behind the startime,
       * which means it is not in the timeStamps array
       * which goes into the below if condition
       *
       * NOTE: PROGRAM_TIME canot be ahead than START_TIME,
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
       * end of the array after sorting. Meaning,
       * there is no possible future events.
       * Hence NearestTimeStamp will be undefined.
       */
      if (isNaN(nearestTimeStamp)) {
        return;
      }

      /**
       * at this point its gauranteed that we have a timesegment and a possible
       * future event very close. We now take the difference between them.
       * The difference must always be between 0(start of the fragment) and INF duration(end of the fragment)
       * if it is not, then the metadata doesn't belong to this fragment and we leave it
       * 'as-is' so future fragments can try to parse it.
       *
       * (e.g) timestamp => [5,11,12,15,20,22], duration = 2.
       *
       * Fragment1_timesegment = 11 => nearestTimeStamp=>11 => 11 - 11 = 0 (play at start of the fragment)
       *
       * Fragment2_timesegment = 14 => nearestTimeStamp=>15 => 15 - 14 = 1 (still inside duration.
       * so play after 1 sec of the start of the fragment)
       *
       * Fragment3_timesegment = 15 => nearestTimeStamp=>20 => 20 - 15 = 5 (5 is greated than duration 2. so
       * this does not belong to this fragment. ignore and move on to next fragment)
       *
       * Fragment4_timesegment = 19 => nearestTimeStamp=>20 => 20 - 19 = 1 (valid)
       *
       */

      const timeDifference = nearestTimeStamp - timeSegment;
      if (timeDifference >= 0 && timeDifference < tagsList.duration) {
        const payload = this.fragsTimeTable
          .get(nearestTimeStamp)
          .map(metadata => metadata.payload);
        /**
         * we start a timeout for difference seconds.
         * NOTE: Due to how setTimeout works, the time is only the minimum gauranteed
         * time JS will wait before calling dispatch(). It's not guaranteed even
         * for timeDifference = 0.
         */
        setTimeout(() => {
          /**
           * finally dispatch event letting the user know its time to
           * do whatever they want with the payload
           */
          this.reactor.dispatchEvent(
            HLSEvent.HLS_TIMED_METADATA_LOADED,
            payload
          );
          /** we delete the occured events from the timetable. This is not
           * needed for the operation. Just a bit of optimisation as a really
           * long stream with many metadata can quickly make the timetable really big.
           */
          this.fragsTimeTable.delete(nearestTimeStamp);
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
