import {Config} from "./../Config/Config";
import {GameManager} from "./../Managers/GameManager";

export class ConstructionManager {
    private static ticksToRefresh = 60;
    private roomName: string;

    constructor(room: Room) {
        this.roomName = room.name;
        this.Timer = 0;
        this.update(room, true);
    }

    public get Room(): Room {
        return Game.rooms[this.roomName];
    }

    public get Timer(): number {
        return this.Room.memory["timer_construction"];
    }
    public set Timer(value: number) {
        this.Room.memory["timer_construction"] = value;
    }

    public get CriticalStructureIds(): string[] {
        return this.Room.memory["criticalStructureIds"];
    }
    public set CriticalStructureIds(value: string[]) {
        this.Room.memory["criticalStructureIds"] = value;
    }

    public get DamagedStructureIds(): string[] {
        return this.Room.memory["damagedStructureIds"];
    }
    public set DamagedStructureIds(value: string[]) {
        this.Room.memory["damagedStructureIds"] = value;
    }

    public get ConstructionSiteIds(): string[] {
        return this.Room.memory["constructionSiteIds"];
    }
    public set ConstructionSiteIds(value: string[]) {
        this.Room.memory["constructionSiteIds"] = value;
    }

    public update(room: Room, forceRefresh = false): void {
        if (forceRefresh || ++this.Timer >= ConstructionManager.ticksToRefresh) {
            this.Timer = 0;
            this.mapStructures(room);
        }
    }

    public getNext(): ConstructionResponse {
        var structure: Structure | ConstructionSite;
        structure = this.getNextFromCollection<Structure>(this.CriticalStructureIds);
        if (structure) {
            return new ConstructionResponse(structure, Config.structurePriority[structure.structureType].critical * 1.5);
        }

        structure = this.getNextFromCollection<ConstructionSite>(this.ConstructionSiteIds);
        if (structure) {
            return new ConstructionResponse(structure, -1);
        }

        structure = this.getNextFromCollection<Structure>(this.DamagedStructureIds);
        if (structure) {
            return new ConstructionResponse(structure, (structure as Structure).hitsMax);
        }

        return null;
    }

    public completed(objId: string, creep: Creep): void {
        for (let i = this.CriticalStructureIds.length; --i >= 0;) {
            if (this.CriticalStructureIds[i] === objId) {
                //let obj = Game.getObjectById<Structure>(objId);
                //console.log("Removed critical | index: " + i + " | hits: " + obj.hits + " | type: " + obj.structureType + " | id: " + objId + " | creep: " + creep.name);
                this.CriticalStructureIds.splice(i, 1);
                return;
            }
        }

        for (let i = this.DamagedStructureIds.length; --i >= 0;) {
            if (this.DamagedStructureIds[i] === objId) {
                //console.log("Removed damaged: " + i + " " + objId + " | creep: " + creep.name);
                this.DamagedStructureIds.splice(i, 1);
                return;
            }
        }

        for (let i = this.ConstructionSiteIds.length; --i >= 0;) {
            if (this.ConstructionSiteIds[i] === objId) {
                //console.log("Removed construction: " + i + " " + objId);
                this.ConstructionSiteIds.splice(i, 1);
                return;
            }
        }
    }

    private getNextFromCollection<T extends Structure | ConstructionSite>(ids: string[]): T {
        let count = ids.length;
        if (count > 0) {
            for (let type in Config.structurePriority) {
                for (let i = 0; i < count; ++i) {
                    let s = Game.getObjectById<T>(ids[i]);
                    if (s && s.structureType === type) {
                        return s;
                    }
                }
            }
        }

        return null;
    }

    private mapStructures(room: Room): void {
        this.CriticalStructureIds = [];
        this.DamagedStructureIds = [];

        let structures = room.find<Structure>(FIND_STRUCTURES).sort((a, b) => a.hits > b.hits ? -1 : 1);
        for (let i = structures.length; --i >= 0;) {
            let s = structures[i];
            let sp = Config.structurePriority[s.structureType];
            if (sp) {
                if (s.hits <= sp.critical) {
                    this.CriticalStructureIds.push(s.id);

                } else if (s.hitsMax - s.hits > sp.threshold) {
                    this.DamagedStructureIds.push(s.id);
                }
            }
        }

        this.ConstructionSiteIds = room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES).map(s => s.id);
    }
}

export class ConstructionResponse {
    public structure: Structure | ConstructionSite;
    public targetHits: number;

    constructor(structure: Structure | ConstructionSite, targetHits: number) {
        this.structure = structure;
        this.targetHits = targetHits;
    }
}