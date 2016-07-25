import "./../Extensions/CreepEx";
import "./../Extensions/RoomObjectEx";
import {GameManager} from "./../Managers/GameManager";

Game.flagObject = function (id: string): void {
    var obj = Game.getObjectById<any>(id);

    if (obj) {
        var flag = Game.flags["debug"];
        if (flag) {
            flag.setPosition(obj.pos);
        } else {
            obj.room.createFlag(obj.pos, "debug", COLOR_PURPLE, COLOR_PURPLE);
        }
    }
}

GameManager.init();

declare const module: any;
module.exports.loop = function () {
    GameManager.update();
}
 