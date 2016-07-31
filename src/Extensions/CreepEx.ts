import {CreepObject} from "./../GameObjects/CreepObject";
import {Logger} from "./../Util/Logger";
import {ErrorHelper} from "./../Util/ErrorHelper";

export module CreepEx {
    var KEY_STATE = "state";
    var KEY_ROLE = "role";
    var KEY_TARGET = "targetInfo";
    var KEY_LOG = "showLog";

    Object.defineProperty(Creep.prototype, "foo", {
        get: function () {
            return "a";
        }
        //,
        //set: function (val) {
        //    this.loc = val;
        //}
    });

    Creep.prototype.setState = function (state: CreepState, clearTarget = true): void {
        (this as Creep).log("Setting State: " + CreepState[state].toString() + " | clearTarget: " + clearTarget);
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

    Creep.prototype.setTarget = function <T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(target: T, params?: {}): T {
        // Note: Flags do not have an id
        if (target) {
            (this as Creep).log("Set target: " + target.id);
            this.memory[KEY_TARGET] = {
                id: target.id,
                params: params,
            }
        }
        return target;
    }

    Creep.prototype.clearTarget = function (): void {
        if (this.memory[KEY_TARGET]) {
            (this as Creep).log("Clear target: " + this.memory[KEY_TARGET].id);
            this.clearMemory(KEY_TARGET);
        }
    }

    Creep.prototype.setMemory = function (key: string, value: any, override = true): void {
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

        console.log(this.name + " | State: " + CreepState[this.getState()] + " | Target: " + target);
    }

    Creep.prototype.inspect = function (): void {
        console.log(JSON.stringify(this, null, "\t"));
    }

    Creep.prototype.debug = function (): void {
        if (!this.memory[KEY_LOG]) {
            this.memory[KEY_LOG] = true;
        } else {
            delete this.memory[KEY_LOG];
        }
    }

    Creep.prototype.log = function (msg: string): void {
        if (this.memory[KEY_LOG]) {
            console.log((this as Creep).name + " | " + msg);
        }
    }
}