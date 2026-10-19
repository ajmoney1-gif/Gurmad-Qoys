/**
 * Campaign calculation utilities for GURMAD QOYS Promote feature.
 * Calculates non-guaranteed estimated community reach and impressions.
 */

export interface CampaignEstimate {
  budget: number;
  durationDays: number;
  dailyBudget: number;
  estimatedReachMin: number;
  estimatedReachMax: number;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  disclaimer: string;
}

export function calculateCampaignEstimate(
  budget: number,
  durationDays: number,
  objective: 'broad_awareness' | 'urgent_priority' | 'hyper_local' = 'broad_awareness'
): CampaignEstimate {
  const safeBudget = Math.max(1, Number(budget) || 1);
  const safeDays = Math.max(1, Number(durationDays) || 1);
  const dailyBudget = Math.round((safeBudget / safeDays) * 100) / 100;

  // Base multiplier per dollar: approx 1,200 to 2,800 reach per dollar
  let multiplier = 1.0;
  if (objective === 'urgent_priority') {
    multiplier = 1.25; // Higher frequency and priority feed placement
  } else if (objective === 'hyper_local') {
    multiplier = 0.9; // More targeted geographically, slightly smaller audience pool
  }

  const reachMin = Math.round(safeBudget * 1100 * multiplier);
  const reachMax = Math.round(safeBudget * 2900 * multiplier);
  const impressionsMin = Math.round(reachMin * 1.6);
  const impressionsMax = Math.round(reachMax * 2.2);

  return {
    budget: safeBudget,
    durationDays: safeDays,
    dailyBudget,
    estimatedReachMin: reachMin,
    estimatedReachMax: reachMax,
    estimatedImpressionsMin: impressionsMin,
    estimatedImpressionsMax: impressionsMax,
    disclaimer:
      'Qiyaastaani ma aha natiijo damaanad qaad ah; waxay ku xiran tahay meelaha la beegsanayo, xawaaraha adeegsiga dadka, iyo waqtiga ololaha.',
  };
}
