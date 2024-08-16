import { ErrType } from '../errorCode';

/* dataset: 509000 */
export enum SystemErrEnum {
  communityVersionNumLimit = 'communityVersionNumLimit'
}
const systemErr = [
  {
    statusText: SystemErrEnum.communityVersionNumLimit,
    message: '数量过多！'
  }
];
export default systemErr.reduce((acc, cur, index) => {
  return {
    ...acc,
    [cur.statusText]: {
      code: 509000 + index,
      statusText: cur.statusText,
      message: cur.message,
      data: null
    }
  };
}, {} as ErrType<`${SystemErrEnum}`>);
