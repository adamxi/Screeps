import {Spawner} from "./../Util/Spawner";
import {CreepConstraint} from "./../Util/CreepConstraint";
import {CreepFactory} from "./../Util/CreepFactory";
import {GameObject} from "./../GameObjects/GameObject";
import {CreepObject} from "./../GameObjects/CreepObject";
import {ResourceManager} from "./../Managers/ResourceManager";
import {ConstructionManager} from "./../Managers/ConstructionManager";
import {DefenceManager} from "./../Managers/DefenceManager";
import {MathHelper} from "./../Util/MathHelper";

export class RoomManager {
    public static roomManagers: { [id: string]: RoomManager; } = {};
    private static spawnConditions: { (room: Room): boolean; }[];

    public roomName: string;
    public constructionManager: ConstructionManager;

    constructor(room: Room) {
        this.roomName = room.name;
        this.constructionManager = new ConstructionManager(room);
        this.SpawnTimer = 30;

        this.initCreepConstraints();
        this.countPopulation();
        ResourceManager.locateResources(room);
    }

    private get Room(): Room {
        return Game.rooms[this.roomName];
    }

    private get SpawnTimer(): number {
        return this.Room.memory["timer"];
    }
    private set SpawnTimer(value: number) {
        this.Room.memory["timer"] = value;
    }

    private get CreepCount(): number {
        return this.Room.memory["creepCount"];
    }
    private set CreepCount(value: number) {
        this.Room.memory["creepCount"] = value;
    }

    private get CreepConstraintInvTotalWeight(): number {
        return this.Room.memory["creepConstraintInvTotalWeight"];
    }
    private set CreepConstraintInvTotalWeight(value: number) {
        this.Room.memory["creepConstraintInvTotalWeight"] = value;
    }

    public get CreepConstraints(): CreepConstraint[] {
        return this.Room.memory["creepConstrains"];
    }
    public set CreepConstraints(value: CreepConstraint[]) {
        this.Room.memory["creepConstrains"] = value;
    }

    private initCreepConstraints() {
        this.CreepConstraints = [];
        this.CreepConstraints[CreepRole.Harvester] = new CreepConstraint(CreepRole.Harvester, 10, 5);
        this.CreepConstraints[CreepRole.Upgrader] = new CreepConstraint(CreepRole.Upgrader, 5, 4);
        this.CreepConstraints[CreepRole.Builder] = new CreepConstraint(CreepRole.Builder, 8, 4);
        this.CreepConstraints[CreepRole.Carrier] = new CreepConstraint(CreepRole.Carrier, 2, 2);

        RoomManager.spawnConditions = [];
        RoomManager.spawnConditions[CreepRole.Carrier] = r => {
            return r.find(FIND_STRUCTURES, {
                filter: (s: Storage | Container) => {
                    return (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE)
                }
            }).length > 0;
        };

        var sum = 0;
        for (let c in this.CreepConstraints) {
            sum += this.CreepConstraints[c].populationWeight;
        }

        this.CreepConstraintInvTotalWeight = 1 / sum;
    }

    public countPopulation(): void {
        // TODO: Does not count the creep types currently being spawned.
        this.CreepCount = 0;

        for (let i = this.CreepConstraints.length; --i >= 0;) {
            this.CreepConstraints[i].populationCount = 0;
        }

        for (let c in Game.creeps) {
            let creep = Game.creeps[c];
            if (creep.room.name === this.roomName) {
                let role = creep.getRole();
                let constraint = this.CreepConstraints[role];

                if (constraint) {
                    ++constraint.populationCount;
                    ++this.CreepCount;
                }
            }
        }
    }

    public hasRole(role: CreepRole): boolean {
        var c = this.CreepConstraints[role];
        if (c) {
            return c.populationCount > 0;
        }
        return false;
    }

    public getNextRole(): CreepRole {
        this.countPopulation();

        let targetConstraint: CreepConstraint;
        let maxScore = Number.NEGATIVE_INFINITY;
        let len = this.CreepConstraints.length;

        for (let i = 0; i < len; i++) {
            let constraint = this.CreepConstraints[i];
            if (constraint.populationMax != -1 && constraint.populationCount >= constraint.populationMax) {
                continue;
            }

            let sc = RoomManager.spawnConditions[constraint.role];
            if (sc && !sc(this.Room)) {
                continue;
            }

            let score = MathHelper.getWeightedScore(constraint.populationWeight, this.CreepConstraintInvTotalWeight, constraint.populationCount, this.CreepCount);
            if (score > maxScore) {
                maxScore = score;
                targetConstraint = constraint;
            }
        }

        if (targetConstraint) {
            return targetConstraint.role;
        }
        return null;
    }

    public getNextSpawn(): Spawn {
        for (let n in Game.spawns) {
            let spawn = Game.spawns[n];

            if (!spawn.spawning && spawn.room.name === this.roomName) {
                return spawn;
            }
        }
        return null;
    }

    public checkSpawn(): void {
        let spawn = this.getNextSpawn();

        if (spawn) {
            let role = this.getNextRole();
            let creepObj = Spawner.spawnCreep(role, spawn);
            if (creepObj) {
                this.CreepConstraints[role].populationCount++;
            }
        }
    }

    private load(): void {
        //this.room = Game.rooms[this.roomName];
    }

    public update(): void {
        //this.load();

        if (this.Room) {
            this.checkSpawn();
            this.constructionManager.update();
            this.doDefence();
        }
    }

    private doDefence(): void {
        var hostiles = this.Room.find<Creep>(FIND_HOSTILE_CREEPS);

        if (hostiles.length > 0) {
            var towers = this.Room.find<StructureTower>(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_TOWER }
            });

            towers.forEach(tower => tower.attack(hostiles[0]));
        }
    }
}