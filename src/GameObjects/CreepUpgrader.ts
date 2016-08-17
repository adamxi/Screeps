import {CreepObject} from "./CreepObject";
import {ErrorHelper} from "./../Util/ErrorHelper"
import {Config} from "./../Config/Config"

export class CreepUpgrader extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Upgrader, CreepState.Upgrading);
    }

    public update(): void {
        var creep = this.Creep;

        switch (creep.getState()) {
            case CreepState.Idle:
                if (!this.doIdle()) {
                    if (creep.carry.energy > 0) {
                        this.setState(CreepState.Upgrading);
                    } else {
                        this.setState(CreepState.Collecting);
                    }
                }
                break;

            case CreepState.Harvesting:
                if (!this.doHarvest()) {
                    this.setState(CreepState.Upgrading);
                }
                break;

            case CreepState.Collecting:
                this.doCollectEnergy(CreepState.Upgrading, CreepState.Harvesting, CreepState.Upgrading);
                break;

            case CreepState.Upgrading:
                if (creep.carry.energy > 0) {
                    let resp = creep.upgradeController(creep.room.controller);

                    switch (resp) {
                        case OK:
                            break;

                        case ERR_NOT_IN_RANGE:
                            creep.moveToTarget(creep.room.controller);
                            break;

                        case ERR_NO_BODYPART:
                            // Work part damaged - call for help
                            break;

                        case ERR_NOT_OWNER:
                        case ERR_BUSY:
                        case ERR_NOT_ENOUGH_RESOURCES:
                        case ERR_INVALID_TARGET:
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