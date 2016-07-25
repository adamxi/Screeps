import {CreepObject} from "./CreepObject";

export class CreepUpgrader extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Upgrader, CreepState.Upgrading);
    }

    public update(): void {
        var creep = this.creep;

        switch (creep.getState()) {
            case CreepState.Harvesting:
                if (!this.doHarvest()) {
                    this.setState(CreepState.Upgrading);
                }
                break;

            case CreepState.Collecting:
                if (creep.carry.energy < creep.carryCapacity) {
                    let target = creep.getTarget<Storage | Container>();
                    if (!target) {
                        var containers = creep.room.find<Storage | Container>(FIND_STRUCTURES, {
                            filter: (c: Storage | Container) => {
                                return (
                                    c.structureType === STRUCTURE_CONTAINER ||
                                    c.structureType === STRUCTURE_STORAGE) &&
                                    c.store[RESOURCE_ENERGY] > 0;
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

                    this.setState(CreepState.Harvesting);
                    break;
                }

                this.setState(CreepState.Upgrading);
                break;

            case CreepState.Upgrading:
                if (creep.carry.energy > 0) {
                    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                } else {
                    this.setState(CreepState.Collecting);
                }
                break;
        }
    }
}