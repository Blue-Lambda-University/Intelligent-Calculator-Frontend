import { describe,it,expect } from 'vitest';
import { prettify } from './api';
describe('result formatting',()=>{
  it('formats thousands',()=>expect(prettify(12345)).toBe('12,345'));
  it('does not overflow scientific precision',()=>expect(prettify(0.5)).toBe('0.5'));
});
