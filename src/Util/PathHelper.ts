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
        return {
            id: pathInfo.id,
            path: pathInfo.path,
            room: pathInfo.room,
            created: pathInfo.created,
            dest: new RoomPosition(pathInfo.dest.x, pathInfo.dest.y, pathInfo.dest.roomName),
            blockCount: pathInfo.blockCount,
        };
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

        if (!opts) {
            opts = Config.PATHFINDING_DEFAULT_OPTS;
        }
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
        return inversedPath;
    }

    public static invalidatePath(id: string) {
        delete PathHelper.Paths[id];
    }

    public static pathBlocked(id: string): void {
        if (PathHelper.Paths[id] &&
            ++PathHelper.Paths[id].blockCount >= Config.PATHFINDING.PATH_MAX_BLOCKED_TICKS) { // Check if path has been blocked too long
            PathHelper.invalidatePath(id);
        }
    }

    public static clearBlocked(id: string): void {
        PathHelper.Paths[id].blockCount = 0;
    }

    public static isPathInProximity(pathInfo: PathInfo, target: RoomPosition | { pos: RoomPosition }, maxRange = 1): boolean {
        let destPos: RoomPosition;
        if (!(target instanceof RoomPosition)) {
            destPos = target.pos;
        } else {
            destPos = target;
        }

        if (MathHelper.squareDist(pathInfo.dest, destPos) > maxRange * maxRange ||
            destPos.roomName != pathInfo.dest.roomName) {
            //console.log("Path incomplete | dest: " + toPos + " != " + targetPos);
            return false;
        }

        return true;
    }

    public static isPathBlocked(pathInfo: PathInfo): boolean {
        let path = pathInfo.path;
        let room = Game.rooms[pathInfo.room];
        let x = ~~path.substr(0, 2);
        let y = ~~path.substr(2, 2);
        if (PathHelper.isTileBlocked(room, x, y)) {
            return true;
        }

        let len = path.length - 1;
        for (let i = 5; i < len; i++) { // skip index 4 - the direction to the initial x,y pos.
            let dir = ~~path.substr(i, 1);
            let vec = MathHelper.dirToVector[dir - 1];
            x += vec.x;
            y += vec.y;

            if (PathHelper.isTileBlocked(room, x, y)) {
                return true;
            }
        }
        return false;
    }

    private static isTileBlocked(room: Room, x: number, y: number): boolean {
        let tiles = room.lookAt(x, y) as LookAtResult[];

        for (let i = tiles.length; --i >= 0;) {
            let tile = tiles[i];
            if (tile.creep ||
                (tile.structure && !Config.WALKABLE_STRUCTURES[tile.structure.structureType]) ||
                tile.terrain === "wall") {
                return true;
            }
        }

        return false;
    }

    public static isDirBlocked(pos: RoomPosition, dir: number): BlockType {
        let vec = MathHelper.dirToVector[dir - 1];
        let tiles = Game.rooms[pos.roomName].lookAt(pos.x + vec.x, pos.y + vec.y) as LookAtResult[];

        for (let i = tiles.length; --i >= 0;) {
            let tile = tiles[i];
            if (tile.creep) {
                return BlockType.Temporarily;

            } else if ((tile.structure && !Config.WALKABLE_STRUCTURES[tile.structure.structureType]) ||
                tile.terrain === "wall") {
                return BlockType.Permanently;
            }
        }

        return BlockType.Free;
    }
}

export enum BlockType {
    Free,
    Temporarily,
    Permanently
}