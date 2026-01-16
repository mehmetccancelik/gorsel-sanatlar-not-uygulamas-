// Weighted Score Calculator
// Handles the 100-point weighted scoring system

export class ScoreCalculator {
    /**
     * Calculate weighted score for an artwork
     * @param {Array} assessments - Array of {criteriaId, rawScore, weight}
     * @param {number} maxRawScore - Maximum raw score (default 10)
     * @returns {number} - Total score out of 100
     */
    static calculateTotalScore(assessments, maxRawScore = 10) {
        let totalScore = 0;

        for (const assessment of assessments) {
            const normalizedScore = (assessment.rawScore / maxRawScore) * 100;
            const weightedScore = (normalizedScore * assessment.weight) / 100;
            totalScore += weightedScore;
        }

        return Math.round(totalScore * 10) / 10; // Round to 1 decimal
    }

    /**
     * Calculate individual criterion contribution
     * @param {number} rawScore - Raw score given
     * @param {number} weight - Weight percentage (0-100)
     * @param {number} maxRawScore - Maximum raw score
     * @returns {number} - Contribution to total score
     */
    static calculateCriterionScore(rawScore, weight, maxRawScore = 10) {
        const normalizedScore = (rawScore / maxRawScore) * 100;
        const weightedScore = (normalizedScore * weight) / 100;
        return Math.round(weightedScore * 10) / 10;
    }

    /**
     * Validate that weights sum to 100
     * @param {Array} criteria - Array of {weight}
     * @returns {boolean}
     */
    static validateWeights(criteria) {
        const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
        return Math.abs(totalWeight - 100) < 0.01; // Allow for floating point errors
    }

    /**
     * Auto-distribute weights evenly
     * @param {number} count - Number of criteria
     * @returns {Array} - Array of weights
     */
    static distributeWeightsEvenly(count) {
        const baseWeight = Math.floor(100 / count);
        const remainder = 100 - (baseWeight * count);

        const weights = new Array(count).fill(baseWeight);
        // Add remainder to first criteria
        if (remainder > 0) {
            weights[0] += remainder;
        }

        return weights;
    }

    /**
     * Redistribute weights when one changes
     * @param {Array} criteria - Array of {id, weight}
     * @param {string} changedId - ID of changed criterion
     * @param {number} newWeight - New weight value
     * @returns {Array} - Updated criteria with redistributed weights
     */
    static redistributeWeights(criteria, changedId, newWeight) {
        const updated = criteria.map(c => ({ ...c }));
        const changedIndex = updated.findIndex(c => c.id === changedId);

        if (changedIndex === -1) return criteria;

        const oldWeight = updated[changedIndex].weight;
        const difference = newWeight - oldWeight;

        // Update the changed criterion
        updated[changedIndex].weight = newWeight;

        // Distribute the difference among other criteria
        const otherCriteria = updated.filter((_, i) => i !== changedIndex);
        const totalOtherWeight = otherCriteria.reduce((sum, c) => sum + c.weight, 0);

        if (totalOtherWeight === 0) {
            // If all other weights are 0, distribute evenly
            const evenWeight = (100 - newWeight) / otherCriteria.length;
            otherCriteria.forEach(c => {
                c.weight = Math.round(evenWeight * 10) / 10;
            });
        } else {
            // Distribute proportionally
            otherCriteria.forEach(c => {
                const proportion = c.weight / totalOtherWeight;
                c.weight = Math.max(0, c.weight - (difference * proportion));
                c.weight = Math.round(c.weight * 10) / 10;
            });
        }

        // Ensure total is exactly 100
        const total = updated.reduce((sum, c) => sum + c.weight, 0);
        if (Math.abs(total - 100) > 0.01) {
            const adjustment = 100 - total;
            updated[0].weight += adjustment;
            updated[0].weight = Math.round(updated[0].weight * 10) / 10;
        }

        return updated;
    }
}

export default ScoreCalculator;
