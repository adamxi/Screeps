declare enum CreepState {
    Idle,
    Moving,
    Working,
    Harvesting,
    Upgrading,
    Building,
    Collecting
}

declare enum CreepRole {
    Harvester,
    Builder,
    Upgrader,
    Carrier
}

interface Creep {
    setState(state: CreepState, clearTarget?: boolean): void;
    getState(): CreepState;

    setRole(role: CreepRole): void;
    getRole(): CreepRole;

    getTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(): T;
    getTargetInfo(): any;
    setTarget(object: Source | Resource | Mineral | Creep | Structure | ConstructionSite, params?: {}): void;
    clearTarget(): void;

    setMemory(key: string, value: any, override?: boolean): void
    clearMemory(key: string): void;

    // Debug methods
    showTarget(): void;
}