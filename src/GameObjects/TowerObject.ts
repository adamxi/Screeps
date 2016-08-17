import {StructureObject} from "./StructureObject";
import {RoomManager} from "./../Managers/RoomManager";
import {ConstructionManager} from "./../Managers/ConstructionManager";
import {ErrorHelper} from "./../Util/ErrorHelper";
import {TargetHelper} from "./../Util/TargetHelper";
import {Timer} from "./../Components/Timer";
import {Config} from "./../Config/Config";

export class TowerObject extends StructureObject {
    private refreshTimer: Timer;

    constructor(tower: StructureTower) {
        super(tower);

        this.initMemory(Memory["towers"], this.id);
        this.refreshTimer = new Timer("targetRefresh", Config.TIMER_TOWER_TARGET_REFRESH, t => this.refreshTarget(t), this.memory);
    }

    public get Tower(): StructureTower {
        return this.structure as StructureTower;
    }

    private refreshTarget(timer: Timer): void {
        let target = TargetHelper.getTarget<Creep | Structure>(this.memory);
        if (target instanceof Structure) {
            console.log("clear target");
            TargetHelper.clearTarget(this.memory);
        }
    }

    public update(): void {
        this.refreshTimer.update();
        if (this.Tower.energy < TOWER_ENERGY_COST) {
            return;
        }

        let target = TargetHelper.getTarget<Creep | Structure>(this.memory);
        if (!target) {
            let hostiles = this.Structure.room.find<Creep>(FIND_HOSTILE_CREEPS);

            if (hostiles.length > 0) {
                target = TargetHelper.setTarget(this.memory, hostiles[0]);

            } else {
                let damagedCreeps = this.Structure.room.find<Creep>(FIND_MY_CREEPS, {
                    filter: (c: Creep) => c.hits < c.hitsMax
                });

                if (damagedCreeps.length > 0) {
                    target = TargetHelper.setTarget(this.memory, damagedCreeps[0]);

                } else {
                    let resp = RoomManager.roomManagers[this.roomName].constructionManager.getNextDamaged();
                    if (resp) {
                        target = TargetHelper.setTarget(this.memory, resp.structure as Structure, { targetHits: resp.targetHits });
                    }
                }
            }
        }

        if (target instanceof Creep) {
            if (!target.my) {
                this.doDefence(target);
            } else {
                this.doHeal(target);
            }
        } else if (target instanceof Structure) {
            this.doRepairs(target);
        }
    }

    private doDefence(target: Creep): void {
        if (target.hits > 0) {
            let resp = this.Tower.attack(target);
            switch (resp) {
                case OK:
                    break;

                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                case ERR_RCL_NOT_ENOUGH:
                    console.log("Tower | doDefence | attack: " + ErrorHelper.getErrorString(resp));
                    break;
            }
        } else {
            TargetHelper.clearTarget(this.memory);
        }
    }

    private doHeal(target: Creep): void {
        if (target.hits < target.hitsMax) {
            let resp = this.Tower.heal(target);
            switch (resp) {
                case OK:
                    break;

                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                case ERR_RCL_NOT_ENOUGH:
                    console.log("Tower | doHeal | heal: " + ErrorHelper.getErrorString(resp));
                    break;
            }
        } else {
            TargetHelper.clearTarget(this.memory);
        }
    }

    private doRepairs(target: Structure): void {
        let targetHits = TargetHelper.getTargetInfo(this.memory).params.targetHits;
        if (target.hits < targetHits) {
            let resp = this.Tower.repair(target);

            switch (resp) {
                case OK:
                    break;

                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                case ERR_RCL_NOT_ENOUGH:
                    console.log("Tower | doRepairs | repair: " + ErrorHelper.getErrorString(resp));
                    break;
            }
        } else {
            TargetHelper.clearTarget(this.memory);
        }
    }
}