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
                    let storage = this.getStorage();

                    if (storage) {
                        switch (creep.withdraw(storage, RESOURCE_ENERGY)) {
                            case OK:
                                this.setState(CreepState.Upgrading);
                                break;

                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(storage);
                                break;
                        }
                    } else {
                        this.setState(CreepState.Harvesting);
                        this.update();
                        break;
                    }
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