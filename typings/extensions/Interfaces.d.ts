interface SourceInfo {
    sourceId: string,
    room: string,
    totalSlots: number,
    x: number,
    y: number
}

interface TargetInfo {
    id: string;
    params: any;
    typeName: string;
}

interface FindTileParams {
    area: LookAtResultWithPos[];
    area2?: LookAtResultMatrix;
    refPos: RoomPosition;
    findCount: number;
    searchOrder: boolean;
    distanceType: number;
    requiresRoad?: boolean;
    nextToStructureType?: string;
}

interface PathInfo {
    id: string;
    path: string;
    room: string;
    created: number;
    dest: RoomPosition;
    blockCount: number;
}