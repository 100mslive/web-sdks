import {
  HMSStore,
  selectAvailableRoleNames,
  selectIsAllowedToPublish,
  selectIsAllowedToSubscribe,
  selectIsRoleAllowedToPublish,
  selectLocalPeerRole,
  selectRoleByRoleName,
  selectRoleChangeRequest,
  selectRolesMap,
} from '../../';
import { hostRole, localPeer, makeFakeStore, remotePeerOne, ROLES, speakerRole } from '../fakeStore';

let fakeStore: HMSStore;

// start from a new fake store for every test
beforeEach(() => {
  fakeStore = makeFakeStore();
});

describe('test role related selectors', () => {
  test('select roles', () => {
    const storeRoles = selectRolesMap(fakeStore);
    expect(storeRoles.host).not.toBeUndefined();
    expect(storeRoles.speaker).not.toBeUndefined();
    expect(storeRoles.viewer).not.toBeUndefined();
    expect(storeRoles.student).toBeUndefined();

    const roleNames = selectAvailableRoleNames(fakeStore);
    expect(roleNames).toContain(ROLES.SPEAKER);
    expect(roleNames).toContain(ROLES.HOST);
    expect(roleNames).toContain(ROLES.VIEWER);
    expect(roleNames).not.toContain('student');
  });

  test('select local peer role', () => {
    expect(selectLocalPeerRole(fakeStore)).toBe(hostRole);
  });

  test('selectRole change request', () => {
    const req = selectRoleChangeRequest(fakeStore);
    expect(req?.requestedBy).toBe(remotePeerOne);
    expect(req?.role.name).toBe(ROLES.SPEAKER);
    expect(req?.role).toBe(speakerRole);
    expect(req?.token).toBe('123');
  });

  test('select role by name', () => {
    const storeHost = selectRoleByRoleName(ROLES.HOST)(fakeStore);
    expect(storeHost).not.toBeUndefined();
    expect(storeHost).toBe(hostRole);
  });

  test('local peer publish params', () => {
    const allowed = selectIsAllowedToPublish(fakeStore);
    expect(allowed.audio).toBe(true);
    expect(allowed.video).toBe(true);
    expect(allowed.screen).toBe(true);
  });

  test('publish params', () => {
    const allowed = selectIsRoleAllowedToPublish(ROLES.SPEAKER)(fakeStore);
    expect(allowed.audio).toBe(true);
    expect(allowed.video).toBe(false);
    expect(allowed.screen).toBe(false);
  });

  test('publish params viewer', () => {
    const allowed = selectIsRoleAllowedToPublish(ROLES.VIEWER)(fakeStore);
    expect(allowed.audio).toBe(false);
    expect(allowed.video).toBe(false);
    expect(allowed.screen).toBe(false);
  });

  test('is subscription allowed true', () => {
    localPeer.roleName = ROLES.SPEAKER;
    expect(selectIsAllowedToSubscribe(fakeStore)).toBe(true);
  });

  test('is subscription allowed false', () => {
    localPeer.roleName = ROLES.NOSUBSCRIBE;
    expect(selectIsAllowedToSubscribe(fakeStore)).toBe(false);
  });
});
