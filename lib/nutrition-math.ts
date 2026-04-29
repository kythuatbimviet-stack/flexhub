/**
 * Nutrition Math Utility - Formulas based on scientific standards used in tinhtoan.csv
 */

/**
 * Calculate BMI
 * @param weight kg
 * @param height cm
 */
export function calculateBMI(weight: number, height: number): number {
    if (!height || height <= 0) return 0
    const heightInMeters = height / 100
    return weight / (heightInMeters * heightInMeters)
}

/**
 * Calculate Body Fat % using Navy Formula
 * Men: 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
 * Women: 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
 */
export function calculateBodyFatNavy(
    gender: 'Nam' | 'Nữ',
    height: number,
    waist: number,
    neck: number,
    hip?: number
): number {
    if (!height || !waist || !neck) return 0
    
    // Log10 helper
    const log10 = Math.log10

    if (gender === 'Nam') {
        const val = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
        return Math.max(0, val)
    } else {
        if (!hip) return 0
        const val = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
        return Math.max(0, val)
    }
}

/**
 * Calculate Body Fat % using BMI formula (Deurenberg et al.)
 * Men: (1.20 * BMI) + (0.23 * Age) - 16.2
 * Women: (1.20 * BMI) + (0.23 * Age) - 5.4
 */
export function calculateBodyFatBMI(gender: 'Nam' | 'Nữ', bmi: number, age: number): number {
    if (!bmi || !age) return 0
    if (gender === 'Nam') {
        return (1.20 * bmi) + (0.23 * age) - 16.2
    } else {
        return (1.20 * bmi) + (0.23 * age) - 5.4
    }
}

/**
 * Calculate Katch-McArdle BMR
 * BMR = 370 + (21.6 * LBM)
 * LBM = Weight * (1 - Body Fat %)
 */
export function calculateBMR(weight: number, bodyFatPercentage: number): number {
    if (!weight) return 0
    const lbm = weight * (1 - bodyFatPercentage / 100)
    return 370 + (21.6 * lbm)
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * @param bmr Basal Metabolic Rate
 * @param activityCoefficient Activity multiplier
 * @param trainingEnergy Training session energy (RT EE)
 * @param tefPercentage Thermic Effect of Food (default 15%)
 */
export function calculateTDEE(
    bmr: number, 
    activityCoefficient: number, 
    trainingEnergy: number = 0, 
    tefPercentage: number = 15
): number {
    // Rest Energy = BMR * Coeff * (1 + TEF)
    const restEnergy = bmr * activityCoefficient * (1 + tefPercentage / 100)
    // Training Day Energy = Rest Energy + Training Energy
    return restEnergy + trainingEnergy
}

/**
 * Calculate Macros
 * @param calories Total Daily Calories
 * @param weight kg
 * @param proteinPerKg grams of protein per kg of body weight
 * @param fatPercentage percentage of total calories from fat
 */
export function calculateMacros(
    calories: number,
    weight: number,
    proteinPerKg: number,
    fatPercentage: number
) {
    const proteinGrams = weight * proteinPerKg
    const proteinCalories = proteinGrams * 4
    
    const fatCalories = calories * (fatPercentage / 100)
    const fatGrams = fatCalories / 9
    
    const carbCalories = calories - proteinCalories - fatCalories
    const carbGrams = Math.max(0, carbCalories / 4)
    
    return {
        proteinGrams: Math.round(proteinGrams),
        fatGrams: Math.round(fatGrams),
        carbGrams: Math.round(carbGrams)
    }
}
