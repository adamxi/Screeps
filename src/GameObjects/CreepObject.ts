import {GameObject} from "./GameObject";
import {ResourceManager} from "./../Managers/ResourceManager";
import {RoomManager} from "./../Managers/RoomManager";
import {ErrorHelper} from "./../Util/ErrorHelper";

export abstract class CreepObject extends GameObject {
    public creep: Creep;
    private creepName: string;

    constructor(creep: Creep, role: CreepRole, initialState: CreepState) {
        super();
        this.creep = creep;
        this.creepName = creep.name;

        creep.setMemory("state", initialState, false);
        creep.setRole(role);
    }

    private acquireSource(): Source {
        let source = ResourceManager.getBestSource(this.creep);
        this.creep.setTarget(source);
        return source;
    }

    protected doHarvest(): boolean {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            let target = this.getOrSetTarget<Source | Mineral>((o: CreepObject) => {
                let source = o.acquireSource();
                return { target: source };
            });

            if (target) {
                let harvestResp = this.creep.harvest(target);
                this.creep.log("Harvest: " + ErrorHelper.getErrorString(harvestResp));
                switch (harvestResp) {
                    case ERR_NOT_IN_RANGE:
                        let moveResp = this.creep.moveTo(target);
                        this.creep.log("Move: " + ErrorHelper.getErrorString(moveResp));
                        break;
                }
            }
            return true;
        }

        return false;
    }

    protected getStorage(includeEmpty = false): Storage | Container {
        return this.getOrSetTarget<Storage | Container>((o: CreepObject) => {
            let target = o.creep.pos.findClosestByRange<Storage | Container>(FIND_STRUCTURES, {
                filter: (c: Storage | Container) => {
                    return (
                        c.structureType === STRUCTURE_CONTAINER ||
                        c.structureType === STRUCTURE_STORAGE) &&
                        (includeEmpty ? c.store[RESOURCE_ENERGY] >= 0 : c.store[RESOURCE_ENERGY] > 0);
                }
            });

            return { target: target }
        });
    }

    protected moveToIdlePos(): boolean {
        var creep = this.creep;
        creep.clearTarget();
        var flag = Game.flags[creep.room.name + "_idle"];

        if (flag) {
            creep.moveTo(flag.pos.x, flag.pos.y)
            return true;
        }

        return false;
    }

    protected setState(state: CreepState, clearTarget = true): void {
        this.creep.setState(state, clearTarget);
        //this.update();
    }

    protected getOrSetTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(func: (o: CreepObject) => { target: T, params?: {} }): T {
        let target = this.creep.getTarget<T>();

        if (!target) {
            let resp = func(this);
            target = resp.target;
            this.creep.setTarget(resp.target, resp.params);
        }

        return target;
    }

    protected doDispose(): void {
        delete Memory.creeps[this.creepName];
    }

    public load(): void {
        this.creep = Game.creeps[this.creepName];
        if (!this.creep) {
            this.dispose();
        } else if (this.creep.ticksToLive === 1) {
            this.willDie();
        }
    }

    public willDie(): void {
        RoomManager.roomManagers[this.creep.room.name].creepConstraint[this.creep.getRole()].populationCount--;
    }
}

export enum CreepState {
    Idle,
    Moving,
    Working,
    Harvesting,
    Upgrading,
    Building,
    Collecting
}

export enum CreepRole {
    Harvester,
    Builder,
    Upgrader,
    Carrier
}