import {CreepObject} from "./../GameObjects/CreepObject";
import {Logger} from "./../Util/Logger";
import {ErrorHelper} from "./../Util/ErrorHelper";
import {MathHelper} from "./../Util/MathHelper";
import {PathHelper, BlockType} from "./../Util/PathHelper";
import {Config} from "./../Config/Config";

export module CreepEx {
    var KEY_STATE = "state";
    var KEY_ROLE = "role";
    var KEY_TARGET = "targetInfo";
    var KEY_LOG = "showLog";

    Object.defineProperty(Creep.prototype, "PathInfo", {
        get: function (): PathInfo {
            return (this as Creep).memory["pathInfo"];
        },
        set: function (value: PathInfo) {
            (this as Creep).memory["pathInfo"] = value;
        }
    });

    Creep.prototype.setState = function (state: CreepState, clearTarget = true): void {
        (this as Creep).log("Setting State: " + CreepState[state].toString() + " | clearTarget: " + clearTarget);
        if (clearTarget) {
            (this as Creep).clearTarget();
        }
        (this as Creep).memory[KEY_STATE] = state;
    }

    Creep.prototype.getState = function (): CreepState {
        return this.memory[KEY_STATE] as CreepState;
    }

    Creep.prototype.setRole = function (role: CreepRole): void {
        (this as Creep).memory[KEY_ROLE] = role;
    }

    Creep.prototype.getRole = function (): CreepRole {
        return (this as Creep).memory[KEY_ROLE] as CreepRole;
    }

    Creep.prototype.getTarget = function <T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(...types: Function[]): T {
        // Note: Flags do not have an id
        var targetInfo = (this as Creep).memory[KEY_TARGET] as TargetInfo;

        if (targetInfo) {
            let o = Game.getObjectById<T>(targetInfo.id);

            if (types.length > 0) {
                for (let i = 0; i < types.length; i++) {
                    if (o instanceof types[i]) {
                        return o;
                    }
                }
                return null;
            }
            return o;
        }

        return null;
    }

    Creep.prototype.getTargetInfo = function (): TargetInfo {
        // Note: Flags do not have an id
        var targetInfo = (this as Creep).memory[KEY_TARGET] as TargetInfo;

        if (targetInfo) {
            return targetInfo;
        }

        return null;
    }

    Creep.prototype.setTarget = function <T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(target: T, params?: {}): T {
        // Note: Flags do not have an id
        if (target) {
            let typeName = target.toString().substring(1).split(" ")[0].toLowerCase();
            (this as Creep).log("Set target: " + target.id);
            (this as Creep).say(typeName);

            let targetInfo: TargetInfo = {
                id: target.id,
                params: params,
                typeName: typeName
            };
            (this as Creep).memory[KEY_TARGET] = targetInfo;
        }
        return target;
    }

    Creep.prototype.clearTarget = function (): void {
        if ((this as Creep).memory[KEY_TARGET] != undefined) {
            (this as Creep).log("Clear target: " + (this as Creep).memory[KEY_TARGET].id);
            (this as Creep).forget(KEY_TARGET);
        }
    }

