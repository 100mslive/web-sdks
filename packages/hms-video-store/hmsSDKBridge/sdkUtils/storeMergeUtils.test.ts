import { HMSPeerID, HMSTrack } from '../../schema';
import { mergeNewTracksInDraft } from './storeMergeUtils';
import { makeFakeTrack } from '../../../storybook/fixtures/trackFixtures';

type HMSTrackMap = Record<HMSPeerID, HMSTrack>;
let draftTracks: Record<HMSPeerID, Partial<HMSTrack>>,
  newTracks: Record<HMSPeerID, Partial<HMSTrack>>;

describe('tracks merge is happening properly', () => {
  let fakeTrack: HMSTrack;
  let draftTracksCopy: Record<HMSPeerID, Partial<HMSTrack>>;
  beforeEach(() => {
    draftTracks = {};
    newTracks = {};
    draftTracksCopy = draftTracks;
    fakeTrack = makeFakeTrack();
  });

  const expectNoReferenceChange = () => {
    expect(draftTracks).toBe(draftTracksCopy);
  };

  test('no errors with empty tracks', () => {
    mergeNewTracksInDraft(draftTracks as HMSTrackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks).toEqual({});
  });

  test('track is deleted from draft if gone', () => {
    draftTracks[fakeTrack.id] = fakeTrack;
    mergeNewTracksInDraft(draftTracks as HMSTrackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks).toEqual({});
  });

  test('new track is added to draft', () => {
    newTracks[fakeTrack.id] = fakeTrack;
    mergeNewTracksInDraft(draftTracks as HMSTrackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks).toEqual(newTracks);
  });

  test('old track update maintains reference', () => {
    const clonedTrack = { ...fakeTrack, enabled: true, height: 357 };
    draftTracks[fakeTrack.id] = fakeTrack;
    newTracks[clonedTrack.id] = clonedTrack;
    mergeNewTracksInDraft(draftTracks as HMSTrackMap, newTracks);
    expectNoReferenceChange();
    expect(draftTracks[fakeTrack.id]).toBe(fakeTrack);
    expect(fakeTrack.enabled).toBe(true);
    expect(fakeTrack.height).toBe(357);
    expect(fakeTrack).not.toBe(clonedTrack);
  });

  test('partial update does not override older data', () => {
    const clonedTrack = { ...fakeTrack };
    fakeTrack.height = 450;
    draftTracks[fakeTrack.id] = fakeTrack;
    newTracks[clonedTrack.id] = clonedTrack;
    mergeNewTracksInDraft(draftTracks as HMSTrackMap, newTracks);
    expectNoReferenceChange();
    expect(fakeTrack.height).toBe(450);
    expect(clonedTrack.height).toBeUndefined();
  });
});
