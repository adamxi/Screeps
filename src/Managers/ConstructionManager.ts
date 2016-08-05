import {Config} from "./../Config/Config";
import {GameManager} from "./../Managers/GameManager";
import {ErrorHelper} from "./../Util/ErrorHelper"
import {MathHelper} from "./../Util/MathHelper"
import {Timer} from "./../Components/Timer";

export class ConstructionManager {
    private timer: Timer;
    private roomName: string;

    private spawns: Spawn[];
    private sources: Source[];

    constructor(room: Room) {
        this.roomName = room.name;

        this.timer = new Timer(this.roomName + "_constructionManager", Config.TIMER_CONSTRUCTORMANAGER_UPDATE, t => this.timerElapsed(t));
        this.update();
    }

    public get Room(): Room {
        return Game.rooms[this.roomName];
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

    public get ConstructionSiteCount(): number {
        return this.Room.memory["constructionSiteCount"];
    }
    public set ConstructionSiteCount(value: number) {
        this.Room.memory["constructionSiteCount"] = value;
    }

    public timerElapsed(timer: Timer): void {
        this.mapStructures();
        this.planConstructions();
        console.log("ConstructionManager update");
    }

    public update(): void {
        this.timer.update();
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
                for (let i = 0; i < count; i++) {
                    let s = Game.getObjectById<T>(ids[i]);
                    if (s && s.structureType === type) {
                        return s;
                    }
                }
            }
        }

