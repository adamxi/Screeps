export module RoomObjectEx {
    RoomObject.prototype.flagObject = function(){
        var flag = Game.flags["debug"];
        if (flag) {
            flag.setPosition(this.pos);
        } else {
            this.room.createFlag(this.pos, "debug", COLOR_PURPLE, COLOR_PURPLE);
        }
    }
}