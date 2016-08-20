import {Config} from "./../Config/Config";
import {GameManager} from "./../Managers/GameManager";
import {ResourceManager} from "./../Managers/ResourceManager";
import {ErrorHelper} from "./../Util/ErrorHelper"
import {MathHelper} from "./../Util/MathHelper"
import {Timer} from "./../Components/Timer";
import {Profiler} from "./../Components/screeps-profiler";

export class ConstructionManager {
    private static SEARCH_ORDER_ASC = true;
    private static SEARCH_ORDER_DESC = false;
    private static DIST_TYPE_SQUARED = 0;
    private static DIST_TYPE_SQRT = 1;

    private timer: Timer;
    private roomName: string;

    private spawns: Spawn[];
    private sources: Source[];

    private structureMap: { [id: string]: Structure; };
    private structureCount: { [id: string]: number; };

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

    public update(): void {
        this.timer.update();
    }

    public timerElapsed(timer: Timer): void {
        this.mapStructures();
        this.planConstructions();
        //console.log("ConstructionManager update");
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

    public getNextDamaged(): ConstructionResponse {
        var structure: Structure;
        structure = this.getNextFromCollection<Structure>(this.CriticalStructureIds);
        if (structure) {
            return new ConstructionResponse(structure, Config.structurePriority[structure.structureType].critical * 1.5);
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
                this.CriticalStructureIds.splice(i, 1);
                return;
            }
        }

        for (let i = this.DamagedStructureIds.length; --i >= 0;) {
            if (this.DamagedStructureIds[i] === objId) {
                this.DamagedStructureIds.splice(i, 1);
                return;
            }
        }

        for (let i = this.ConstructionSiteIds.length; --i >= 0;) {
            if (this.ConstructionSiteIds[i] === objId) {
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

    private addStructureCount(structure: string): void {
        if (!this.structureCount[structure]) {
            this.structureCount[structure] = 1;
        } else {
            ++this.structureCount[structure];
        }
    }

    private getStructureCount(structure: string): number {
        let count = this.structureCount[structure];
        if (count) {
            return count;
        }
        return 0;
    }

    private mapStructures(): void {
        this.structureCount = {};
        this.CriticalStructureIds = [];
        this.DamagedStructureIds = [];

        let structures = this.Room.find<Structure>(FIND_STRUCTURES).sort((a, b) => a.hits > b.hits ? -1 : 1);
        for (let i = structures.length; --i >= 0;) {
            let s = structures[i];
            this.addStructureCount(s.structureType);

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
        let siteIds: string[] = [];
        let sites = this.Room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES);

        for (let s in sites) {
            let site = sites[s];
            siteIds.push(site.id);
            this.addStructureCount(site.structureType);
        }

        this.ConstructionSiteIds = siteIds;
        this.ConstructionSiteCount = siteIds.length;
    }

    private planConstructions(): void {
        this.spawns = this.Room.find<Spawn>(FIND_MY_SPAWNS);
        this.sources = this.Room.find<Source>(FIND_SOURCES);
        let hasController = this.Room.controller && this.Room.controller.my;

        if (hasController && this.ConstructionSiteCount < MAX_CONSTRUCTION_SITES) {
            this.constructSpawn();
            this.constructRoads();
            this.constructExtensions();
            this.constructContainers();
            this.constructTowers();
            this.constructStorage();
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
            let pathSteps = room.findPath(spawns[i].pos, controller.pos, {
                ignoreCreeps: true,
                ignoreRoads: true,
            });

            this.constructPath(pathSteps, STRUCTURE_ROAD);
        }

        if (this.ConstructionSiteCount >= MAX_CONSTRUCTION_SITES) {
            return;
        }

        let sources = this.sources;
        let sourceLen = sources.length;
        for (let i = spawns.length; --i >= 0;) {
            let spawnPos = spawns[i].pos;
            let sortedSources = _.sortBy(sources, (s) => {
                return MathHelper.dist(spawnPos, s.pos);
            });

            for (let j = 0; j < sourceLen; ++j) {
                let sourcePos = sortedSources[j].pos;

                let pathSteps = room.findPath(spawnPos, sourcePos, {
                    ignoreCreeps: true,
                    ignoreRoads: true,
                });

                this.constructPath(pathSteps, STRUCTURE_ROAD);

                if (this.ConstructionSiteCount >= MAX_CONSTRUCTION_SITES) {
                    return;
                }
            }
        }
    }

    private constructPath(pathSteps: PathStep[], structureType: string): void {
        let pStart = _.cloneDeep(pathSteps[0]);
        pStart.x -= pStart.dx;
        pStart.y -= pStart.dy;
        this.constructThickness(pStart, structureType);

        let len = pathSteps.length;
        for (let i = 0; i < len; i++) {
            let p = pathSteps[i];
            this.constructAt(p.x, p.y, structureType);
            //this.constructThickness(p, structureType);
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

    private constructSpawn(): void {
        let buildLimit = this.getStructureLimit(STRUCTURE_SPAWN);
        if (buildLimit <= 0) {
            return;
        }

        let sources = ResourceManager.GetSourceInfo(this.Room);
        let count = 0;
        let sourceId: string;

        for (let s in sources) {
            let source = sources[s];
            if (source.totalSlots > count) {
                count = source.totalSlots;
                sourceId = source.sourceId;
            }
        }

        let source = Game.getObjectById<Source>(sourceId);
        let range = 5;
        let p = source.pos;

        let params: FindTileParams = {
            area: this.Room.lookAtArea(p.y - range, p.x - range, p.y + range, p.x + range, true) as LookAtResultWithPos[],
            refPos: p,
            findCount: 1,
            searchOrder: ConstructionManager.SEARCH_ORDER_DESC,
            distanceType: ConstructionManager.DIST_TYPE_SQRT,
        }

        this.findTile(params, r => {
            return this.constructAt(p.x, p.y, STRUCTURE_SPAWN);
        });
    }

    private constructTowers(): void {
        if (this.spawns.length === 0) {
            return;
        }

        let limit = this.getStructureLimit(STRUCTURE_TOWER);
        if (limit <= 0) {
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

        let buildLimit = this.getStructureLimit(STRUCTURE_CONTAINER);
        if (buildLimit <= 0) {
            return;
        }

        let range = 1;
        let spawnPos = this.spawns[0].pos;
        let sourceLen = this.sources.length;
        let sortedSources = _.sortBy(this.sources, (s) => {
            return MathHelper.dist(spawnPos, s.pos);
        });

        for (let i = 0; i < sourceLen; i++) {
            let p = sortedSources[i].pos;
            let area = this.Room.lookAtArea(p.y - range, p.x - range, p.y + range, p.x + range, true) as LookAtResultWithPos[];
            let areaCount = this.findCountInArea(area, STRUCTURE_CONTAINER);
            let buildCount = Config.CONTAINERS_PER_SOURCE - areaCount;

            if (buildCount > 0) {
                let params: FindTileParams = {
                    area: area,
                    refPos: p,
                    findCount: Math.min(buildLimit, buildCount),
                    searchOrder: ConstructionManager.SEARCH_ORDER_ASC,
                    distanceType: ConstructionManager.DIST_TYPE_SQUARED,
                    requiresRoad: true,
                }
                buildLimit -= this.findTile(params, (x, y) => {
                    return this.constructAt(x, y, STRUCTURE_CONTAINER);
                });

                if (buildLimit <= 0) {
                    return;
                }
            }
        }
    }

    private constructStorage(): void {
        if (this.spawns.length === 0) {
            return;
        }

        let buildLimit = this.getStructureLimit(STRUCTURE_STORAGE);
        if (buildLimit <= 0) {
            return;
        }

        let range = 2;
        let p = this.spawns[0].pos;

        let params: FindTileParams = {
            area: this.Room.lookAtArea(p.y - range, p.x - range, p.y + range, p.x + range, true) as LookAtResultWithPos[],
            refPos: p,
            findCount: buildLimit,
            searchOrder: ConstructionManager.SEARCH_ORDER_ASC,
            distanceType: ConstructionManager.DIST_TYPE_SQUARED,
            nextToStructureType: STRUCTURE_ROAD,
        }

        this.findTile(params, (x, y) => {
            return this.constructAt(x, y, STRUCTURE_STORAGE);
        });
    }

    private constructExtensions(): void {
        let buildLimit = this.getStructureLimit(STRUCTURE_EXTENSION);
        if (buildLimit <= 0) {
            return;
        }

        let range = 10;
        let p = this.spawns[0].pos;

        let params: FindTileParams = {
            area: this.Room.lookAtArea(p.y - range, p.x - range, p.y + range, p.x + range, true) as LookAtResultWithPos[],
            refPos: p,
            findCount: buildLimit,
            searchOrder: ConstructionManager.SEARCH_ORDER_ASC,
            distanceType: ConstructionManager.DIST_TYPE_SQUARED,
            nextToStructureType: STRUCTURE_ROAD,
        }

        debugger;
        let vectors = MathHelper.dirToVector;

        this.findTile(params, (x, y) => {
            if (this.constructAt(x, y, STRUCTURE_EXTENSION)) {
                debugger;
                for (let i = 0; i < 8; i += 2) {
                    this.constructAt(x + vectors[i].x, y + vectors[i].y, STRUCTURE_ROAD);
                }
                return true;
            }
            return false;
        });
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

    private findTile(params: FindTileParams, onFind: { (x: number, y: number): boolean }): number {
        if (params.findCount <= 0) {
            return;
        }

        let tileMap: { [id: string]: { x: number, y: number, valid: boolean } } = {};
        let nextToStructureType = params.nextToStructureType;
        let area = params.area;
        let refPos = params.refPos;
        let tilesFound = 0;

        for (let i = area.length; --i >= 0;) {
            let tile = area[i];
            let tx = tile.x;
            let ty = tile.y;

            if (tx === refPos.x && ty === refPos.y) {
                continue;
            }

            let id = tx + "," + ty;
            let validTile = true;

            if (params.requiresRoad) {
                if (!(tile.structure instanceof StructureRoad)) {
                    validTile = false;
                }
            } else if (tile.terrain != "plain" || tile.structure || tile.source || tile.constructionSite) {
                validTile = false;
            }

            let tm = tileMap[id];
            if (tm) {
                if (!validTile) {
                    tm.valid = validTile;
                }
            }
            else if (validTile) {
                tileMap[id] = { x: tx, y: ty, valid: true }
            }
        }

        let distType = params.distanceType;

        let filteredMap = _.filter(tileMap, tm => tm.valid);

        let sortedMap = _.sortByOrder(filteredMap, tm => {
            return distType === ConstructionManager.DIST_TYPE_SQUARED ?
                MathHelper.squareDist2(refPos.x, refPos.y, tm.x, tm.y) :
                MathHelper.dist2(refPos.x, refPos.y, tm.x, tm.y);
        }, params.searchOrder);

        for (let t in sortedMap) {
            let tm = sortedMap[t];

            if (nextToStructureType) {
                if (this.isNextTo(tm.x, tm.y, nextToStructureType) && onFind(tm.x, tm.y)) {
                    if (++tilesFound >= params.findCount) {
                        break;
                    }
                }
            } else if (onFind(tm.x, tm.y)) {
                if (++tilesFound >= params.findCount) {
                    break;
                }
            }
        }

        //for (let i = 0; i < len; i++) {
        //    let tile = sortedTiles[i];

        //    if (params.requiresRoad) {
        //        if (!(tile.structure instanceof StructureRoad)) {
        //            continue;
        //        }
        //    } else if (tile.terrain != "plain") {
        //        continue;
        //    }

        //    let tx = tile.x;
        //    let ty = tile.y;
        //    let tileFree = true;

        //    for (let j = i + 1; j < len; j++) {
        //        let tile2 = sortedTiles[j];

        //        if (tx === tile2.x && ty == tile2.y && tile2.terrain != "plain") {
        //            tileFree = false;
        //            break;
        //        }
        //    }

        //    if (tileFree) {
        //        if (params.nextToStructureType) {
        //            if (this.isNextTo(tx, ty, params.nextToStructureType) && onFind(tile)) {
        //                if (++tilesFound >= params.findCount) {
        //                    break;
        //                }
        //            }
        //        } else if (onFind(tile)) {
        //            if (++tilesFound >= params.findCount) {
        //                break;
        //            }
        //        }
        //    }
        //}

        return tilesFound;
    }

    private isNextTo(x: number, y: number, type: string): boolean {
        let vectors = MathHelper.dirToVector;
        for (let i = vectors.length; --i >= 0;) {
            if (this.hasStructure(x + vectors[i].x, y + vectors[i].y, type)) {
                return true;
            }
        }
        return false;
    }

    private hasStructure(x: number, y: number, type: string): boolean {
        let structure = this.Room.lookForAt<Structure>(LOOK_STRUCTURES, x, y);
        return structure.length > 0 && structure[0].structureType === type;
    }

    private findCountInArea(area: LookAtResultWithPos[], type: string): number {
        let count = 0;

        for (let i = area.length; --i >= 0;) {
            let tile = area[i];

            if (tile.constructionSite && tile.constructionSite.structureType === type ||
                tile.structure && tile.structure.structureType === type) {
                ++count;
            }
        }

        return count;
    }

    private getStructureLimit(structure: string): number {
        return (CONTROLLER_STRUCTURES as any)[structure][this.Room.controller.level] - this.getStructureCount(structure);
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