        return null;
    }

    private mapStructures(): void {
        this.CriticalStructureIds = [];
        this.DamagedStructureIds = [];

        let structures = this.Room.find<Structure>(FIND_STRUCTURES).sort((a, b) => a.hits > b.hits ? -1 : 1);
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

        this.mapConstructionSites();
    }

    private mapConstructionSites() {
        let ids = this.Room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES).map(s => s.id);
        this.ConstructionSiteIds = ids;
        this.ConstructionSiteCount = ids.length;
    }

    private planConstructions(): void {
        this.spawns = this.Room.find<Spawn>(FIND_MY_SPAWNS);
        this.sources = this.Room.find<Source>(FIND_SOURCES);

        if (this.ConstructionSiteCount < MAX_CONSTRUCTION_SITES) {
            this.constructRoads();
            this.constructExtensions();
            this.constructContainers();
            this.constructTowers();
        }
    }

    private constructRoads(): void {
        let room = this.Room;

        let controller = room.controller;
        if (!controller) {
            return;
        }

        let spawns = this.spawns;
        for (let i = spawns.length; --i >= 0;) {
            let spawnPos = spawns[i].pos;

            let pathSteps = room.findPath(spawnPos, controller.pos, {
                ignoreCreeps: true,
                ignoreRoads: true,
            });

            this.constructPath(pathSteps, STRUCTURE_ROAD);
        }

        if (this.ConstructionSiteCount >= MAX_CONSTRUCTION_SITES) {
            return;
        }

        let sources = this.sources;
        for (let i = spawns.length; --i >= 0;) {
            let spawnPos = spawns[i].pos;
            let sortedSources = _.sortBy(sources, (s) => {
                return MathHelper.dist(spawnPos, s.pos);
            });

            for (let j = 0; j < sortedSources.length; j++) {
                let sourcePos = sortedSources[j].pos;

                let pathSteps = room.findPath(spawnPos, sourcePos, {
                    ignoreCreeps: true,
                    ignoreRoads: true,
                });

                this.constructPath(pathSteps, STRUCTURE_ROAD);
                break;
            }
        }
    }

    private constructPath(pathSteps: PathStep[], structureType: string): void {
        let room = this.Room;
        let pStart = _.cloneDeep(pathSteps[0]);
        pStart.x -= pStart.dx;
        pStart.y -= pStart.dy;
        this.constructThickness(pStart, structureType);

        let len = pathSteps.length;
        for (let i = 0; i < len; i++) {
            let p = pathSteps[i];
            this.constructAt(p.x, p.y, structureType);
            this.constructThickness(p, structureType);
        }
    }

    private constructThickness(step: PathStep, structureType: string) {
        switch (step.direction) {
            case TOP_LEFT:
            case TOP_RIGHT:
            case BOTTOM_LEFT:
            case BOTTOM_RIGHT:
                let nextDir = MathHelper.getNextDir(step.direction);
                let nextVec = MathHelper.getVectorDir(nextDir);
                if (!this.constructAt(step.x + nextVec.x, step.y + nextVec.y, structureType)) {
                    let prevDir = MathHelper.getPrevDir(step.direction);
                    let prevVec = MathHelper.getVectorDir(prevDir);
                    this.constructAt(step.x + prevVec.x, step.y + prevVec.y, structureType)

                    let vec = MathHelper.getOppositeVector(nextVec);
                    this.constructAt(step.x + vec.x, step.y + vec.y, structureType)
                }

                nextDir = MathHelper.getNextDir(step.direction + 2);
                nextVec = MathHelper.getVectorDir(nextDir);
                if (!this.constructAt(step.x + nextVec.x, step.y + nextVec.y, structureType)) {
                    let prevDir = MathHelper.getPrevDir(step.direction);
                    let prevVec = MathHelper.getVectorDir(prevDir);
                    this.constructAt(step.x + prevVec.x, step.y + prevVec.y, structureType)
                }
                break;

            case TOP:
            case BOTTOM:
            case LEFT:
            case RIGHT:
                let vec = MathHelper.getVectorRight(step.dx, step.dy);
                if (!this.constructAt(step.x + vec.x, step.y + vec.y, structureType)) {
                    vec = MathHelper.getOppositeVector(vec);
                    this.constructAt(step.x + vec.x, step.y + vec.y, structureType)
                }

                this.constructAt(step.x + step.dx, step.y + step.dy, structureType)
                break;
        }
    }


    private constructTowers(): void {
        let limit = this.getStructureLimit(STRUCTURE_TOWER);
        if (this.spawns.length === 0) {
            return;
        }

        let spawn = this.spawns[0];
        let p = spawn.pos;
        let r = 4;
        let result = spawn.room.lookAtArea(p.y - r, p.x - r, p.y + r, p.x + r) as LookAtResultMatrix;
        let prevPos: RoomPosition = null;

        for (let i = 0; i < limit; i++) {
            let resp = this.getAvailableTile(result, prevPos);
            if (resp.available) {
                prevPos = resp.pos;
                this.constructAt(prevPos.x, prevPos.y, STRUCTURE_TOWER);
            }
        }
    }

    private constructContainers(): void {
        if (this.sources.length === 0) {
            return;
        }

        let limit = this.getStructureLimit(STRUCTURE_CONTAINER);
        let currentCount = this.Room.find<Structure>(FIND_MY_STRUCTURES, {
            filter: (s: Structure) => s.structureType === STRUCTURE_CONTAINER
        }).length;

        if (currentCount >= limit) {
            return;
        }

        let range = 1;
        let spawnPos = this.spawns[0].pos;
        let sortedSources = _.sortBy(this.sources, (s) => {
            return MathHelper.dist(spawnPos, s.pos);
        });
        let sourceLen = sortedSources.length;

        for (let i = 0; i < sourceLen; i++) {
            if (limit <= 0) {
                return;
            }
            
            let p = sortedSources[i].pos;
            let area = this.Room.lookAtArea(p.y - range, p.x - range, p.y + range, p.x + range, true) as LookAtResultWithPos[];
            limit -= this.getClosestAvailableTile(area, p, Math.min(limit, Config.CONTAINERS_PER_SOURCE), STRUCTURE_CONTAINER, r => {
                return this.constructAt(r.x, r.y, STRUCTURE_CONTAINER);
            });
        }
    }

    private constructExtensions(): void {
    }

    private constructAt(x: number, y: number, structureType: string): boolean {
        let resp = this.Room.createConstructionSite(x, y, structureType);

        switch (resp) {
            case OK:
                ++this.ConstructionSiteCount;
                return true;

            case ERR_INVALID_ARGS:
            case ERR_INVALID_TARGET:
                let sites = this.Room.lookForAt<ConstructionSite>(LOOK_CONSTRUCTION_SITES, x, y);
                for (let s in sites) {
                    if (sites[s].structureType === structureType) {
                        // Structure type already planned at current position.
                        return true;
                    }
                }

                let structures = this.Room.lookForAt<Structure>(LOOK_STRUCTURES, x, y);
                for (let s in structures) {
                    if (structures[s].structureType === structureType) {
                        // Structure type already built at current position.
                        return true;
                    }
                }

                // Structure type not planned at current position.
                return false;

            case ERR_FULL:
            case ERR_RCL_NOT_ENOUGH:
                //console.log(this.Room.name + " | createConstructionSite: " + ErrorHelper.getErrorString(resp));
                return false;
        }
    }

    private getAvailableTile(area: LookAtResultMatrix, prevPos: RoomPosition, includeRoads = true): { available: boolean, pos: RoomPosition } {
        for (let y in area) {
            if (prevPos && prevPos.y.toString() === y) {
                continue;
            }

            for (let x in area[y]) {
                if (prevPos && prevPos.x.toString() === x) {
                    continue;
                }

                let tiles = area[y][x] as LookAtResult[];
                let tileFree = true;
                for (let i in tiles) {
                    let tile = tiles[i];

                    if (tile.structure) {
                        if (tile.structure instanceof StructureRoad && includeRoads) {
                            tileFree = false;
                            break;
                        } else {
                            tileFree = false;
                            break;
                        }
                    }

                    if (tile.source || tile.constructionSite || tile.terrain === "wall") {
                        tileFree = false;
                        break;
                    }
                }

                if (tileFree) {
                    return {
                        available: true,
                        pos: new RoomPosition(parseInt(x), parseInt(y), this.roomName),
                    }
                }
            }
        }

        return {
            available: false,
            pos: null
        }
    }

    private getClosestAvailableTile(area: LookAtResultWithPos[], refPos: RoomPosition, findCount: number, structureType: string, onFind: { (result: LookAtResultWithPos): boolean }): number {
        let sortedTiles = _.sortBy(area, (t) => {
            return MathHelper.squareDist2(refPos.x, refPos.y, t.x, t.y);
        });

        let structuresFound = 0;
        let tileLen = sortedTiles.length;
        for (let i = 0; i < tileLen; i++) {
            let tile = sortedTiles[i];
            let tx = tile.x;
            let ty = tile.y;

            if (structuresFound >= findCount) {
                break;
            }

            if (tile.structure instanceof StructureRoad) {
                let tileFree = true;

                for (let j = i + 1; j < tileLen; j++) {
                    let tile2 = sortedTiles[j];

                    if (tx === tile2.x && ty == tile2.y) {
                        if (tile2.constructionSite && tile2.constructionSite.structureType === structureType ||
                            tile2.structure && tile2.structure.structureType === structureType) {
                            ++structuresFound;
                            tileFree = false;
                            break;
                        }
                        if (tile2.structure || tile2.source || tile2.terrain === "wall") {
                            tileFree = false;
                            break;
                        }
                    }
                }

                if (tileFree) {
                    if (onFind(tile)) {
                        ++structuresFound;
                    }
                }
            }
        }

        return structuresFound;
    }


    //private tileAvailable(x: number, y: number): boolean {
    //    let results = this.Room.lookAt(x, y);
    //    for (let r in results) {
    //        let result = results[r];
    //        if (result.constructionSite || result.structure || result.source || result.terrain === "wall") {
    //            return false;
    //        }
    //    }

    //    return true;
    //}

    private getStructureLimit(structure: string): number {
        return (CONTROLLER_STRUCTURES as any)[structure][this.Room.controller.level];
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