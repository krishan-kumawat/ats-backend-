import { SetMetadata } from '@nestjs/common';

export const RECORD_ACCESS_KEY = 'recordAccess';

export const RequireRecordAccess = (resourceType, accessLevel, idParamName = 'id') =>
  SetMetadata(RECORD_ACCESS_KEY, { resourceType, accessLevel, idParamName });
