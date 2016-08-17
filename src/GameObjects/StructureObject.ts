import {GameObject} from "./GameObject";
import {ErrorHelper} from "./../Util/ErrorHelper";

export abstract class StructureObject extends GameObject {
    protected id: string;
    protected structure: Structure;

    constructor(structure: Structure) {
        super(structure);
        this.id = structure.id;
    }

    public load(): boolean {
        this.structure = Game.structures[this.id];
        if (!this.structure) {
            this.dispose();
            return false;
        }
        return true;
    }

    public get Structure(): Structure {
        return this.structure;
    }
}