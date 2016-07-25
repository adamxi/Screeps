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
    public room: Room;
    public roomName: string;
    public creepConstraint: CreepConstraint[];
    private creepCount: number;
    private creepConstraintInvTotalWeight: number;
    private nextCreepRole: CreepRole;
    public constructionManager: ConstructionManager;
    //public defenceManager: DefenceManager;

    constructor(room: Room) {
        this.room = room;
        this.roomName = room.name;
        this.constructionManager = new ConstructionManager(room);
        //this.defenceManager = new DefenceManager(room);

        this.initCreepConstraints();
        this.nextCreepRole = this.getNextRole();

        ResourceManager.locateResources(room);
    }

    private initCreepConstraints() {
        this.creepConstraint = [];
        this.creepConstraint[CreepRole.Harvester] = new CreepConstraint(CreepRole.Harvester, 10, 5);
        this.creepConstraint[CreepRole.Upgrader] = new CreepConstraint(CreepRole.Upgrader, 5, 3);
        this.creepConstraint[CreepRole.Builder] = new CreepConstraint(CreepRole.Builder, 8, 6);
        this.creepConstraint[CreepRole.Carrier] = new CreepConstraint(CreepRole.Carrier, 2, 2, r => {
            return this.room.find(FIND_STRUCTURES, {
                filter: (s: Storage | Container) => {
                    return (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE)
                }
            }).length > 0;
        });

        var sum = 0;
        for (let c in this.creepConstraint) {
            sum += this.creepConstraint[c].populationWeight;
        }

        this.creepConstraintInvTotalWeight = 1 / sum;
    }

    public countPopulation(): void {
        // TODO: Does not count the creep types currently being spawned.
        this.creepCount = 0;

        for (let i = this.creepConstraint.length; --i >= 0;) {
            this.creepConstraint[i].populationCount = 0;
        }

        for (let c in Game.creeps) {
            let creep = Game.creeps[c];

            if (creep.room.name === this.roomName) {
                let role = creep.getRole();
                let constraint = this.creepConstraint[role];

                if (constraint) {
                    ++constraint.populationCount;
                    ++this.creepCount;
                }
            }
        }
    }

    public hasRole(role: CreepRole): boolean {
        var c = this.creepConstraint[role];
        if (c) {
            return c.populationCount > 0;
        }
        return false;
    }

    public getNextRole(): CreepRole {
        this.countPopulation();

        let targetConstraint: CreepConstraint;
        let maxScore = Number.NEGATIVE_INFINITY;
        let len = this.creepConstraint.length;

        for (let i = 0; i < len; ++i) {
            let constraint = this.creepConstraint[i];
            if (constraint.populationMax != -1 && constraint.populationCount >= constraint.populationMax ||
                !constraint.spawnCondition(this.room)) {
                continue;
            }

            let score = MathHelper.getWeightedScore(constraint.populationWeight, this.creepConstraintInvTotalWeight, constraint.populationCount, this.creepCount);
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
            let spawn: Spawn = Game.spawns[n];
            if (!spawn.spawning && spawn.room.name === this.roomName) {
                return spawn;
            }
        }
        return null;
    }

    private load(): void {
        this.room = Game.rooms[this.roomName] as Room;
    }

    public update(): void {
        this.load();

        if (this.room) {
            this.constructionManager.update(this.room);

            if (this.nextCreepRole != undefined) {
                let creepObj = Spawner.spawnCreep(this.nextCreepRole, this.getNextSpawn());

                if (creepObj) {
                    this.nextCreepRole = this.getNextRole();
                }
            }

            this.doDefence();
        }
    }

    private doDefence(): void {
        var hostiles = this.room.find<Creep>(FIND_HOSTILE_CREEPS);

        if (hostiles.length > 0) {
            var towers = this.room.find<StructureTower>(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_TOWER }
            });

            towers.forEach(tower => tower.attack(hostiles[0]));
        }
    }
}