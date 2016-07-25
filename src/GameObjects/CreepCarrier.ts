import {CreepObject} from "./CreepObject";

export class CreepCarrier extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Carrier, CreepState.Working);
    }

    public update(): void {
        var creep = this.creep;

        switch (creep.getState()) {
            case CreepState.Collecting:
                if (creep.carry.energy < creep.carryCapacity) {
                    let target = creep.getTarget<Storage | Container>();
                    if (!target) {
                        var containers = creep.room.find<Storage | Container>(FIND_STRUCTURES, {
                            filter: (c: Storage | Container) => {
                                return (
                                    c.structureType === STRUCTURE_CONTAINER ||
                                    c.structureType === STRUCTURE_STORAGE) &&
                                    c.store[RESOURCE_ENERGY] >= 0;
                            }
                        });

                        if (containers.length > 0) {
                            target = containers[0];
                            creep.setTarget(target);
                        }
                    }

                    if (target) {
                        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(target);
                            break;
                        }
                    }
                }

                this.setState(CreepState.Working);
                break;

            case CreepState.Working:
                if (creep.carry.energy > 0) {
                    let targets = creep.room.find<Extension | Spawn | Tower>(FIND_STRUCTURES, {
                        filter: (structure: Extension | Spawn | Tower) => {
                            return (
                                structure.structureType === STRUCTURE_EXTENSION ||
                                structure.structureType === STRUCTURE_SPAWN ||
                                structure.structureType === STRUCTURE_TOWER) &&
                                structure.energy < structure.energyCapacity;
                        }
                    });

                    if (targets.length > 0) {
                        if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(targets[0]);
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