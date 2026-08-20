import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase } from '../../server/db/database.js';
import { seedDatabase } from '../../server/db/seed.js';
import { creditService, InsufficientCreditsError } from '../../server/services/creditService.js';
import { settingsRepository } from '../../server/db/repositories/settingsRepository.js';

describe('Credit Service & Atomic Operations', () => {
  beforeEach(() => {
    initDatabase(':memory:');
    seedDatabase(true);
  });

  afterEach(() => {
    closeDatabase();
  });

  it('initializes with 100 starter credits', () => {
    expect(creditService.getCredits()).toBe(100);
  });

  it('deducts 5 credits for guide generation', () => {
    const result = creditService.deductCredits('user-cam', 5, 'Guide Gen');
    expect(result.success).toBe(true);
    expect(result.creditBalance).toBe(95);
    expect(creditService.getCredits()).toBe(95);
  });

  it('deducts 10 credits for roadmap generation', () => {
    const result = creditService.deductCredits('user-alex', 10, 'Roadmap Gen');
    expect(result.success).toBe(true);
    expect(result.creditBalance).toBe(90);
    expect(creditService.getCredits()).toBe(90);
  });

  it('throws InsufficientCreditsError (402) when balance is insufficient', () => {
    settingsRepository.setCredits(3);

    expect(() => {
      creditService.deductCredits('user-cam', 5, 'Guide Gen');
    }).toThrow(InsufficientCreditsError);

    // Balance must remain intact
    expect(creditService.getCredits()).toBe(3);
  });

  it('supports +50 and +100 credit top-ups', () => {
    creditService.topUpCredits('user-liam', 50);
    expect(creditService.getCredits()).toBe(150);

    creditService.topUpCredits('user-alex', 100);
    expect(creditService.getCredits()).toBe(250);
  });
});