    Creep.prototype.moveToTarget = function <T extends RoomObject>(object?: T, requireOptimalPath = true, minimumDistToTarget = 0): number {
        if ((this as Creep).fatigue > 0) {
            return ERR_TIRED;
        }

        let targetPos: RoomPosition;
        if (object) {
            targetPos = object.pos;
        } else {
            let t = (this as Creep).getTarget();
            if (t) {
                targetPos = t.pos;
            }
        }

        if (!targetPos) {
            return ERR_INVALID_TARGET;
        }

        if ((this as Creep).name === "H_1") {
            debugger;
        }

        let creepPos = (this as Creep).pos;
        if (creepPos.x === targetPos.x && creepPos.y === targetPos.y) {
            // Destination reached.
            let pathInfo = (this as Creep).PathInfo;
            if (pathInfo) {
                PathHelper.pathBlocked(pathInfo.id);
                (this as Creep).forget("pathInfo");
            }
            return OK;
        }

        let pathInfo = (this as Creep).PathInfo;
        if (pathInfo) {
            if (creepPos.x === pathInfo.dest.x && creepPos.y === pathInfo.dest.y) {
                // Destination reached.
                PathHelper.clearBlocked(pathInfo.id);
                (this as Creep).forget("pathInfo");
                return OK;

            } else if (pathInfo.dest.x != targetPos.x || pathInfo.dest.y != targetPos.y) {
                // Object position and path destination are not equal - reset pathInfo.
                pathInfo = null;
            }
            else if (!pathInfo.path) {
                pathInfo = null;
                //return OK;
            }
        }

        if (!pathInfo) {
            //console.log("Getting path: " + (this as Creep).name + " " + creepPos + " | " + targetPos);
            pathInfo = PathHelper.getPath((this as Creep), targetPos);
            if (requireOptimalPath && !PathHelper.isPathInProximity(pathInfo, targetPos)) {
                PathHelper.invalidatePath(pathInfo.id);
                return ERR_NO_PATH;
            }

            //if (PathHelper.isPathBlocked((this as Creep).room, pathInfo.path)) {
            //    return ERR_NO_PATH;
            //}

            (this as Creep).setPath(pathInfo);
        }

        let dir = ~~pathInfo.path.charAt(0); // Parse char to int
        switch (PathHelper.isDirBlocked(creepPos, dir)) {
            case BlockType.Free:
                pathInfo.path = pathInfo.path.substring(1);
                break;

            case BlockType.Temporarily:
                if (!requireOptimalPath &&
                    MathHelper.squareDist(creepPos, pathInfo.dest) <= minimumDistToTarget * minimumDistToTarget) {
                    return OK;
                }

                //console.log("Path Temporarily blocked: " + (this as Creep).name + " | " + pathInfo.id + " " + pathInfo.blockCount);

                PathHelper.pathBlocked(pathInfo.id);
                if (++pathInfo.blockCount >= Config.PATHFINDING.CREEP_MAX_BLOCKED_TICKS) {
                    //let oldDir = dir;
                    //while (oldDir === dir) {
                    //    dir = (Math.random() * 8) >> 0;
                    //}

                    pathInfo = PathHelper.getPath((this as Creep), targetPos);
                    if (PathHelper.isPathBlocked(pathInfo)) {
                        PathHelper.invalidatePath(pathInfo.id); // Do not cache blocked avoidance-paths
                        pathInfo = PathHelper.getPath((this as Creep), targetPos);
                    }

                    if (requireOptimalPath && !PathHelper.isPathInProximity(pathInfo, targetPos)) {
                        PathHelper.invalidatePath(pathInfo.id);
                        (this as Creep).forget("pathInfo");
                        return ERR_NO_PATH;
                    }

                    (this as Creep).setPath(pathInfo);
                    dir = ~~pathInfo.path.charAt(0);
                    pathInfo.path = pathInfo.path.substring(1);
                }

                break;

            case BlockType.Permanently:
                if (!requireOptimalPath &&
                    MathHelper.squareDist(creepPos, pathInfo.dest) <= minimumDistToTarget * minimumDistToTarget) {
                    return OK;
                }
                //console.log("Path Permanently blocked: " + (this as Creep).name + " | " + pathInfo.id);
                PathHelper.invalidatePath(pathInfo.id);
                (this as Creep).forget("pathInfo");
                return ERR_NO_PATH;
        }

        return (this as Creep).move(dir);
    }

    Creep.prototype.setPath = function (pathInfo: PathInfo): void {
        //console.log("Setting new path: " + (this as Creep).name + " | " + pathInfo.id + " | " + pathInfo.dest + " | " + pathInfo.path);
        pathInfo.path = pathInfo.path.substring(4);
        pathInfo.blockCount = 0;
        (this as Creep).PathInfo = pathInfo;
    }

    Creep.prototype.remember = function (key: string, value: any, override = true): void {
        if (override || (this as Creep).memory[key] == undefined) {
            (this as Creep).memory[key] = value;
        }
    }

    Creep.prototype.forget = function (key: string): void {
        delete (this as Creep).memory[key];
    }

    Creep.prototype.showTarget = function (): void {
        (this as Creep).say("!");
        var target = (this as Creep).getTarget();

        if (target) {
            var flag = Game.flags["debug"];
            if (flag) {
                flag.setPosition(target.pos);
            } else {
                target.room.createFlag(target.pos, "debug", COLOR_PURPLE, COLOR_PURPLE);
            }
        }

        console.log((this as Creep).name + " | State: " + CreepState[(this as Creep).getState()] + " | Target: " + target);
    }

    Creep.prototype.showData = function (): void {
        console.log(JSON.stringify((this as Creep), null, "\t"));
    }

    Creep.prototype.showLog = function (): void {
        if (!(this as Creep).memory[KEY_LOG]) {
            (this as Creep).memory[KEY_LOG] = true;
        } else {
            delete (this as Creep).memory[KEY_LOG];
        }
    }

    Creep.prototype.log = function (msg: string, ...callStack: string[]): void {
        if ((this as Creep).memory[KEY_LOG]) {
            if (callStack.length > 0) {
                msg += "\n\t" + callStack.join(" => ");
            }
            console.log((this as Creep).name + " | " + msg);
        }
    }
}