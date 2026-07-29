import { SetMetadata } from '@nestjs/common';

export const CHECK_OLS_KEY = 'ols';
export const CheckOls = (objectApiName, action) => SetMetadata(CHECK_OLS_KEY, { objectApiName, action });
