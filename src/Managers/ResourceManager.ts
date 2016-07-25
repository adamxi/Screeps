import {Cache} from "./../Util/Cache";

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
                "room": room.name,
                "totalSlots": availableSlots,
                "x": resource.pos.x,
                "y": resource.pos.y
            };
        }

        Cache.setValue("sources_" + room.name, sourceCache);
    }

    public static getBestSource(creep: Creep): Source {
        var room = creep.room;
        var sources = Cache.getValue("sources_" + room.name);
        var minAvailableSlots = 0;
        var maxAvailableSlots = 0;
        var maxAvailableSourceId = "";
        var maxSlotSourceId = "";

        for (let sourceId in sources) {
            let totalAvailableSlots = sources[sourceId].totalSlots;
            let availableSlots = totalAvailableSlots;
            let sourceX = sources[sourceId].x;
            let sourceY = sources[sourceId].y;
            let objects = room.lookAtArea(sourceY - 1, sourceX - 1, sourceY + 1, sourceX + 1, true) as LookAtResultWithPos[];
            
            for (var i = objects.length; --i >= 0;) {
                let obj = objects[i];
                let objX = obj.x;
                let objY = obj.y;
                
                if (obj.terrain === "plain") {
                    for (let j = objects.length; --j >= 0;) {
                        let o2 = objects[j];

                        if (o2.type === "creep" && objX === o2.x && objY === o2.y) {
                            availableSlots--;
                            break;
                        }
                    }
                }
            }

            if (availableSlots > minAvailableSlots) {
                minAvailableSlots = availableSlots;
                maxAvailableSourceId = sourceId;
            }

            if (totalAvailableSlots > maxAvailableSlots) {
                maxAvailableSlots = totalAvailableSlots;
                maxSlotSourceId = sourceId;
            }
        }

        if (minAvailableSlots > 0) {
            return Game.getObjectById(maxAvailableSourceId) as Source;
        }

        return Game.getObjectById(maxSlotSourceId) as Source;
    }
}