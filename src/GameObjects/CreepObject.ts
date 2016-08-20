import {GameObject} from "./GameObject";
import {ResourceManager} from "./../Managers/ResourceManager";
import {RoomManager} from "./../Managers/RoomManager";
import {ErrorHelper} from "./../Util/ErrorHelper";
import {Config} from "./../Config/Config";
import {PathHelper} from "./../Util/PathHelper";

export abstract class CreepObject extends GameObject {
    protected creepName: string;
    private creep: Creep;

    constructor(creep: Creep, role: CreepRole, initialState: CreepState) {
        super();
        this.creepName = creep.name;

        this.memory = creep.memory;
        creep.remember("state", initialState, false);
        creep.setRole(role);
    }

    public get Creep(): Creep {
        return this.creep;
    }

    private getSource(currentSource?: Source): Source {
        return ResourceManager.managers[this.Creep.room.name].getBestSource2(this.Creep, currentSource);
    }

    protected getStorage(): Storage | Container {
        console.log(this.Creep.name + " | finding storage");
        return this.Creep.pos.findClosestByRange<Storage | Container>(FIND_STRUCTURES, {
            filter: (c: Storage | Container) => {
                return (
                    c.structureType === STRUCTURE_CONTAINER ||
                    c.structureType === STRUCTURE_STORAGE) &&
                    c.store[RESOURCE_ENERGY] > 0;
            }
        });
    }

    protected getDroppedResource(): Resource {
        console.log(this.Creep.name + " | finding droped resource");
        return this.Creep.pos.findClosestByPath<Resource>(FIND_DROPPED_ENERGY, {
            filter: (r: Resource) => {
                return (
                    r.resourceType === RESOURCE_ENERGY &&
                    r.amount >= 70);
            }
        });
    }

    protected doPickupEnergy(resource: Resource, successState: CreepState): void {
        let creep = this.Creep;
        let resp = creep.pickup(resource);
        //console.log(creep.name + " | pickup: " + ErrorHelper.getErrorString(resp));
        switch (resp) {
            case OK:
                //creep.clearTarget();
                break;

            case ERR_FULL:
                this.setState(successState);
                break;

            case ERR_NOT_IN_RANGE:
                let moveResp = creep.moveToTarget();
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
    }

    protected doWithdrawEnergy(storage: StructureStorage | StructureContainer, successState: CreepState): void {
        let creep = this.Creep;
        let resp = creep.withdraw(storage, RESOURCE_ENERGY);
        switch (resp) {
            case OK:
            case ERR_FULL:
                this.setState(successState);
                break;

            case ERR_NOT_IN_RANGE:
                creep.moveToTarget();
                break;

            case ERR_NOT_ENOUGH_RESOURCES:
                creep.clearTarget();
                break;

            default:
                console.log(creep.name + " | withdraw: " + ErrorHelper.getErrorString(resp));
                break;
        }
    }

    protected doCollectEnergy(stateOnCollect: CreepState, stateNoTarget: CreepState, stateDefault: CreepState): void {
        let creep = this.Creep;
        if (!creep.getActiveBodyparts(CARRY)) { // Check required body parts to perform in this state
            this.setState(CreepState.Idle);
            return;
        }

        if (creep.carry.energy < creep.carryCapacity) {
            let target = creep.getTarget();

            if (!target) {
                target = creep.setTarget(this.getDroppedResource());
            }
            if (!target) {
                target = creep.setTarget(this.getStorage());
            }

            if (target instanceof Resource) {
                this.doPickupEnergy(target, stateOnCollect);

            } else if (target instanceof StructureStorage || target instanceof StructureContainer) {
                this.doWithdrawEnergy(target, stateOnCollect);

            } else {
                if (stateNoTarget) {
                    this.setState(stateNoTarget);
                } else {
                    console.log(creep.name + " | Setting Idle");
                    this.setState(CreepState.Idle);
                }
            }

        } else {
            this.setState(stateDefault);
        }
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
                        let moveResp = creep.moveToTarget();
                        switch (moveResp) {
                            case OK:
                                break;

                            case ERR_NO_PATH:
                                target = creep.setTarget(this.getSource(target as Source));
                                break;

                            case ERR_INVALID_TARGET:
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

    protected doIdle(moveToIdle = true): boolean {
        var creep = this.Creep;
        if (moveToIdle) {
            var flag = Game.flags[creep.room.name + "_idle"];

            if (flag) {
                creep.moveToTarget(flag, false, 3);
            }
        }

        if (creep.memory["idleTimer"] == undefined) {
            creep.memory["idleTimer"] = 0;
        }
        if (++creep.memory["idleTimer"] >= Config.TIMER_CREEP_IDLE) {
            delete creep.memory["idleTimer"];
            return false;
        }

        return true;
    }

    protected setState(state: CreepState, clearTarget = true): void {
        this.Creep.setState(state, clearTarget);
    }

    public load(): boolean {
        this.creep = Game.creeps[this.creepName];
        if (!this.creep) {
            this.dispose();
            return false;
        } else if (this.creep.spawning) {
            return false;
        } else if (this.creep.ticksToLive === 1) {
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