export class TargetHelper {
    private static KEY_TARGET = "targetInfo";

    public static getTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(memory: { [name: string]: any }, ...types: Function[]): T {
        var targetInfo = memory[TargetHelper.KEY_TARGET] as TargetInfo;

        if (targetInfo) {
            let o = Game.getObjectById<T>(targetInfo.id);

            if (types.length > 0) {
                for (let i = 0; i < types.length; i++) {
                    if (o instanceof types[i]) {
                        return o;
                    }
                }
                return null;
            }
            return o;
        }

        return null;
    }

    public static getTargetInfo(memory: { [name: string]: any }): TargetInfo {
        var targetInfo = memory[TargetHelper.KEY_TARGET] as TargetInfo;

        if (targetInfo) {
            return targetInfo;
        }

        return null;
    }

    public static setTarget<T extends Source | Resource | Mineral | Creep | Structure | ConstructionSite>(memory: { [name: string]: any }, target: T, params?: {}): T {
        if (target) {
            let targetInfo: TargetInfo = {
                id: target.id,
                params: params,
                typeName: target.toString().substring(1).split(" ")[0].toLowerCase()
            };

            memory[TargetHelper.KEY_TARGET] = targetInfo;
        }
        return target;
    }

    public static clearTarget(memory: { [name: string]: any }): void {
        delete memory[TargetHelper.KEY_TARGET];
    }
}