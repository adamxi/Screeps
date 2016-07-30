import {CreepObject} from "./CreepObject";
import {ErrorHelper} from "./../Util/ErrorHelper"

export class CreepUpgrader extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Upgrader, CreepState.Upgrading);
    }

    public update(): void {
        var creep = this.Creep;

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
                        let resp = creep.withdraw(storage, RESOURCE_ENERGY);
                        switch (resp) {
                            case OK:
                                this.setState(CreepState.Upgrading);
                                break;

                            //case ERR_BUSY:
                            //    break;

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
                    } else {
                        this.setState(CreepState.Harvesting);
                        break;
                    }
                } else {
                    this.setState(CreepState.Upgrading);
                }
                break;

            case CreepState.Upgrading:
                if (creep.carry.energy > 0) {
                    let resp = creep.upgradeController(creep.room.controller);

                    switch (resp) {
                        case OK:
                            break;

                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(creep.room.controller);
                            break;

                        default:
                            console.log(creep.name + " | upgradeController: " + ErrorHelper.getErrorString(resp));
                            break;
                    }
                } else {
                    this.setState(CreepState.Collecting);
                }
                break;
        }
    }
}