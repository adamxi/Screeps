export abstract class Manager {
    public room: Room;
    public roomName: string;

    constructor(room: Room) {
        this.room = room;
        this.roomName = room.name;
    }

    private load(): void {
        this.room = Game.rooms[this.roomName] as Room;
    }

    /**
     * Virtual method.
     */
    public abstract update(): void;
}