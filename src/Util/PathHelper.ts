import {MathHelper} from "./../Util/MathHelper"
import {Config} from "./../Config/Config"

export class PathHelper {
    private static inverseDir: number[] = [
        BOTTOM,
        BOTTOM_LEFT,
        LEFT,
        TOP_LEFT,
        TOP,
        TOP_RIGHT,
        RIGHT,
        BOTTOM_RIGHT
    ];

    public static NOT_BLOCKED = 0;
    public static TEMPORARILY_BLOCKED = 1;
    public static PERMANENTLY_BLOCKED = 2;

    private static get Paths(): { [id: string]: PathInfo } {
        return Memory["paths"];
    }

    public static clone(pathInfo: PathInfo): PathInfo {
        let newInfo: PathInfo = {
            id: pathInfo.id,
            path: pathInfo.path,
            room: pathInfo.room,
            created: pathInfo.created,
            dest: new RoomPosition(pathInfo.dest.x, pathInfo.dest.y, pathInfo.dest.roomName),
            blockCount: pathInfo.blockCount,
        };
        return newInfo;
    }

    public static getPath(from: RoomPosition | { pos: RoomPosition }, to: RoomPosition | { pos: RoomPosition }, opts?: FindPathOpts): PathInfo {
        let fromPos: RoomPosition;
        let toPos: RoomPosition;
        if (!(from instanceof RoomPosition)) {
            fromPos = from.pos;
        } else {
            fromPos = from;
        }
        if (!(to instanceof RoomPosition)) {
            toPos = to.pos;
        } else {
            toPos = to;
        }

        //if (!opts) {
        //    opts = Config.PATHFINDING_DEFAULT_OPTS;
        //}

        //let fromKey = fromPos.roomName + "_" + fromPos.x + "," + fromPos.y;
        //let toKey = toPos.roomName + "_" + toPos.x + "," + toPos.y;
        //let optsKey = opts ? "|" + JSON.stringify(opts).replace(/{|}|\"/g, "") : "";
        //let id = fromKey + "|" + toKey + optsKey

        let id =
            fromPos.roomName + "_" + fromPos.x + "," + fromPos.y + "|" +
            toPos.roomName + "_" + toPos.x + "," + toPos.y;

        // Check if path from/to is cached.
        let cachedPathInfo = PathHelper.Paths[id];
        if (cachedPathInfo) {
            return PathHelper.clone(cachedPathInfo);
        }

        //if (!opts) {
        opts = Config.PATHFINDING_DEFAULT_OPTS;
        //}
        ++Memory["debug"]["pathsComputed"];
        let pathSteps = fromPos.findPathTo(toPos, opts);
        let finalStep = pathSteps[pathSteps.length - 1];

        console.log("New path | Id: " + id + " | Last step: " + finalStep.x + "," + finalStep.y);
        // Cache the computed path.
        let pathInfo: PathInfo = {
            id: id,
            path: Room.serializePath(pathSteps),
            room: fromPos.roomName,
            created: Game.time,
            dest: new RoomPosition(finalStep.x, finalStep.y, toPos.roomName),
            blockCount: 0,
        }

        PathHelper.Paths[id] = pathInfo;
        return PathHelper.clone(pathInfo);
    }

    public static inversePath(path: PathStep[]): PathStep[] {
        var inversedPath: PathStep[] = [];

        for (var i = path.length; --i >= 0;) {
            let step = path[i];
            let dx = step.dx;
            let dy = step.dy;

            inversedPath.push({
                x: step.x - dx,
                y: step.y - dy,
                dx: -dx,
                dy: -dy,
                direction: PathHelper.inverseDir[step.direction - 1]
            });
        }

        //let len = path.length;
        //for (var i = 0; i < len; i++) {
        //    let step = path[i];

        //    let dx = -step.dx;
        //    let dy = -step.dy;

        //    let x = step.x - step.dx;
        //    let y = step.y - step.dy;

        //    let direction = PathHelper.inverseDir[step.direction - 1];

        //    inversedPath.unshift({ x: x, y: y, dx: dx, dy: dy, direction: direction });
        //}
        return inversedPath;
    }

    public static invalidatePath(id: string) {
        delete PathHelper.Paths[id];
    }

    public static pathBlocked(id: string): void {
        if (PathHelper.Paths[id] && ++PathHelper.Paths[id].blockCount >= 10) { // Check if path has been blocked too long
            PathHelper.invalidatePath(id);
        }
    }

    public static clearBlocked(id: string): void {
        PathHelper.Paths[id].blockCount = 0;
    }

    public static getNextClockwiseDir(dir: number): number {
        ++dir;
        if (dir > 8) {
            dir -= 8;
        }
        return dir;
    }

    public static isPathBlocked(room: Room, path: string): boolean {
        let x = ~~path.substr(0, 2);
        let y = ~~path.substr(2, 2);
        if (PathHelper.isTileBlocked2(room, x, y)) {
            return true;
        }

        let len = path.length - 1;
        for (let i = 5; i < len; i++) { // skip index 4 - the direction to the initial x,y pos.
            let dir = ~~path.substr(i, 1);
            let vec = MathHelper.dirToVector[dir - 1];
            x += vec.x;
            y += vec.y;

            if (PathHelper.isTileBlocked2(room, x, y)) {
                return true;
            }
        }
        return false;
    }

    private static isTileBlocked2(room: Room, x: number, y: number): boolean {
        let tiles = room.lookAt(x, y) as LookAtResult[];

        for (let i = tiles.length; --i >= 0;) {
            let tile = tiles[i];
            if (tile.creep || tile.structure || tile.terrain === "wall") {
                return true;
            }
        }

        return false;
    }

    public static isTileBlocked(pos: RoomPosition, dir: number): BlockType {
        let vec = MathHelper.dirToVector[dir - 1];
        let x = pos.x + vec.x;
        let y = pos.y + vec.y;
        let tiles = Game.rooms[pos.roomName].lookAt(x, y) as LookAtResult[];
        let blockTyped = BlockType.Free;

        for (let i = tiles.length; --i >= 0;) {
            let tile = tiles[i];
            if (tile.creep) {
                blockTyped = BlockType.Temporarily;
            } else if (tile.structure || tile.terrain === "wall") {
                return BlockType.Permanently;
            }
        }

        return blockTyped;
    }

    public static hasPathToTarget(from: RoomPosition | { pos: RoomPosition }, to: RoomPosition | { pos: RoomPosition }, autoInvalidate = true, maxRange = 1): boolean {
        let pathInfo = PathHelper.getPath(from, to);
        let toPos: RoomPosition;
        if (!(to instanceof RoomPosition)) {
            toPos = to.pos;
        } else {
            toPos = to;
        }

        if (MathHelper.squareDist(pathInfo.dest, toPos) > maxRange * maxRange ||
            toPos.roomName != pathInfo.dest.roomName) {
            //console.log("Path incomplete | dest: " + toPos + " != " + targetPos);
            if (autoInvalidate) {
                PathHelper.invalidatePath(pathInfo.id);
            }
            return false;
        }

        return true;
    }
}

export enum BlockType {
    Free,
    Temporarily,
    Permanently
}