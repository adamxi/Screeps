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

interface TargetInfo {
    id: string;
    params: any;
    typeName: string;
}

interface Creep {
    foo(): number;

    setState(state: CreepState, clearTarget?: boolean): void;
    getState(): CreepState;

    setRole(role: CreepRole): void;
    getRole(): CreepRole;

    getTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(...types: Function[]): T;
    getTargetInfo(): TargetInfo;
    setTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(object: T, params?: {}): T;
    clearTarget(): void;

    setMemory(key: string, value: any, override?: boolean): void
    clearMemory(key: string): void;

    // Debug methods
    showTarget(): void;
    showData(): void;
    showLog(): void;
    log(msg: string): void;
}