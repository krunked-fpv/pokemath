/**
 * PokéMath Adaptive Scaffolding & Mastery Engine
 * Pure ES Module — zero browser/DOM dependencies (100% Node-safe).
 */

import { TIERS } from './mathEngine.js';

const ROLLING_WINDOW = 10;

const ROUTE_DEFAULT_SKILLS = {
  'route-1': 'make_ten',
  'route-2': 'sub_within_20',
  'route-3': 'place_value_1000',
  'route-4': 'arrays_5x5',
  'route-5': 'div_exact_12',
  'route-6': 'word_2step_champion',
};

const ENCOURAGEMENTS = {
  miss1: [
    'Close! Take another calm look or tap Rotom-Dex if you want a gentle clue.',
    'Good effort, Trainer! Every explorer checks their math path twice.',
    'Almost had it! Rotom-Dex is right beside you if you want a quick nudge.',
  ],
  miss2: [
    'Bzzzt! Let’s team up with Rotom-Dex—here is a strategy clue to light the way!',
    'Great persistence, Trainer! Rotom-Dex opened a helpful hint card for you.',
  ],
  miss3Plus: [
    'Let’s explore with the visual math model together—step by step!',
    'Bzzzt! Visual models make tricky numbers click. Try tapping the interactive builder!',
  ],
  streakLow: [
    'Super effective thinking, Trainer!',
    'Nice job! Your bond with your buddy grew stronger!',
    'Spot on! Keep exploring the PokéNav workbench!',
  ],
  streakCrit: [
    'Critical Math Streak! Extra Shiny luck & a bonus Critical Challenge await!',
    'Bzzzt! Unstoppable Trainer combo—your Shiny Radar is glowing!',
  ],
};

function pickMessage(list, seed = 0) {
  return list[Math.abs(seed) % list.length];
}

function calcRollingAccuracy(rolling) {
  if (!Array.isArray(rolling) || rolling.length === 0) return 0;
  const hits = rolling.filter(Boolean).length;
  return hits / rolling.length;
}

function computeMasteryLevel(attempts, correct, rolling) {
  const acc = calcRollingAccuracy(rolling);
  if (attempts >= 8 && acc >= 0.9) return 5;
  if (attempts >= 6 && acc >= 0.8) return 4;
  if (attempts >= 4 && acc >= 0.7) return 3;
  if (correct >= 2 && acc >= 0.5) return 2;
  return 1;
}

function canMutateObject(obj) {
  return Boolean(obj && typeof obj === 'object' && !Object.isFrozen(obj));
}

/**
 * Records a math attempt into skill mastery and computes adaptive scaffolding:
 * - 2 consecutive misses -> autoOpenHintTier: 1, difficultyAdjustment: -1
 * - >= 3 consecutive misses -> autoOpenHintTier: 2, difficultyAdjustment: -1
 * - streak >= 4 -> triggerCriticalChallenge: true, shinyRollBonus > 0 (up to 0.15)
 */
