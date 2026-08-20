import { settingsRepository } from '../db/repositories/settingsRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers, socketHandler } from '../sockets/socketHandler.js';
import { getDatabase } from '../db/database.js';

export class InsufficientCreditsError extends Error {
  public statusCode = 402;
  public status = 402;
  public currentBalance: number;
  public requiredCredits: number;

  constructor(currentBalance: number, requiredCredits: number) {
    super(`Insufficient AI credits. Current balance: ${currentBalance}, Required: ${requiredCredits}. Please top up.`);
    this.name = 'InsufficientCreditsError';
    this.currentBalance = currentBalance;
    this.requiredCredits = requiredCredits;
  }
}

export class CreditService {
  private DEFAULT_STARTING_CREDITS = 100;

  public getCredits(): number {
    const credits = settingsRepository.getCredits();
    return typeof credits === 'number' ? credits : this.DEFAULT_STARTING_CREDITS;
  }

  public getBalance(): number {
    return this.getCredits();
  }

  public checkCredits(required: number): boolean {
    return this.getCredits() >= required;
  }

  public hasEnoughCredits(cost: number): boolean {
    return this.getCredits() >= cost;
  }

  public deductCredits(
    arg1: string | number,
    arg2?: string | number,
    arg3?: string
  ): { success: boolean; creditBalance: number } {
    let userId = 'user-cam';
    let amount = 0;
    let reason = 'AI Operation';

    if (typeof arg1 === 'number') {
      amount = arg1;
      reason = typeof arg2 === 'string' ? arg2 : 'AI Operation';
      userId = typeof arg3 === 'string' ? arg3 : 'user-cam';
    } else {
      userId = arg1;
      amount = typeof arg2 === 'number' ? arg2 : 0;
      reason = typeof arg3 === 'string' ? arg3 : 'AI Operation';
    }

    if (amount <= 0) {
      return { success: true, creditBalance: this.getCredits() };
    }

    const db = getDatabase();
    const deductTx = db.transaction(() => {
      const current = settingsRepository.getCredits();
      if (current < amount) {
        throw new InsufficientCreditsError(current, amount);
      }

      const newBalance = current - amount;
      settingsRepository.setCredits(newBalance);

      const activity = activityRepository.logActivity({
        user_id: userId,
        action_type: 'credits_deducted',
        target_type: 'settings',
        target_id: 'team_credits',
        target_title: `Deducted ${amount} Credits (${reason})`,
        details: { amount, remaining: newBalance, reason, userId },
      });

      return { newBalance, activity };
    });

    const { newBalance, activity } = deductTx();

    broadcastHelpers.broadcastCreditsUpdated(null, newBalance, -amount, reason, userId, activity);

    return { success: true, creditBalance: newBalance };
  }

  public topUpCredits(arg1: string | number, arg2?: string | number): number {
    let userId = 'user-cam';
    let amount = 0;

    if (typeof arg1 === 'number') {
      amount = arg1;
      userId = typeof arg2 === 'string' ? arg2 : 'user-cam';
    } else {
      userId = arg1;
      amount = typeof arg2 === 'number' ? arg2 : 0;
    }

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Top-up amount must be a positive number greater than 0');
    }

    const db = getDatabase();
    const topupTx = db.transaction(() => {
      const current = settingsRepository.getCredits();
      const newBalance = current + amount;
      settingsRepository.setCredits(newBalance);

      const activity = activityRepository.logActivity({
        user_id: userId,
        action_type: 'credits_topup',
        target_type: 'settings',
        target_id: 'team_credits',
        target_title: `Topped up +${amount} Credits`,
        details: { amount, newBalance, userId },
      });

      return { newBalance, activity };
    });

    const { newBalance, activity } = topupTx();

    broadcastHelpers.broadcastCreditsUpdated(null, newBalance, amount, 'Credit Top-up', userId, activity);

    return newBalance;
  }

  public topupCredits(arg1: string | number, arg2?: string | number): { creditBalance: number } {
    const newBalance = this.topUpCredits(arg1, arg2);
    return { creditBalance: newBalance };
  }

  public resetCredits(userId: string = 'user-cam', amount: number = 100): { creditBalance: number } {
    const db = getDatabase();
    const resetTx = db.transaction(() => {
      settingsRepository.setCredits(amount);
      const activity = activityRepository.logActivity({
        user_id: userId,
        action_type: 'credits_reset',
        target_type: 'settings',
        target_id: 'team_credits',
        target_title: `Reset Credits to ${amount}`,
        details: { amount, userId },
      });
      return { newBalance: amount, activity };
    });

    const { newBalance, activity } = resetTx();

    broadcastHelpers.broadcastCreditsUpdated(null, newBalance, 0, 'Dev Credit Reset', userId, activity);

    return { creditBalance: newBalance };
  }
}

export const creditService = new CreditService();
export default creditService;
