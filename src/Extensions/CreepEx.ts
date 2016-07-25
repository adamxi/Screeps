import {CreepObject} from "./../GameObjects/CreepObject";
import {Logger} from "./../Util/Logger";
import {ErrorHelper} from "./../Util/ErrorHelper";

export module CreepEx {
    var KEY_STATE = "state";
    var KEY_ROLE = "role";
    var KEY_TARGET = "targetInfo";

    Creep.prototype.setState = function (state: CreepState, clearTarget = true): void {
        if (clearTarget) {
            this.clearTarget();
        }
        this.memory[KEY_STATE] = state;
    }

    Creep.prototype.getState = function (): CreepState {
        return this.memory[KEY_STATE] as CreepState;
    }

    Creep.prototype.setRole = function (role: CreepRole): void {
        this.memory[KEY_ROLE] = role;
    }

    Creep.prototype.getRole = function (): CreepRole {
        return this.memory[KEY_ROLE] as CreepRole;
    }

    Creep.prototype.getTarget = function <T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(): T {
        // Note: Flags do not have an id
        var targetInfo = this.memory[KEY_TARGET];

        if (targetInfo) {
            return Game.getObjectById<T>(targetInfo.id);
        }

        return null;
    }

    Creep.prototype.getTargetInfo = function (): any {
        // Note: Flags do not have an id
        var targetInfo = this.memory[KEY_TARGET];

        if (targetInfo) {
            return targetInfo.params;
        }

        return null;
    }

    Creep.prototype.setTarget = function (object: Source | Resource | Mineral | Creep | Structure | ConstructionSite, params?: {}): void {
        // Note: Flags do not have an id
        if (object) {
            this.memory[KEY_TARGET] = {
                id: object.id,
                params: params,
            }
        }
    }

    Creep.prototype.clearTarget = function (): void {
        this.clearMemory(KEY_TARGET);
    }

    Creep.prototype.setMemory = function (key: string, value: any, override = false): void {
        if (override || !this.memory[key]) {
            this.memory[key] = value;
        }
    }

    Creep.prototype.clearMemory = function (key: string): void {
        delete this.memory[key];
    }

    Creep.prototype.showTarget = function (): void {
        this.say("!");
        var target = (this as Creep).getTarget();

        if (target) {
            var flag = Game.flags["debug"];
            if (flag) {
                flag.setPosition(target.pos);
            } else {
                target.room.createFlag(target.pos, "debug", COLOR_PURPLE, COLOR_PURPLE);
            }
        }
        
        console.log(this.name + " | State: " + CreepState[this.getState()]);
    }
}