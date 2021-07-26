import { createSelector } from 'reselect';
import { selectRolesMap } from './selectors';

export const selectRoleByRoleName = (roleName: string) =>
  createSelector([selectRolesMap], rolesMap => rolesMap[roleName]);
