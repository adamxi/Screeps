import {CreepObject} from "./../GameObjects/CreepObject";

export class CreepConstraint {
    public role: CreepRole;
    public populationWeight: number;
    public populationCount: number;
    public populationMax: number;
    public spawnCondition: (room: Room) => boolean;

    constructor(role: CreepRole, populationWeight: number, populationMax: number = -1, spawnCondition: (room: Room) => boolean = () => true) {
        this.role = role;
        this.populationWeight = populationWeight;
        this.populationCount = 0;
        this.populationMax = populationMax;
        this.spawnCondition = spawnCondition;
    }
}