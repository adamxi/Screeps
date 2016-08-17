import "./../Extensions/CreepEx";
import "./../Extensions/RoomObjectEx";
import "./../Extensions/RoomPositionEx";
import {Profiler} from "./../Components/screeps-profiler";
import {GameManager} from "./../Managers/GameManager";
import {PathHelper} from "./../Util/PathHelper";

declare const module: any;

Profiler.enable();
if (Profiler.enabled) {
    Object.getOwnPropertyNames(module.exports).forEach(className => {
        if (className != Profiler.name) {
            let func = module.exports[className]
            if (typeof func === "function") {
                Profiler.registerClass(func);
            }
        }
    });
}

GameManager.init();

module.exports.loop = function () {
    Profiler.wrap(function () {
        //console.log("tick");
        GameManager.update();
    });
}