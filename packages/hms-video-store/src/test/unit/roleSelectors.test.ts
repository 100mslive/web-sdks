import {
  HMSStore,
  selectAvailableRoleNames,
  selectRolesMap,
  selectLocalPeerRole,
  selectRoleByRoleName,
  selectRoleChangeRequest,
  selectIsAllowedToPublish,
  selectIsAllowedToSubscribe,
} from '../../core';
import { hostRole, localPeer, makeFakeStore, remotePeer, ROLES, speakerRole } from '../fakeStore';

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
    expect(req?.requestedBy).toBe(remotePeer);
    expect(req?.role.name).toBe(ROLES.SPEAKER);
    expect(req?.role).toBe(speakerRole);
    expect(req?.token).toBe('123');
  });

  test('select role by name', () => {
    const storeHost = selectRoleByRoleName(ROLES.HOST)(fakeStore);
    expect(storeHost).not.toBeUndefined();
    expect(storeHost).toBe(hostRole);
  });

  test('publish params', () => {
    localPeer.roleName = ROLES.SPEAKER;
    const allowed = selectIsAllowedToPublish(fakeStore);
    expect(allowed.audio).toBe(true);
    expect(allowed.video).toBe(false);
    expect(allowed.screen).toBe(false);
  });

  test('publish params viewer', () => {
    localPeer.roleName = ROLES.VIEWER;
    const allowed = selectIsAllowedToPublish(fakeStore);
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
