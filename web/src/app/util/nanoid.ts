import {customAlphabet} from 'nanoid';

/**
 * Contains: a..z A..Z 0..9
 * Removed big letters: I J N O Q V
 * Removed small letters: d i l n q v
 * Removed numbers: 0
 */
const NANO_ID_SET = '123456789ABCDEFGHKLMPRSTUWXYZabcefghjkmoprstuwxyz';
const NANO_ID_DEFAULT_LENGTH = 21;
export const NANO_ID_SMALL_LENGTH = 12;

export const nanoid = customAlphabet(NANO_ID_SET, NANO_ID_DEFAULT_LENGTH);
