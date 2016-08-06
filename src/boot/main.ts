import "./../Extensions/CreepEx";
import "./../Extensions/RoomObjectEx";
import {Profiler} from "./../Components/screeps-profiler";
import {GameManager} from "./../Managers/GameManager";

//Profiler.enable();
GameManager.init();

declare const module: any;
module.exports.loop = function () {
    Profiler.wrap(function () {
        //console.log("tick");
        GameManager.update();
    });
}
 