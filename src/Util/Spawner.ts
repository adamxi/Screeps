import {GameObject} from "./../GameObjects/GameObject";
import {CreepObject} from "./../GameObjects/CreepObject";
import {CreepFactory} from "./../Util/CreepFactory";
import {ErrorHelper} from "./../Util/ErrorHelper";
import {MathHelper} from "./../Util/MathHelper";
import {Config} from "./../Config/Config";

export class Spawner {
    // TOUGH: 10
    // MOVE: 50
    // CARRY: 50
    // ATTACK: 80
    // WORK: 100
    // RANGED_ATTACK: 150
    // HEAL: 250
    // CLAIM: 600

    public static spawnCreep(role: CreepRole, spawn: Spawn): CreepObject {
        if (spawn && !spawn.spawning && role != undefined) {
            var currentEnergy = spawn.room.energyAvailable;
            if (currentEnergy < spawn.room.energyCapacityAvailable * 0.5) {
                return null;
            }

            var partConfigs: Spawner.PartConfig[] = [];

            switch (role) {
                case CreepRole.Harvester:
                    partConfigs.push(new Spawner.PartConfig(WORK, 1));
                    partConfigs.push(new Spawner.PartConfig(MOVE, 1, 1, 1));
                    partConfigs.push(new Spawner.PartConfig(CARRY, 1, 1, 2));
                    break;

                case CreepRole.Builder:
                    partConfigs.push(new Spawner.PartConfig(WORK, 4));
                    partConfigs.push(new Spawner.PartConfig(MOVE, 8));
                    partConfigs.push(new Spawner.PartConfig(CARRY, 4));
                    break;

                case CreepRole.Upgrader:
                    partConfigs.push(new Spawner.PartConfig(WORK, 4));
                    partConfigs.push(new Spawner.PartConfig(MOVE, 8));
                    partConfigs.push(new Spawner.PartConfig(CARRY, 4));
                    break;

                case CreepRole.Carrier:
                    partConfigs.push(new Spawner.PartConfig(MOVE, 1));
                    partConfigs.push(new Spawner.PartConfig(CARRY, 1));
                    break;
            }

            let nextId = Spawner.getNextId(role);
            let name = Config.RoleToString[role] + "_" + nextId;
            let memory = { role: role, state: CreepState.Idle, roleId: nextId };
            let body = Spawner.getBestBody(currentEnergy, partConfigs);

            if (body) {
                let spawnResponse = spawn.createCreep(body, name, memory);
                if (typeof spawnResponse == "string") {
                    let obj = CreepFactory.load(Game.creeps[name]);
                    GameObject.add(obj);
                    return obj;
                } else {
                    console.log("Spawn exception: " + ErrorHelper.getErrorString(spawnResponse as number) + " name: " + name);
                }
            }
        }

        return null;
    }

    private static getNextId(role: CreepRole): number {
        var nextId = 0;

        _.forEach(Game.creeps, c => {
            if (c.getRole() === role) {
                let id: number = c.memory.roleId;
                if (id && id > nextId) {
                    nextId = id;
                }
            }
        });

        return nextId + 1;
    }

    private static getBestBody(maxCost: number, partConfigs: Spawner.PartConfig[]): string[] {
        var body: string[] = [];
        var totalWeight = 0;
        var currentCost = 0;

        partConfigs.forEach(pc => {
            totalWeight += pc.weight;

            // Populate body with the minimum required parts
            for (let i = pc.minCount; --i >= 0;) {
                body.push(pc.part);
                currentCost += BODYPART_COST[pc.part];
            }
        });

        // If the current cost is more than the max cost, return null to indicate failure.
        if (currentCost > maxCost) {
            return null;
        }

        var invTotalWeight = 1 / totalWeight;

        // Compute body based on part configurations
        while (currentCost < maxCost) {
            let nextPart: string;
            let maxScore = Number.NEGATIVE_INFINITY;
            let totalCount = body.length;

            // Get next part
            partConfigs.forEach(pc => {
                let partCount = body.filter(p => p === pc.part).length;

                // Check part if max count is either unset, or higher than the current part count of this type.
                if (pc.maxCount == -1 || partCount < pc.maxCount) {
                    let score = MathHelper.getWeightedScore(pc.weight, invTotalWeight, partCount, totalCount);
                    if (score > maxScore) {
                        maxScore = score;
                        nextPart = pc.part;
                    }
                }
            });

            // Break if next part is too expensive
            let partCost = BODYPART_COST[nextPart];
            if (currentCost + partCost > maxCost) {
                break;
            }

            // Add part and compute current cost
            body.push(nextPart);
            currentCost += partCost;
        }

        // Sort array for easy inspection
        body.sort();
        return body
    }

    private static getAvailableExtensionEnergy(room: Room): {} {
        var sum = 0;

        room.find<StructureExtension>(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        }).forEach(s => sum += s.energy);

        return sum;
    }

    private static computeBodyCost(bodyParts: string[]): number {
        var cost = 0;
        _.forEach(bodyParts, part => cost += BODYPART_COST[part]);
        return cost;
    }
}

export module Spawner {
    export class PartConfig {
        public part: string;
        public weight: number;
        public minCount: number;
        public maxCount: number;

        constructor(part: string, weight: number, minCount: number = 1, maxCount: number = -1) {
            this.part = part;
            this.weight = weight;
            this.minCount = minCount;
            this.maxCount = maxCount;
        }
    }
}