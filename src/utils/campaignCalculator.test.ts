import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCampaignEstimate } from './campaignCalculator.ts';

test('calculateCampaignEstimate calculates expected bounds', () => {
  const estimate = calculateCampaignEstimate(10, 5, 'broad_awareness');
  assert.equal(estimate.budget, 10);
  assert.equal(estimate.durationDays, 5);
  assert.equal(estimate.dailyBudget, 2);
  assert.ok(estimate.estimatedReachMin > 0);
  assert.ok(estimate.estimatedReachMax > estimate.estimatedReachMin);
  assert.ok(estimate.estimatedImpressionsMin >= estimate.estimatedReachMin);
  assert.ok(estimate.disclaimer.includes('ma aha natiijo damaanad qaad ah'));
});

test('calculateCampaignEstimate scales with urgent priority', () => {
  const normal = calculateCampaignEstimate(20, 7, 'broad_awareness');
  const urgent = calculateCampaignEstimate(20, 7, 'urgent_priority');
  assert.ok(urgent.estimatedReachMin > normal.estimatedReachMin);
});
