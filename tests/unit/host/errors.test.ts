import { describe, expect, it } from 'vitest';
import { errorMessage } from '../../../host/errors.js';

describe('errorMessage', () => {
  it('returns the message of an Error', () => {
    expect(errorMessage(new TypeError('bad input'))).toBe('bad input');
  });

  it('converts anything else to a string', () => {
    expect(errorMessage('plain text')).toBe('plain text');
    expect(errorMessage(42)).toBe('42');
  });
});
