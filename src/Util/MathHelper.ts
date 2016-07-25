export class MathHelper {
    public static getWeightedScore(weight: number, invTotalWeight: number, amount: number, totalAmount: number): number {
        return weight * invTotalWeight * totalAmount - amount;
    }
}