import { LoyaltyTier } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * Loyalty tier thresholds (in points)
 */
export const LOYALTY_TIERS = {
  BRONZE: { min: 0, max: 199 },
  SILVER: { min: 200, max: 499 },
  GOLD: { min: 500, max: Infinity },
};

/**
 * Loyalty tier benefits
 */
export const TIER_BENEFITS = {
  BRONZE: {
    discountRate: 0, // 0%
    pointsMultiplier: 1, // 1x points
    birthdayBonus: 50,
  },
  SILVER: {
    discountRate: 0.05, // 5%
    pointsMultiplier: 1.25, // 1.25x points
    birthdayBonus: 100,
  },
  GOLD: {
    discountRate: 0.10, // 10%
    pointsMultiplier: 1.5, // 1.5x points
    birthdayBonus: 200,
  },
};

/**
 * Service for managing customer loyalty program
 */
export class LoyaltyService {
  /**
   * Determine the correct loyalty tier based on points
   */
  static calculateTier(points: number): LoyaltyTier {
    if (points >= LOYALTY_TIERS.GOLD.min) {
      return 'GOLD';
    } else if (points >= LOYALTY_TIERS.SILVER.min) {
      return 'SILVER';
    } else {
      return 'BRONZE';
    }
  }

  /**
   * Check if customer's tier needs to be upgraded
   * @returns The new tier if upgrade needed, null otherwise
   */
  static checkTierUpgrade(
    currentPoints: number,
    currentTier: LoyaltyTier
  ): LoyaltyTier | null {
    const correctTier = this.calculateTier(currentPoints);

    if (correctTier !== currentTier) {
      return correctTier;
    }

    return null;
  }

  /**
   * Update customer's loyalty tier based on their points
   */
  static async updateCustomerTier(
    customerId: string
  ): Promise<{ upgraded: boolean; oldTier: LoyaltyTier; newTier: LoyaltyTier }> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const newTier = this.checkTierUpgrade(
      customer.loyaltyPoints,
      customer.loyaltyTier
    );

