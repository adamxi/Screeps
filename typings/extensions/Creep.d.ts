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
    //foo(): number;
    PathInfo: PathInfo;

    setState(state: CreepState, clearTarget?: boolean): void;
    getState(): CreepState;

    setRole(role: CreepRole): void;
    getRole(): CreepRole;

    getTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(...types: Function[]): T;
    getTargetInfo(): TargetInfo;
    setTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(object: T, params?: {}): T;
    clearTarget(): void;
    moveToTarget<T extends RoomObject>(object?: T, requireOptimalPath?: boolean, minimumDistToTarget?: number): number;

    setPath(pathInfo: PathInfo): void;

    remember(key: string, value: any, override?: boolean): void
    forget(key: string): void;

    // Debug methods
    showTarget(): void;
    showData(): void;
    showLog(): void;
    log(msg: string): void;
}