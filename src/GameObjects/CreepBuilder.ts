import {CreepObject} from "./CreepObject";
import {RoomManager} from "./../Managers/RoomManager";
import {ConstructionManager} from "./../Managers/ConstructionManager";
import {ErrorHelper} from "./../Util/ErrorHelper";

export class CreepBuilder extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Builder, CreepState.Building);
    }

    public update(): void {
        var creep = this.Creep;

        switch (creep.getState()) {
            case CreepState.Harvesting:
                if (!this.doHarvest()) {
                    this.setState(CreepState.Building);
                }
                break;

            case CreepState.Collecting:
                if (creep.carry.energy < creep.carryCapacity) {
                    let storage = this.getStorage();

                    if (storage) {
                        let resp = creep.withdraw(storage, RESOURCE_ENERGY);
                        switch (resp) {
                            case OK:
                                this.setState(CreepState.Building);
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
                    } else {
                        this.setState(CreepState.Harvesting);
                        break;
                    }
                } else {
                    this.setState(CreepState.Building);
                }
                break;

            case CreepState.Building:
                if (creep.carry.energy > 0) {
                    let target = creep.getTarget<Structure | ConstructionSite>();
                    if (!target) {
                        let resp = RoomManager.roomManagers[creep.room.name].constructionManager.getNext();
                        if (resp) {
                            target = creep.setTarget(resp.structure, { targetHits: resp.targetHits });
                        }
                    }

                    if (target) {
                        if (target instanceof Structure) {
                            let targetHits = creep.getTargetInfo().targetHits;
                            if (target.hits < targetHits) {
                                let resp = creep.repair(target);

                                switch (resp) {
                                    case OK:
                                        break;

                                    case ERR_NOT_IN_RANGE:
                                        creep.moveTo(target);
                                        break;

                                    default:
                                        console.log(creep.name + " | repair: " + ErrorHelper.getErrorString(resp));
                                        break;
                                }
                            } else {
                                creep.clearTarget();
                                RoomManager.roomManagers[creep.room.name].constructionManager.completed(target.id, creep);
                            }

                        } else if (target instanceof ConstructionSite) {
                            if (target.progress < target.progressTotal) {
                                let resp = creep.build(target);

                                switch (resp) {
                                    case OK:
                                        break;

                                    case ERR_NOT_IN_RANGE:
                                        creep.moveTo(target);
                                        break;

                                    default:
                                        console.log(creep.name + " | build: " + ErrorHelper.getErrorString(resp));
                                        break;
                                }
                            } else {
                                creep.clearTarget();
                                RoomManager.roomManagers[creep.room.name].constructionManager.completed(target.id, creep);
                            }
                        }
                        break;
                    }

                    if (creep.carry.energy < creep.carryCapacity) {
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