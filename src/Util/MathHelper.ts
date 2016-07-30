export class MathHelper {
    public static getWeightedScore(weight: number, invTotalWeight: number, amount: number, totalAmount: number): number {
        return weight * invTotalWeight * totalAmount - amount;
    }

    public static squareDist(p1: RoomPosition, p2: RoomPosition): number {
        var x = p2.x - p1.x;
        var y = p2.y - p1.y;
        return x * x + y * y;
    }

    public static squareDist2(x1: number, y1: number, x2: number, y2: number): number {
        var x = x2 - x1;
        var y = y2 - y1;
        return x * x + y * y;
    }
}