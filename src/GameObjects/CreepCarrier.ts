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
                    if (this.doPickupEnergy(CreepState.Working)) {
                        break;
                    }

                    this.doWithdrawEnergy(CreepState.Working);
                } else {
                    this.setState(CreepState.Working);
                    //this.update();
                }
                break;

            case CreepState.Working:
                if (creep.carry.energy > 0) {
                    let target = creep.getTarget<Extension | Spawn | Tower>(StructureExtension, Spawn, StructureTower);
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