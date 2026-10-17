import { SetMetadata } from '@nestjs/common';

export const SYSTEM_PERM_KEY = 'systemPerm';
export const RequireSystemPerm = (permKey) => SetMetadata(SYSTEM_PERM_KEY, permKey);
