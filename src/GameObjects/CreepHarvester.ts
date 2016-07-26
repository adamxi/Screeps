import {CreepObject} from "./CreepObject";
import {RoomManager} from "./../Managers/RoomManager";

export class CreepHarvester extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Harvester, CreepState.Working);
    }

    public update(): void {
        var creep = this.creep;

        switch (creep.getState()) {
            case CreepState.Harvesting:
                if (!this.doHarvest()) {
                    this.setState(CreepState.Working);
                }
                break;

            case CreepState.Working:
                if (creep.carry.energy > 0) {
                    let target = this.getOrSetTarget<Structure>((o: CreepObject) => {
                        let storage: Structure;
                        
                        if (RoomManager.roomManagers[o.creep.room.name].hasRole(CreepRole.Carrier)) {
                            storage = o.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
                                filter: (s: Storage | Container) => {
                                    return (
                                        s.structureType === STRUCTURE_CONTAINER ||
                                        s.structureType === STRUCTURE_STORAGE) &&
                                        _.sum(s.store) < s.storeCapacity;
                                }
                            });
                        }

                        if (!storage) {
                            storage = o.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
                                filter: (structure: Extension | Spawn | Tower) => {
                                    return (
                                        structure.structureType === STRUCTURE_EXTENSION ||
                                        structure.structureType === STRUCTURE_SPAWN ||
                                        structure.structureType === STRUCTURE_TOWER) &&
                                        structure.energy < structure.energyCapacity;
                                }
                            });
                        }

                        return { target: storage };
                    });

                    if (target) {
                        switch (creep.transfer(target, RESOURCE_ENERGY)) {
                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(target);
                                break;

                            case OK:
                            case ERR_FULL:
                                creep.clearTarget();
                                break;
                        }
                    } else if (creep.carry.energy < creep.carryCapacity) {
                        this.setState(CreepState.Harvesting);
                    } else {
                        this.moveToIdlePos();
                    }

                } else {
                    this.setState(CreepState.Harvesting);
                }
                break;
        }
    }
}