export function recordAttempt(profileState, skillTag, isCorrect, hintsUsed = 0) {
  const tag = typeof skillTag === 'string' && skillTag.trim() ? skillTag.trim() : 'general';
  const correctBool = Boolean(isCorrect);
  const hintsCount = Math.max(0, Number(hintsUsed) || 0);

  const prevMastery = profileState?.skillMastery?.[tag] || {};
  const attempts = (Number(prevMastery.attempts) || 0) + 1;
  const correct = (Number(prevMastery.correct) || 0) + (correctBool ? 1 : 0);
  const prevRolling = Array.isArray(prevMastery.rolling) ? prevMastery.rolling : [];
  const rolling = [...prevRolling, correctBool].slice(-ROLLING_WINDOW);
  const consecutiveMisses = correctBool ? 0 : (Number(prevMastery.consecutiveMisses) || 0) + 1;
  const level = computeMasteryLevel(attempts, correct, rolling);

  const updatedMastery = {
    attempts,
    correct,
    rolling,
    consecutiveMisses,
    level,
  };

  const prevStreak = Math.max(0, Number(profileState?.sessionStreak) || 0);
  const streak = correctBool ? prevStreak + 1 : 0;

  let autoOpenHintTier = 0;
  let difficultyAdjustment = 0;
  let encouragementMessage = '';

  if (!correctBool) {
    if (consecutiveMisses >= 3) {
      autoOpenHintTier = 2;
      difficultyAdjustment = -1;
      encouragementMessage = pickMessage(ENCOURAGEMENTS.miss3Plus, attempts);
    } else if (consecutiveMisses === 2) {
      autoOpenHintTier = 1;
      difficultyAdjustment = -1;
      encouragementMessage = pickMessage(ENCOURAGEMENTS.miss2, attempts);
    } else {
      autoOpenHintTier = 0;
      difficultyAdjustment = 0;
      encouragementMessage = pickMessage(ENCOURAGEMENTS.miss1, attempts);
    }
  } else {
    autoOpenHintTier = 0;
    const acc = calcRollingAccuracy(rolling);
    if (streak >= 4 || (rolling.length >= 4 && acc >= 0.85 && hintsCount === 0)) {
      difficultyAdjustment = 1;
    } else {
      difficultyAdjustment = 0;
    }
    encouragementMessage =
      streak >= 4
        ? pickMessage(ENCOURAGEMENTS.streakCrit, streak)
        : pickMessage(ENCOURAGEMENTS.streakLow, streak + attempts);
  }

  const triggerCriticalChallenge = correctBool && streak >= 4;
  const shinyRollBonus = triggerCriticalChallenge
    ? Number(Math.min(0.15, 0.04 + (streak - 4) * 0.02).toFixed(2))
    : 0;

  // Safely update mutable profileState (e.g., draft inside updateProfile or unit test objects)
  if (canMutateObject(profileState)) {
    if (!profileState.skillMastery || typeof profileState.skillMastery !== 'object') {
      profileState.skillMastery = {};
    }
    if (canMutateObject(profileState.skillMastery)) {
      profileState.skillMastery[tag] = {
        ...updatedMastery,
        rolling: [...updatedMastery.rolling],
      };
    }
    profileState.sessionStreak = streak;
  }

  return {
    updatedMastery,
    consecutiveMisses,
    streak,
    autoOpenHintTier,
    difficultyAdjustment,
    triggerCriticalChallenge,
    shinyRollBonus,
    encouragementMessage,
  };
}

/**
 * Recommends problem generation settings based on profile mastery, misses, and streak.
 */
export function getRecommendedProblemConfig(profileState, routeId = 'route-1') {
  const tier = TIERS.includes(profileState?.tier) ? profileState.tier : 'starter';
  const resolvedRoute = routeId || 'route-1';
  const streak = Math.max(0, Number(profileState?.sessionStreak) || 0);
  const criticalChallenge = streak >= 4;
  const masteryMap =
    profileState?.skillMastery && typeof profileState.skillMastery === 'object'
      ? profileState.skillMastery
      : {};

  const entries = Object.entries(masteryMap);
  let focusSkillTag = ROUTE_DEFAULT_SKILLS[resolvedRoute] || 'add_within_20';
  let difficultyAdjustment = criticalChallenge ? 1 : 0;

  if (entries.length > 0) {
    // Prioritize any skill with >= 2 consecutive misses for gentle scaffolding
    let strugglingTag = null;
    let highestMisses = 1;

    let weakestTag = null;
    let weakestScore = Infinity;

    let totalAcc = 0;
    let totalAttempts = 0;

    for (const [tag, m] of entries) {
      if (!m || typeof m !== 'object') continue;
      const misses = Number(m.consecutiveMisses) || 0;
      if (misses >= 2 && misses > highestMisses) {
        highestMisses = misses;
        strugglingTag = tag;
      }

      const acc = calcRollingAccuracy(m.rolling);
      const lvl = Number(m.level) || 1;
      const score = lvl + acc;
      if (score < weakestScore) {
        weakestScore = score;
        weakestTag = tag;
      }

      totalAcc += acc;
      totalAttempts += Number(m.attempts) || 0;
    }

    if (strugglingTag) {
      focusSkillTag = strugglingTag;
      difficultyAdjustment = -1;
    } else {
      if (weakestTag) focusSkillTag = weakestTag;
      const avgAcc = entries.length > 0 ? totalAcc / entries.length : 0;
      if (criticalChallenge || (totalAttempts >= 6 && avgAcc >= 0.85)) {
        difficultyAdjustment = 1;
      }
    }
  }

  return {
    tier,
    routeId: resolvedRoute,
    difficultyAdjustment,
    criticalChallenge,
    focusSkillTag,
  };
}
