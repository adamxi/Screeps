import {GameObject} from "./GameObject";
import {ResourceManager} from "./../Managers/ResourceManager";
import {RoomManager} from "./../Managers/RoomManager";
import {ErrorHelper} from "./../Util/ErrorHelper";

export abstract class CreepObject extends GameObject {
    protected creepName: string;

    constructor(creep: Creep, role: CreepRole, initialState: CreepState) {
        super();
        this.creepName = creep.name;

        this.Creep.setMemory("state", initialState, false);
        this.Creep.setRole(role);
    }

    public get Creep(): Creep {
        return Game.creeps[this.creepName];
    }

    private getSource(): Source {
        let target = ResourceManager.getBestSource2(this.Creep);
        return this.Creep.setTarget(target);
    }

    protected getStorage(includeEmpty = false): Storage | Container {
        let target = this.Creep.getTarget<Storage | Container>();
        if (!target) {
            target = this.Creep.pos.findClosestByRange<Storage | Container>(FIND_STRUCTURES, {
                filter: (c: Storage | Container) => {
                    return (
                        c.structureType === STRUCTURE_CONTAINER ||
                        c.structureType === STRUCTURE_STORAGE) &&
                        (includeEmpty ? c.store[RESOURCE_ENERGY] >= 0 : c.store[RESOURCE_ENERGY] > 0);
                }
            });
            this.Creep.setTarget(target)
        }
        return target;
    }

    protected doHarvest(): boolean {
        let creep = this.Creep;
        if (creep.carry.energy < creep.carryCapacity) {
            let target = creep.getTarget<Source | Mineral>();
            if (!target) {
                target = creep.setTarget(this.getSource());
            }

            if (target) {
                let resp = creep.harvest(target);
                switch (resp) {
                    case OK:
                        break;

                    case ERR_NOT_IN_RANGE:
                        let moveResp = creep.moveTo(target);
                        switch (moveResp) {
                            case ERR_NO_PATH:
                                creep.clearTarget();
                                break;

                            //default:
                            //    console.log(creep.name + " | moveTo: " + ErrorHelper.getErrorString(resp));
                            //    break;
                        }
                        break;

                    case ERR_NOT_ENOUGH_ENERGY:
                        return false;

                    default:
                        console.log(creep.name + " | harvest: " + ErrorHelper.getErrorString(resp));
                        break;
                }
            }
            return true;
        }

        return false;
    }

    protected moveToIdlePos(): boolean {
        var creep = this.Creep;
        creep.log("Moving to idle position");
        creep.clearTarget();
        var flag = Game.flags[creep.room.name + "_idle"];

        if (flag) {
            creep.moveTo(flag.pos.x, flag.pos.y)
            return true;
        }

        return false;
    }

    protected setState(state: CreepState, clearTarget = true): void {
        this.Creep.setState(state, clearTarget);
    }

    protected doDispose(): void {
        delete Memory.creeps[this.creepName];
    }

    public load(): void {
        //this.Creep = Game.creeps[this.creepName];
        if (!this.Creep) {
            this.dispose();
        } else if (this.Creep.ticksToLive === 1) {
            this.willDie();
        }
    }

    public willDie(): void {
        RoomManager.roomManagers[this.Creep.room.name].CreepConstraints[this.Creep.getRole()].populationCount--;
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