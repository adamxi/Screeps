import {CreepObject} from "./CreepObject";
import {RoomManager} from "./../Managers/RoomManager";
import {ConstructionManager} from "./../Managers/ConstructionManager";

export class CreepBuilder extends CreepObject {
    constructor(creep: Creep) {
        super(creep, CreepRole.Builder, CreepState.Building);
    }

    public update(): void {
        var creep = this.creep;

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
                        switch (creep.withdraw(storage, RESOURCE_ENERGY)) {
                            case OK:
                                this.setState(CreepState.Building);
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

                this.setState(CreepState.Building);
                break;

            case CreepState.Building:
                if (creep.carry.energy > 0) {
                    let target = this.getOrSetTarget<Structure | ConstructionSite>((o: CreepObject) => {
                        let resp = RoomManager.roomManagers[o.creep.room.name].constructionManager.getNext();
                        return {
                            target: resp != null ? resp.structure : null,
                            params: { targetHits: resp != null ? resp.targetHits : null }
                        };
                    });

                    if (target) {
                        if (target instanceof Structure) {
                            let targetHits = creep.getTargetInfo().targetHits;
                            if (target.hits < targetHits) {
                                if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                                    creep.moveTo(target);
                                }
                                break;
                            }

                        } else if (target instanceof ConstructionSite) {
                            if (target.progress < target.progressTotal) {
                                if (creep.build(target) === ERR_NOT_IN_RANGE) {
                                    creep.moveTo(target)
                                }
                                break;
                            }
                        }
                        
                        creep.clearTarget();
                        RoomManager.roomManagers[creep.room.name].constructionManager.completed(target.id, creep);
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