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
                    let storage = this.getStorage(true);

                    if (storage) {
                        switch (creep.withdraw(storage, RESOURCE_ENERGY)) {
                            case OK:
                                this.setState(CreepState.Working);
                                break;

                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(storage);
                                break;
                        }
                    }
                }

                this.setState(CreepState.Working);
                break;

            case CreepState.Working:
                if (creep.carry.energy > 0) {
                    let target = this.getOrSetTarget<Structure>((o: CreepObject) => {
                        let structure = o.creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
                            filter: (structure: Extension | Spawn | Tower) => {
                                return (
                                    structure.structureType === STRUCTURE_EXTENSION ||
                                    structure.structureType === STRUCTURE_SPAWN ||
                                    structure.structureType === STRUCTURE_TOWER) &&
                                    structure.energy < structure.energyCapacity;
                            }
                        });

                        return { target: structure }
                    });

                    if (target) {
                        switch (creep.transfer(target, RESOURCE_ENERGY)) {
                            case OK:
                            case ERR_FULL:
                                creep.clearTarget();
                                break;

                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(target);
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