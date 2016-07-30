import "./../Extensions/CreepEx";
import "./../Extensions/RoomObjectEx";
import {GameManager} from "./../Managers/GameManager";

GameManager.init();

declare const module: any;
module.exports.loop = function () {
    //console.log("tick");
    GameManager.update();
}
 