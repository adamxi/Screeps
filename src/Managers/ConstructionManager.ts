import {Config} from "./../Config/Config";
import {GameManager} from "./../Managers/GameManager";

export class ConstructionManager {
    private static ticksToRefresh = 60;
    private timer: number;

    private damagedStructureIds: string[] = [];
    private criticalStructureIds: string[] = [];
    private constructionSiteIds: string[] = [];

    constructor(room: Room) {
        this.update(room, true);
    }

    public update(room: Room, forceRefresh = false): void {
        if (forceRefresh || Game.time - this.timer >= ConstructionManager.ticksToRefresh) {
            this.timer = Game.time;
            this.mapStructures(room);
            console.log("ConstructionManager refresh");
        }
    }

    public getNext(): ConstructionResponse {
        var structure: Structure | ConstructionSite;
        structure = this.getNextFromCollection<Structure>(this.criticalStructureIds);
        if (structure) {
            return new ConstructionResponse(structure, Config.structurePriority[structure.structureType].critical * 1.5);
        }

        structure = this.getNextFromCollection<ConstructionSite>(this.constructionSiteIds);
        if (structure) {
            return new ConstructionResponse(structure, -1);
        }

        structure = this.getNextFromCollection<Structure>(this.damagedStructureIds);
        if (structure) {
            return new ConstructionResponse(structure, (structure as Structure).hitsMax);
        }

        return null;
    }

    public completed(objId: string, creep:Creep): void {
        for (let i = this.criticalStructureIds.length; --i >= 0;) {
            if (this.criticalStructureIds[i] === objId) {
                let obj = Game.getObjectById<Structure>(objId);
                console.log("Removed critical | index: " + i + " | hits: " + obj.hits + " | type: " + obj.structureType + " | id: " + objId + " | creep: " + creep.name);
                this.criticalStructureIds.splice(i, 1);
                return;
            }
        }

        for (let i = this.damagedStructureIds.length; --i >= 0;) {
            if (this.damagedStructureIds[i] === objId) {
                console.log("Removed damaged: " + i + " " + objId + " | creep: " + creep.name);
                this.damagedStructureIds.splice(i, 1);
                return;
            }
        }

        for (let i = this.constructionSiteIds.length; --i >= 0;) {
            if (this.constructionSiteIds[i] === objId) {
                console.log("Removed construction: " + i + " " + objId);
                this.constructionSiteIds.splice(i, 1);
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
        this.criticalStructureIds = [];
        this.damagedStructureIds = [];

        let structures = room.find<Structure>(FIND_STRUCTURES).sort((a, b) => a.hits > b.hits ? -1 : 1);
        for (let i = structures.length; --i >= 0;) {
            let s = structures[i];
            let sp = Config.structurePriority[s.structureType];
            if (sp) {
                if (s.hits <= sp.critical) {
                    this.criticalStructureIds.push(s.id);

                } else if (s.hitsMax - s.hits > sp.threshold) {
                    this.damagedStructureIds.push(s.id);
                }
            }
        }

        this.constructionSiteIds = room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES).map(s => s.id);
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