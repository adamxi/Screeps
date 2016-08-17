export class MathHelper {
    public static dirToVector: [{ x: number, y: number }] = [
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
        { x: -1, y: 1 },
        { x: -1, y: 0 },
        { x: -1, y: -1 },
    ];

    public static getWeightedScore(weight: number, invTotalWeight: number, amount: number, totalAmount: number): number {
        return weight * invTotalWeight * totalAmount - amount;
    }

    public static dist(p1: RoomPosition, p2: RoomPosition): number {
        return Math.sqrt(MathHelper.squareDist(p1, p2));
    }

    public static dist2(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(MathHelper.squareDist2(x1, y1, x2, y2));
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

    public static getVectorLeft(x: number, y: number): { x: number, y: number } {
        return { x: y, y: -x };
    }

    public static getVectorRight(x: number, y: number): { x: number, y: number } {
        return { x: -y, y: x };
    }

    public static getVectorDir(dir: number): { x: number, y: number } {
        return MathHelper.dirToVector[dir - 1];
    }

    public static getNextVector(dir: number): { x: number, y: number } {
        let nextDir = MathHelper.getNextDir(dir);
        return MathHelper.getVectorDir(nextDir);
    }

    public static getOppositeVector(vec: { x: number, y: number }) {
        return { x: -vec.x, y: -vec.y };
    }

    public static getNextDir(dir: number): number {
        ++dir;
        if (dir > 8) {
            dir -= 8;
        }
        return dir;
    }

    public static getPrevDir(dir: number): number {
        --dir;
        if (dir < 1) {
            dir += 8;
        }
        return dir;
    }

    public static getOppositeDir(dir: number): number {
        dir -= 4;
        if (dir < 1) {
            dir += 8;
        }
        return dir;
    }

    //public static isNumber<T>(x: any): x is T {
    //    return x instanceof T;
    //}
}