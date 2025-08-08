export const XP_PER_LEVEL = 1000;

export const XP_VALUES = {
    CONCEPT_SOLVE: 100,
    ASSESSMENT_PASSED: 250, // for > 80%
    DAILY_MISSION: 150,
    CHALLENGE_PARTICIPATION: 200,
};

export const calculateLevel = (xp: number): number => {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
};
