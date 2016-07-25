import {Config} from "./../Config/Config";
import {RoomManager} from "./../Managers/RoomManager";
import {ConstructionManager} from "./../Managers/ConstructionManager";
import {GameObject} from "./../GameObjects/GameObject";
import {CreepFactory} from "./../Util/CreepFactory";

export class GameManager {
    public static roomManagers: { [id: string]: RoomManager; } = {}; 

    public static init(): void {
        console.log("Scripts reloaded");

        Config.initialize();

        //for (var i in Memory.creeps) {
        //    if (!Game.creeps[i]) {
        //        delete Memory.creeps[i];
        //    }
        //}
        for (let i in Game.creeps) {
            let obj = CreepFactory.load(Game.creeps[i]);
            if (obj) {
                GameObject.add(obj);
            }
        }

        for (let i in Game.rooms) {
            var roomManager = new RoomManager(Game.rooms[i]);
            GameManager.roomManagers[roomManager.roomName] = roomManager;
        }
    }

    public static update(): void {
        GameObject.update();

        for (let i in GameManager.roomManagers) {
            GameManager.roomManagers[i].update();
        }
    }
}