import {IHasID} from 'dfts-helper';

export const trackBy = (_: number, it: IHasID<string>) => it.id;