    if (newTier) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyTier: newTier,
        },
      });

      console.log(
        `Customer ${customerId} upgraded from ${customer.loyaltyTier} to ${newTier} (${customer.loyaltyPoints} points)`
      );

      return {
        upgraded: true,
        oldTier: customer.loyaltyTier,
        newTier,
      };
    }

    return {
      upgraded: false,
      oldTier: customer.loyaltyTier,
      newTier: customer.loyaltyTier,
    };
  }

  /**
   * Calculate points earned for a purchase
   * Applies tier multiplier
   */
  static calculatePointsEarned(
    purchaseAmount: number,
    loyaltyTier: LoyaltyTier
  ): number {
    const basePoints = Math.floor(purchaseAmount); // 1 point per $1
    const multiplier = TIER_BENEFITS[loyaltyTier].pointsMultiplier;
    return Math.floor(basePoints * multiplier);
  }

  /**
   * Calculate tier discount for a purchase
   */
  static calculateTierDiscount(
    subtotal: number,
    loyaltyTier: LoyaltyTier
  ): number {
    const discountRate = TIER_BENEFITS[loyaltyTier].discountRate;
    return subtotal * discountRate;
  }

  /**
   * Check if today is customer's birthday
   */
  static async checkBirthdayBonus(
    customerId: string
  ): Promise<{ isBirthday: boolean; bonusPoints: number }> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        birthday: true,
        loyaltyTier: true,
      },
    });

    if (!customer || !customer.birthday) {
      return { isBirthday: false, bonusPoints: 0 };
    }

    const today = new Date();
    const birthday = new Date(customer.birthday);

    const isBirthday =
      today.getMonth() === birthday.getMonth() &&
      today.getDate() === birthday.getDate();

    if (isBirthday) {
      const bonusPoints = TIER_BENEFITS[customer.loyaltyTier].birthdayBonus;
      return { isBirthday: true, bonusPoints };
    }

    return { isBirthday: false, bonusPoints: 0 };
  }

  /**
   * Award birthday bonus points
   */
  static async awardBirthdayBonus(customerId: string): Promise<number> {
    const { isBirthday, bonusPoints } = await this.checkBirthdayBonus(
      customerId
    );

    if (!isBirthday || bonusPoints === 0) {
      return 0;
    }

    // Check if bonus already awarded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingBonus = await prisma.loyaltyTransaction.findFirst({
      where: {
        customerId,
        type: 'EARNED',
        description: {
          contains: 'Birthday bonus',
        },
        createdAt: {
          gte: today,
        },
      },
    });

    if (existingBonus) {
      return 0; // Already awarded today
    }

    // Award bonus
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: bonusPoints,
          },
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          customerId,
          type: 'EARNED',
          points: bonusPoints,
          description: `Birthday bonus - ${bonusPoints} points`,
        },
      }),
    ]);

    console.log(
      `Awarded ${bonusPoints} birthday bonus points to customer ${customerId}`
    );

    // Check for tier upgrade
    await this.updateCustomerTier(customerId);

    return bonusPoints;
  }

  /**
   * Get customer's loyalty summary
   */
  static async getCustomerSummary(customerId: string): Promise<{
    points: number;
    tier: LoyaltyTier;
    pointsToNextTier: number | null;
    tierBenefits: typeof TIER_BENEFITS[LoyaltyTier];
    recentTransactions: Array<{
      type: string;
      points: number;
      date: Date;
      description: string | null;
    }>;
  }> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        loyaltyPoints: true,
        loyaltyTier: true,
        loyaltyTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate points to next tier
    let pointsToNextTier: number | null = null;
    if (customer.loyaltyTier === 'BRONZE') {
      pointsToNextTier = LOYALTY_TIERS.SILVER.min - customer.loyaltyPoints;
    } else if (customer.loyaltyTier === 'SILVER') {
      pointsToNextTier = LOYALTY_TIERS.GOLD.min - customer.loyaltyPoints;
    }

    return {
      points: customer.loyaltyPoints,
      tier: customer.loyaltyTier,
      pointsToNextTier,
      tierBenefits: TIER_BENEFITS[customer.loyaltyTier],
      recentTransactions: customer.loyaltyTransactions.map((lt) => ({
        type: lt.type,
        points: lt.points,
        date: lt.createdAt,
        description: lt.description,
      })),
    };
  }

  /**
   * Expire old points (example: points older than 1 year)
   */
  static async expireOldPoints(daysToExpire: number = 365): Promise<{
    customersAffected: number;
    pointsExpired: number;
  }> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - daysToExpire);

    const oldTransactions = await prisma.loyaltyTransaction.findMany({
      where: {
        type: 'EARNED',
        createdAt: {
          lt: expiryDate,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    const customerPointsMap = new Map<string, number>();

    for (const transaction of oldTransactions) {
      const customerId = transaction.customer.id;
      const currentExpired = customerPointsMap.get(customerId) || 0;
      customerPointsMap.set(customerId, currentExpired + transaction.points);
    }

    let totalPointsExpired = 0;

    for (const [customerId, pointsToExpire] of customerPointsMap.entries()) {
      await prisma.$transaction([
        prisma.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: {
              decrement: pointsToExpire,
            },
          },
        }),
        prisma.loyaltyTransaction.create({
          data: {
            customerId,
            type: 'EXPIRED',
            points: -pointsToExpire,
            description: `Points expired after ${daysToExpire} days`,
          },
        }),
      ]);

      totalPointsExpired += pointsToExpire;

      // Check for tier downgrade
      await this.updateCustomerTier(customerId);
    }

    return {
      customersAffected: customerPointsMap.size,
      pointsExpired: totalPointsExpired,
    };
  }
}

export default LoyaltyService;
