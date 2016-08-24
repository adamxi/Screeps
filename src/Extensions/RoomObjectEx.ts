export module RoomObjectEx {
    RoomObject.prototype.flagObject = function () {
        var flag = Game.flags["debug"];
        if (flag) {
            flag.setPosition((this as RoomObject).pos);
        } else {
            this.room.createFlag((this as RoomObject).pos, "debug", COLOR_PURPLE, COLOR_PURPLE);
        }
    }
}