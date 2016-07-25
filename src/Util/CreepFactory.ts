import {CreepObject} from "./../GameObjects/CreepObject";
import {CreepHarvester} from "./../GameObjects/CreepHarvester";
import {CreepBuilder} from "./../GameObjects/CreepBuilder";
import {CreepUpgrader} from "./../GameObjects/CreepUpgrader";
import {CreepCarrier} from "./../GameObjects/CreepCarrier";

export class CreepFactory {
    //TODO: https://www.stevefenton.co.uk/2014/07/creating-typescript-classes-dynamically/
    public static load(creep: Creep): CreepObject {
        switch (creep.getRole()) {
            case CreepRole.Harvester:
                return new CreepHarvester(creep);

            case CreepRole.Builder:
                return new CreepBuilder(creep);

            case CreepRole.Upgrader:
                return new CreepUpgrader(creep);

            case CreepRole.Carrier:
                return new CreepCarrier(creep);

            default:
                return null;
        }
    }
}