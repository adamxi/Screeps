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
            obj.doDispose();

            let index = GameObject.gameObjects.indexOf(obj);
            GameObject.gameObjects.splice(index, 1);
        }

        GameObject.disposableObjects = [];
    }

    public static add(o: GameObject): void {
        GameObject.gameObjects.push(o);
    }

    public dispose(): void {
        GameObject.disposableObjects.push(this);
    }


    // #########################
    // #### Virtual methods ####
    // #########################

    /**
     * Called when an object is disposed.
     * Virtual method.
     */
    protected doDispose(): void { }

    /**
     * Virtual method.
     */
    protected load(): boolean { return true; }

    /**
     * Called when an object is updated.
     * Virtual method.
     */
    public abstract update(): void;
}