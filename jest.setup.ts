import { jest } from '@jest/globals';
import { run } from '@jxa/run';

// Mock @jxa/run
jest.mock('@jxa/run', () => ({
  run: jest.fn()
})); 