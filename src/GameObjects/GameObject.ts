export abstract class GameObject {
    private static disposableObjects: GameObject[] = [];
    public static gameObjects: GameObject[] = [];

    public static update(): void {
        for (let i = GameObject.gameObjects.length; --i >= 0;) {
            let obj = GameObject.gameObjects[i];

            if (obj.load()) {
                obj.update();
            }
        }
        GameObject.garbageCollect();
    }

    private static garbageCollect(): void {
        for (let i = GameObject.disposableObjects.length; --i >= 0;) {
            let obj = GameObject.disposableObjects[i];
            //obj.doDispose();
            obj.preDispose();

            let index = GameObject.gameObjects.indexOf(obj);
            GameObject.gameObjects.splice(index, 1);
        }

        GameObject.disposableObjects = [];
    }

    public static add(o: GameObject): void {
        GameObject.gameObjects.push(o);
    }

    protected roomName: string;
    protected memory: { [name: string]: any };

    constructor(roomObject?: RoomObject) {
        if (roomObject) {
            this.roomName = roomObject.room.name;
        }
    }

    //public get Memory(): { [name: string]: any } {
    //    return this.memory;
    //}
    //public set Memory(value: { [name: string]: any }) {
    //    this.memory = value;
    //}

    protected initMemory(root: any, key: string) {
        if (!root) {
            root = {};
        }
        if (!root[key]) {
            root[key] = {};
        }

        this.memory = root[key];
    }

    public dispose(): void {
        GameObject.disposableObjects.push(this);
    }

    private preDispose(): void {
        delete this.memory;
    }


    // #########################
    // #### Virtual methods ####
    // #########################

    ///**
    // * Called when an object is disposed.
    // * Virtual method.
    // */
    //protected doDispose(): void { }

    /**
     * Virtual method.
     */
    protected abstract load(): boolean;

    /**
     * Called when an object is updated.
     * Virtual method.
     */
    public abstract update(): void;
}