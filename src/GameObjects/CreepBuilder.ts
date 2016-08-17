import {CreepObject} from "./CreepObject";
import {RoomManager} from "./../Managers/RoomManager";
import {ConstructionManager} from "./../Managers/ConstructionManager";
import {ErrorHelper} from "./../Util/ErrorHelper";
import {Config} from "./../Config/Config";

export class CreepBuilder extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Builder, CreepState.Building);
    }

    public update(): void {
        var creep = this.Creep;

        switch (creep.getState()) {
            case CreepState.Idle:
                if (!this.doIdle()) {
                    if (creep.carry.energy > 0) {
                        this.setState(CreepState.Building);
                    } else {
                        this.setState(CreepState.Collecting);
                    }
                }
                break;

            case CreepState.Harvesting:
                if (!this.doHarvest()) {
                    this.setState(CreepState.Building);
                }
                break;

            case CreepState.Collecting:
                this.doCollectEnergy(CreepState.Building, CreepState.Harvesting, CreepState.Building);
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

                    if (target instanceof Structure) {
                        let targetHits = creep.getTargetInfo().params.targetHits;
                        if (target.hits < targetHits) {
                            let resp = creep.repair(target);

                            switch (resp) {
                                case OK:
                                    break;

                                case ERR_NOT_IN_RANGE:
                                    creep.moveToTarget();
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
                                    creep.moveToTarget();
                                    break;

                                default:
                                    console.log(creep.name + " | build: " + ErrorHelper.getErrorString(resp));
                                    break;
                            }
                        } else {
                            creep.clearTarget();
                            RoomManager.roomManagers[creep.room.name].constructionManager.completed(target.id, creep);
                        }

                    } else if (creep.carry.energy < creep.carryCapacity) {
                        this.setState(CreepState.Collecting);

                    } else {
                        this.setState(CreepState.Idle);
                    }

                } else {
                    this.setState(CreepState.Collecting);
                }
                break;
        }
    }
}