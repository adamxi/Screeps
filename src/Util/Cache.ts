export class Cache {
    public static getOrSetValue(key: string, func: Function, args: string[]): any {
        var value = Cache.getValue(key);

        if (!value) {
            args = args || [];
            value = func.apply(null, args);
            Cache.setValue(key, value);
        }

        return value;
    }

    public static setValue(key: string, value: any): void {
        if (!Memory["cache"]) {
            Memory["cache"] = {};
        }
        Memory["cache"][key] = value;
    }

    public static getValue(key: string): any {
        if (!Memory["cache"]) {
            return undefined;
        }
        return Memory["cache"][key];
    }
}