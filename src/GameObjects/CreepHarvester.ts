import {CreepObject} from "./CreepObject";
import {RoomManager} from "./../Managers/RoomManager";
import {ErrorHelper} from "./../Util/ErrorHelper"
import {Config} from "./../Config/Config";

export class CreepHarvester extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Harvester, CreepState.Working);
    }

    public update(): void {
        var creep = this.Creep;

        switch (creep.getState()) {
            case CreepState.Idle:
                if (!this.doIdle()) {
                    if (creep.carry.energy > 0) {
                        this.setState(CreepState.Working);
                    } else {
                        this.setState(CreepState.Harvesting);
                    }
                }
                break;

            case CreepState.Harvesting:
                if (!this.doHarvest()) {
                    this.setState(CreepState.Working);
                }
                break;

            case CreepState.Working:
                if (creep.carry.energy > 0) {
                    let target = creep.getTarget<Structure>();
                    if (!target && RoomManager.roomManagers[creep.room.name].hasRole(CreepRole.Carrier)) {
                        target = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
                            filter: (s: Storage | Container) => {
                                return (
                                    s.structureType === STRUCTURE_CONTAINER ||
                                    s.structureType === STRUCTURE_STORAGE) &&
                                    _.sum(s.store) < s.storeCapacity;
                            }
                        });
                        creep.setTarget(target);
                    }

                    if (!target) {
                        target = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
                            filter: (s: Extension | Spawn | Tower) => {
                                return (
                                    s.structureType === STRUCTURE_EXTENSION ||
                                    s.structureType === STRUCTURE_SPAWN ||
                                    s.structureType === STRUCTURE_TOWER) &&
                                    s.energy < s.energyCapacity;
                            }
                        });
                        creep.setTarget(target);
                    }

                    if (target) {
                        let resp = creep.transfer(target, RESOURCE_ENERGY);
                        switch (resp) {
                            case OK:
                            case ERR_FULL:
                                creep.clearTarget();
                                break;

                            case ERR_NOT_IN_RANGE:
                                creep.moveToTarget();
                                break;

                            default:
                                console.log(creep.name + " | transfer: " + ErrorHelper.getErrorString(resp));
                                break;
                        }

                    } else if (creep.carry.energy < creep.carryCapacity) {
                        this.setState(CreepState.Harvesting);
                        this.update();

                    } else {
                        this.setState(CreepState.Idle);
                    }

                } else {
                    this.setState(CreepState.Harvesting);
                    this.update();
                }
                break;
        }
    }
}