import {GameObject} from "./../GameObjects/GameObject";

import {CreepObject} from "./../GameObjects/CreepObject";
import {CreepHarvester} from "./../GameObjects/CreepHarvester";
import {CreepBuilder} from "./../GameObjects/CreepBuilder";
import {CreepUpgrader} from "./../GameObjects/CreepUpgrader";
import {CreepCarrier} from "./../GameObjects/CreepCarrier";

import {StructureObject} from "./../GameObjects/StructureObject";
import {TowerObject} from "./../GameObjects/TowerObject";

export class ObjectLoader {
    public static load(obj: Structure): TowerObject;
    public static load(obj: StructureTower): TowerObject;
    public static load(obj: Creep): CreepObject;
    public static load(obj: any): GameObject {
        if (obj instanceof Creep) {
            return ObjectLoader.loadCreep(obj);
        }
        if (obj instanceof StructureTower) {
            return new TowerObject(obj);
        }
        return null;
    }

    private static loadCreep(obj: Creep): CreepObject {
        switch (obj.getRole()) {
            case CreepRole.Harvester:
                return new CreepHarvester(obj);

            case CreepRole.Builder:
                return new CreepBuilder(obj);

            case CreepRole.Upgrader:
                return new CreepUpgrader(obj);

            case CreepRole.Carrier:
                return new CreepCarrier(obj);

            default:
                return null;
        }
    }
}