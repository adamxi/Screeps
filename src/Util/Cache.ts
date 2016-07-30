export class Cache {
    constructor(objId: string) {

    }

    public getOrSet(key: string, func: Function, args: string[]): any {
        var value = this.get(key);

        if (!value) {
            args = args || [];
            value = func.apply(null, args);
            this.set(key, value);
        }

        return value;
    }

    public set(key: string, value: any): void {
        if (!Memory["cache"]) {
            Memory["cache"] = {};
        }
        Memory["cache"][key] = value;
    }

    public get(key: string): any {
        if (!Memory["cache"]) {
            return undefined;
        }
        return Memory["cache"][key];
    }
}