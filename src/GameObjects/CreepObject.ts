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
        return ResourceManager.getBestSource2(this.Creep);
    }

    protected getStorage(): Storage | Container {
        let target = this.Creep.getTarget<Storage | Container>(StructureStorage, StructureContainer);
        if (!target) {
            target = this.Creep.pos.findClosestByRange<Storage | Container>(FIND_STRUCTURES, {
                filter: (c: Storage | Container) => {
                    return (
                        c.structureType === STRUCTURE_CONTAINER ||
                        c.structureType === STRUCTURE_STORAGE) &&
                        c.store[RESOURCE_ENERGY] > 0;
                }
            });
            this.Creep.setTarget(target)
        }
        return target;
    }

    protected getDroppedResource(): Resource {
        let target = this.Creep.getTarget<Resource>(Resource);
        if (!target) {
            target = this.Creep.pos.findClosestByPath<Resource>(FIND_DROPPED_ENERGY, {
                filter: (r: Resource) => {
                    return (
                        r.resourceType === RESOURCE_ENERGY &&
                        r.amount >= 70);
                }
            });
            this.Creep.setTarget(target)
        }
        return target;
    }

    protected doPickupEnergy(successState: CreepState): boolean {
        let resource = this.getDroppedResource();

        if (resource instanceof Resource) {
            let creep = this.Creep;
            let resp = creep.pickup(resource);
            //console.log(creep.name + " | pickup: " + ErrorHelper.getErrorString(resp));
            switch (resp) {
                case OK:
                //creep.clearTarget();
                //break;

                case ERR_FULL:
                    this.setState(successState);
                    break;

                case ERR_NOT_IN_RANGE:
                    let moveResp = creep.moveTo(resource);
                    switch (moveResp) {
                        case OK:
                            break;

                        case ERR_NO_PATH:
                            creep.clearTarget();
                            break;

                        default:
                            console.log(creep.name + " | moveTo: " + ErrorHelper.getErrorString(moveResp));
                            break;
                    }

                    break;

                case ERR_INVALID_TARGET:
                    creep.clearTarget();
                    break;

                default:
                    console.log(creep.name + " | pickup: " + ErrorHelper.getErrorString(resp));
                    break;
            }
            return true; // Return 'true' to indicate that the calling logic should stop.
        }
        return false; // Return 'false' to indicate that the calling logic should continue.
    }

    protected doWithdrawEnergy(successState: CreepState): boolean {
        let storage = this.getStorage();

        if (storage instanceof StructureStorage || storage instanceof StructureContainer) {
            let creep = this.Creep;
            let resp = creep.withdraw(storage, RESOURCE_ENERGY);
            switch (resp) {
                case OK:
                case ERR_FULL:
                    this.setState(successState);
                    break;

                case ERR_NOT_IN_RANGE:
                    creep.moveTo(storage);
                    break;

                case ERR_NOT_ENOUGH_RESOURCES:
                    creep.clearTarget();
                    break;

                default:
                    console.log(creep.name + " | withdraw: " + ErrorHelper.getErrorString(resp));
                    break;
            }
            return true;
        }
        return false;
    }

    //protected doCollectEnergy(successState: CreepState): void {
    //    let target = this.Creep.getTarget();

    //    if (!target) {
    //        target = this.getDroppedResource();
    //        if (!target) {
    //            target = this.getStorage();
    //        }
    //    }

    //    if (target instanceof Resource) {
    //        if (this.doPickupEnergy(successState)) {
    //            return;
    //        }
    //    } else if (target instanceof StructureStorage || target instanceof StructureContainer) {
    //        if (this.doWithdrawEnergy(successState)) {
    //            return;
    //        }
    //    }
    //}

    protected doHarvest(): boolean {
        let creep = this.Creep;
        if (creep.carry.energy < creep.carryCapacity) {
            let target = creep.getTarget<Source | Mineral>(Source, Mineral);
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
                            case OK:
                                break;

                            case ERR_NO_PATH:
                                //console.log(creep.name + " | doHarvest | moveTo: " + ErrorHelper.getErrorString(moveResp));
                                target = creep.setTarget(this.getSource());
                                break;

                            case ERR_TIRED:
                                break;

                            default:
                                console.log(creep.name + " | doHarvest | moveTo: " + ErrorHelper.getErrorString(moveResp));
                                break;
                        }
                        break;

                    case ERR_NOT_ENOUGH_ENERGY:
                        return false;

                    default:
                        console.log(creep.name + " | doHarvest | harvest: " + ErrorHelper.getErrorString(resp));
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

    public load(): boolean {
        //this.Creep = Game.creeps[this.creepName];
        if (!this.Creep) {
            this.dispose();
            return false;
        } else if (this.Creep.spawning) {
            return false;
        } else if (this.Creep.ticksToLive === 1) {
            this.willDie();
        }
        return true;
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