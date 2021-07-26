import {
  HMSStore,
  selectAvailableRoleNames,
  selectRolesMap,
  selectLocalPeerRole,
  selectRoleByRoleName,
  selectRoleChangeRequest,
} from '../../core';
import { hostRole, makeFakeStore, remotePeer, speakerRole } from '../fakeStore';

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
    expect(roleNames).toContain('speaker');
    expect(roleNames).toContain('host');
    expect(roleNames).toContain('viewer');
    expect(roleNames).not.toContain('student');
  });

  test('select local peer role', () => {
    expect(selectLocalPeerRole(fakeStore)).toBe(hostRole);
  });

  test('selectRole change request', () => {
    const req = selectRoleChangeRequest(fakeStore);
    expect(req?.requestedBy).toBe(remotePeer);
    expect(req?.role.name).toBe('speaker');
    expect(req?.role).toBe(speakerRole);
    expect(req?.token).toBe('123');
  });

  test('select role by name', () => {
    const storeHost = selectRoleByRoleName('host')(fakeStore);
    expect(storeHost).not.toBeUndefined();
    expect(storeHost).toBe(hostRole);
  });
});
