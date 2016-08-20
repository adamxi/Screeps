export class Config {
    public static ROLE_TO_STRING = ["H", "B", "U", "C"];
    public static structurePriority: { [id: string]: any; } = {};

    public static CONTAINERS_PER_SOURCE = 2;
    public static TIMER_CONSTRUCTORMANAGER_UPDATE = 10;
    public static TIMER_TOWER_TARGET_REFRESH = 10;
    public static TIMER_CREEP_IDLE = 5;

    public static MOVE_TO_OPTS: MoveToOpts & FindPathOpts = {
        reusePath: 50,
        //noPathFinding: true,
    }

    public static PATHFINDING = {
        CREEP_MAX_BLOCKED_TICKS: 2,
        PATH_MAX_BLOCKED_TICKS: 10,
    }

    public static WALKABLE_STRUCTURES: { [id: string]: boolean } = {};

    public static PATHFINDING_DEFAULT_OPTS: FindPathOpts = {
        ignoreCreeps: false,
        maxOps: 500,
        heuristicWeight: 1.2
    }

    public static initialize() {
        Config.initMemory();
        Config.initStructurePriorities();

        Config.WALKABLE_STRUCTURES[STRUCTURE_ROAD] = true;
        Config.WALKABLE_STRUCTURES[STRUCTURE_CONTAINER] = true;
    }

    private static initMemory() {
        if (Memory["paths"] == undefined) {
            Memory["paths"] = {};
        }
        if (Memory["debug"] == undefined) {
            Memory["debug"] = {};
            Memory["debug"]["pathsComputed"] = 0;
        }
    }

    private static initStructurePriorities() {
        Config.structurePriority = {};
        Config.structurePriority[STRUCTURE_EXTENSION] = { threshold: 100, critical: 300 };
        Config.structurePriority[STRUCTURE_ROAD] = { threshold: 500, critical: 500 };
        Config.structurePriority[STRUCTURE_STORAGE] = { threshold: 1000, critical: 1000 };
        Config.structurePriority[STRUCTURE_CONTAINER] = { threshold: 20000, critical: 30000 };
        Config.structurePriority[STRUCTURE_TOWER] = { threshold: 300, critical: 800 };
        Config.structurePriority[STRUCTURE_LINK] = { threshold: 100, critical: 300 };
        Config.structurePriority[STRUCTURE_SPAWN] = { threshold: 500, critical: 1000 };

        Config.structurePriority[STRUCTURE_LAB] = { threshold: 10, critical: 200 };
        Config.structurePriority[STRUCTURE_NUKER] = { threshold: 100, critical: 200 };
        Config.structurePriority[STRUCTURE_OBSERVER] = { threshold: 10, critical: 200 };
        Config.structurePriority[STRUCTURE_POWER_SPAWN] = { threshold: 500, critical: 500 };
        Config.structurePriority[STRUCTURE_TERMINAL] = { threshold: 500, critical: 500 };

        Config.structurePriority[STRUCTURE_RAMPART] = { threshold: 50000, critical: 40000 };
        Config.structurePriority[STRUCTURE_WALL] = { threshold: 0, critical: 40000 };
    }
}