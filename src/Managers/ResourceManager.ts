import {MathHelper} from "./../Util/MathHelper";

export class ResourceManager {
    public static locateResources(room: Room) {
        var resources: any[] = room.find(FIND_SOURCES);
        var sourceCache: any = {};

        for (let i = resources.length; --i >= 0;) {
            var resource = resources[i];
            var pos = resource.pos;
            var availableSlots = 0;
            var objects: any = room.lookAtArea(pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);

            for (let j = objects.length; --j >= 0;) {
                if (objects[j].terrain === "plain") {
                    availableSlots++;
                }
            }

            sourceCache[resource.id] = {
                "sourceId": resource.id,
                "room": room.name,
                "totalSlots": availableSlots,
                "x": resource.pos.x,
                "y": resource.pos.y
            };
        }

        room.memory["sources"] = sourceCache;
    }

    public static getBestSource2(creep: Creep): Source {
        return creep.pos.findClosestByPath<Source>(FIND_SOURCES_ACTIVE);

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