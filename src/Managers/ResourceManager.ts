import {MathHelper} from "./../Util/MathHelper";
import {PathHelper} from "./../Util/PathHelper";

export class ResourceManager {
    public static managers: { [id: string]: ResourceManager; } = {};

    private room: Room;

    constructor(room: Room) {
        ResourceManager.managers[room.name] = this;

        this.room = room;
        this.locateResources();
    }

    public get SourceInfo(): SourceInfo[] {
        return this.room.memory["sources"] as SourceInfo[];
    }

    public set SourceInfo(value: SourceInfo[]) {
        this.room.memory["sources"] = value;
    }

    private locateResources() {
        let sources = this.room.find<Source>(FIND_SOURCES);
        var sourceCache: any = {};

        for (let i = sources.length; --i >= 0;) {
            var resource = sources[i];
            var pos = resource.pos;
            var availableSlots = 0;
            var area = this.room.lookAtArea(pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true) as LookAtResultWithPos[];

            for (let j = area.length; --j >= 0;) {
                if (area[j].terrain === "plain") {
                    availableSlots++;
                }
            }

            let sourceInfo: SourceInfo = {
                sourceId: resource.id,
                room: this.room.name,
                totalSlots: availableSlots,
                x: resource.pos.x,
                y: resource.pos.y
            }

            sourceCache[resource.id] = sourceInfo;
        }

        this.SourceInfo = sourceCache;
    }

    public static GetSourceInfo(room: Room): SourceInfo[] {
        return room.memory["sources"] as SourceInfo[];
    }

    private hasHostilesInRange(obj: RoomObject): boolean {
        let p = obj.pos;
        let r = 4;
        let creeps = obj.room.lookForAtArea(LOOK_CREEPS, p.y - r, p.x - r, p.y + r, p.x + r, true) as LookAtResultWithPos[];
        for (let i = creeps.length; --i >= 0;) {
            if (!creeps[i].creep.my) {
                return true;
            }
        }
        return false;
    }

    public getBestSource2(creep: Creep, currentSource?: Source): Source {
        //return creep.pos.findClosestByPath<Source>(FIND_SOURCES_ACTIVE, {
        //    filter: (s: Source) => {
        //        return !this.hasHostilesInRange(s);
        //    },
        //    algorithm: "astar"
        //});

        let sources = creep.room.find<Source>(FIND_SOURCES_ACTIVE);
        let sortedSources = _.sortBy(sources, (s) => {
            return MathHelper.squareDist(creep.pos, s.pos);
        });

        for (let i = 0; i < sortedSources.length; i++) {
            let s = sortedSources[i];
            if (currentSource && currentSource.id === s.id) {
                continue;
            }
            if (!this.hasHostilesInRange(s) && PathHelper.hasPathToTarget(creep, s, false)) {
                //console.log("Getting best source: " + creep.name + " " + creep.pos + " | " + s.pos);
                return s;
            }
        }

        return sortedSources[0];

        //let source = creep.pos.findClosestByRange<Source>(FIND_SOURCES_ACTIVE, {
        //    filter: (s: Source) => {
        //        return PathHelper.hasPathToTarget(creep, s) && !this.hasHostilesInRange(s);
        //    }
        //});

        //return source;

        //var room = creep.room;
        //var pos = creep.pos;
        //var sources: any[] = creep.room.memory["sources"];
        //var items = _.sortBy(sources, (s) => {
        //    return MathHelper.squareDist2(pos.x, pos.y, s.x, s.y);
        //});

        //for (let index in items) {
        //    let source = items[index] as any;
        //    let sourceId = source.sourceId;
        //    let availableSlots = source.totalSlots;
        //    let sourceX = source.x;
        //    let sourceY = source.y;

        //    let area = room.lookAtArea(sourceY - 1, sourceX - 1, sourceY + 1, sourceX + 1) as LookAtResultMatrix;

        //    for (let y in area) {
        //        for (let x in area[y]) {
        //            if (sourceX == x && sourceY == y) {
        //                continue;
        //            }

        //            let tiles = area[y][x] as LookAtResult[];

        //            for (let i in tiles) {
        //                // Check if tile is plain
        //                if (tiles[i].terrain === "plain") {

        //                    // If plain, check if obstructed
        //                    for (let i2 in tiles) {
        //                        let t = tiles[i2];

        //                        if (t.creep) {
        //                            if (t.creep.name === creep.name) {
        //                                return Game.getObjectById<Source>(sourceId);
        //                            }
        //                            --availableSlots;
        //                            break;
        //                        }
        //                        if (t.terrain === "wall" || t.source) {
        //                            --availableSlots;
        //                            break;
        //                        }
        //                    }
        //                }
        //            }
        //        }
        //    }

        //    if (availableSlots > 0) {
        //        return Game.getObjectById<Source>(sourceId);
        //    }
        //}

        //var maxSourceId = _.max(sources, s => s.totalSlots);
        //return Game.getObjectById<Source>(maxSourceId);
    }

    //public static getBestSource(creep: Creep): Source {
    //    var room = creep.room;
    //    var sources: any[] = creep.room.memory["sources"];

    //    var minAvailableSlots = 0;
    //    var maxAvailableSlots = 0;
    //    var maxAvailableSourceId = "";
    //    var maxSlotSourceId = "";

    //    for (let sourceId in sources) {
    //        let totalAvailableSlots = sources[sourceId].totalSlots;
    //        let availableSlots = totalAvailableSlots;
    //        let sourceX = sources[sourceId].x;
    //        let sourceY = sources[sourceId].y;
    //        let tiles = room.lookAtArea(sourceY - 1, sourceX - 1, sourceY + 1, sourceX + 1, true) as LookAtResultWithPos[];

    //        for (var i = tiles.length; --i >= 0;) {
    //            let o = tiles[i];
    //            let oX = o.x;
    //            let oY = o.y;

    //            if (o.terrain === "plain") {
    //                for (let j = tiles.length; --j >= 0;) {
    //                    let o2 = tiles[j];

    //                    if (o2.type === "creep" && oX === o2.x && oY === o2.y) {
    //                        availableSlots--;
    //                        break;
    //                    }
    //                }
    //            }
    //        }

    //        if (availableSlots > minAvailableSlots) {
    //            minAvailableSlots = availableSlots;
    //            maxAvailableSourceId = sourceId;
    //        }

    //        if (totalAvailableSlots > maxAvailableSlots) {
    //            maxAvailableSlots = totalAvailableSlots;
    //            maxSlotSourceId = sourceId;
    //        }
    //    }

    //    if (minAvailableSlots > 0) {
    //        return Game.getObjectById<Source>(maxAvailableSourceId);
    //    }

    //    return Game.getObjectById<Source>(maxSlotSourceId);
    //}
}