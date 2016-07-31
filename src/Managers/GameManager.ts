﻿import {Config} from "./../Config/Config";
import {RoomManager} from "./../Managers/RoomManager";
import {ConstructionManager} from "./../Managers/ConstructionManager";
import {GameObject} from "./../GameObjects/GameObject";
import {CreepFactory} from "./../Util/CreepFactory";

export class GameManager {
    private static ticksToRefresh = 60;
    private static timer = 0;

    public static init(): void {
        console.log("Scripts reloaded");

        Config.initialize();

        for (let i in Game.creeps) {
            let obj = CreepFactory.load(Game.creeps[i]);
            if (obj) {
                GameObject.add(obj);
            }
        }

        RoomManager.roomManagers = {};
        for (let i in Game.rooms) {
            var roomManager = new RoomManager(Game.rooms[i]);
            RoomManager.roomManagers[roomManager.roomName] = roomManager;
        }
    }

    public static update(): void {
        if (Game.time - GameManager.timer >= GameManager.ticksToRefresh) {
            GameManager.timer = Game.time;
            for (var i in Memory.creeps) {
                if (!Game.creeps[i]) {
                    delete Memory.creeps[i];
                }
            }
        }

        GameObject.update();

        for (let i in RoomManager.roomManagers) {
            if (RoomManager.roomManagers.hasOwnProperty(i)) {
                RoomManager.roomManagers[i].update();
            }
        }
    }
}