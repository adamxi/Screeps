import {CreepObject} from "./CreepObject";
import {GameManager} from "./../Managers/GameManager";
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
                    let target = this.getOrSetTarget<Storage | Container>(() => {
                        let target = creep.pos.findClosestByRange<Storage | Container>(FIND_STRUCTURES, {
                            filter: (c: Storage | Container) => {
                                return (
                                    c.structureType === STRUCTURE_CONTAINER ||
                                    c.structureType === STRUCTURE_STORAGE) &&
                                    c.store[RESOURCE_ENERGY] > 0;
                            }
                        });

                        return { target: target }
                    });

                    if (target) {
                        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(target);
                            break;
                        }
                    }

                    this.setState(CreepState.Harvesting);
                    break;
                }

                this.setState(CreepState.Building);
                break;

            case CreepState.Building:
                if (creep.carry.energy > 0) {
                    let target = this.getOrSetTarget<Structure | ConstructionSite>(() => {
                        let resp = GameManager.roomManagers[creep.room.name].constructionManager.getNext();
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
                        GameManager.roomManagers[creep.room.name].constructionManager.completed(target.id);
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