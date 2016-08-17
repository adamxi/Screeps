interface Tower {
    getTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(...types: Function[]): T;
    getTargetInfo(): TargetInfo;
    setTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(object: T, params?: {}): T;
    clearTarget(): void;
}