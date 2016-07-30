import {CreepObject} from "./CreepObject";
import {ErrorHelper} from "./../Util/ErrorHelper";

export class CreepCarrier extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Carrier, CreepState.Working);
    }

    public update(): void {
        var creep = this.Creep;

        switch (creep.getState()) {
            case CreepState.Collecting:
                if (creep.carry.energy < creep.carryCapacity) {
                    let storage = this.getStorage();

                    if (storage) {
                        // NOTE: creep.carry.energy is not updated before next tick
                        let resp = creep.withdraw(storage, RESOURCE_ENERGY);
                        switch (resp) {
                            case OK:
                                this.setState(CreepState.Working);
                                break;

                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(storage);
                                break;

                            case ERR_NOT_ENOUGH_ENERGY:
                                creep.clearTarget();
                                break;

                            default:
                                console.log(creep.name + " | withdraw: " + ErrorHelper.getErrorString(resp));
                                break;
                        }
                    }
                } else {
                    this.setState(CreepState.Working);
                    this.update();
                }
                break;

            case CreepState.Working:
                if (creep.carry.energy > 0) {
                    let target = creep.getTarget<Extension | Spawn | Tower>();
                    if (!target) {
                        target = creep.pos.findClosestByRange<Extension | Spawn | Tower>(FIND_STRUCTURES, {
                            filter: (structure: Extension | Spawn | Tower) => {
                                return (
                                    structure.structureType === STRUCTURE_EXTENSION ||
                                    structure.structureType === STRUCTURE_SPAWN ||
                                    structure.structureType === STRUCTURE_TOWER) &&
                                    structure.energy < structure.energyCapacity;
                            }
                        })
                        creep.setTarget(target);
                    }

                    if (target) {
                        if (target.energy === target.energyCapacity) {
                            creep.clearTarget();
                            break;
                        }
                        let resp = creep.transfer(target, RESOURCE_ENERGY);
                        switch (resp) {
                            case OK:
                            case ERR_FULL:
                                creep.clearTarget();
                                break;

                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(target);
                                break;

                            default:
                                console.log(creep.name + " | transfer: " + ErrorHelper.getErrorString(resp));
                                break;
                        }
                    } else if (creep.carry.energy < creep.carryCapacity) {
                        this.setState(CreepState.Collecting);
                    } else {
                        this.moveToIdlePos();
                    }

                } else {
                    this.setState(CreepState.Collecting);
                }
                break;
        }
    }
}