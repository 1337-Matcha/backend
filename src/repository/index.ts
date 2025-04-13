import * as save from './save';
import * as update from './update';
import * as find from './find';
import * as del from './delete';  // 'delete' is a reserved word
import { executeSqlQuery } from './query';

export const repository = {
  ...save,
  ...update,
  ...find,
  ...del,
  executeSqlQuery
};