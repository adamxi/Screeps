export namespace Config {
    export const RoleToString = ["H", "B", "U", "C"];

    export let structurePriority: { [id: string]: any; } = {};

    export const initialize = function () {
        structurePriority = {};
        structurePriority[STRUCTURE_EXTENSION] = { threshold: 100, critical: 300 };
        structurePriority[STRUCTURE_ROAD] = { threshold: 500, critical: 500 };
        structurePriority[STRUCTURE_STORAGE] = { threshold: 1000, critical: 1000 };
        structurePriority[STRUCTURE_CONTAINER] = { threshold: 20000, critical: 30000 };
        structurePriority[STRUCTURE_TOWER] = { threshold: 300, critical: 800 };
        structurePriority[STRUCTURE_LINK] = { threshold: 100, critical: 300 };
        structurePriority[STRUCTURE_SPAWN] = { threshold: 500, critical: 1000 };


        structurePriority[STRUCTURE_LAB] = { threshold: 10, critical: 200 };
        structurePriority[STRUCTURE_NUKER] = { threshold: 100, critical: 200 };
        structurePriority[STRUCTURE_OBSERVER] = { threshold: 10, critical: 200 };
        structurePriority[STRUCTURE_POWER_SPAWN] = { threshold: 500, critical: 500 };
        structurePriority[STRUCTURE_TERMINAL] = { threshold: 500, critical: 500 };

        structurePriority[STRUCTURE_RAMPART] = { threshold: 50000, critical: 40000 };
        structurePriority[STRUCTURE_WALL] = { threshold: 0, critical: 40000 };
    }
}