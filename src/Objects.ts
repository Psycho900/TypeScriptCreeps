import { } from "./Energy";
import { CreepType } from "./CreepType";
import { Type } from "./Type";

// declare global
// {
// 	interface Room /*        */ { room: Room; }
// 	interface RoomPosition /**/ { room: Room | undefined; r?: Room; }
// 	// interface RoomObject     { room: Room | undefined; }
//
// 	interface Room /*        */ { roomName: string; }
// 	// interface RoomPosition   { roomName: string; }
// 	interface RoomObject /*  */ { roomName: string; }
//
// 	// interface Room /*     */ { pos: RoomPosition; }
// 	interface RoomPosition /**/ { pos: RoomPosition; }
// 	// interface RoomObject     { pos: RoomPosition; }
// }

// Object.defineProperty(/*        */ Room.prototype, "room", { get(this: Room /*   */): Room /*       */ { return this; } });
// Object.defineProperty(/**/ RoomPosition.prototype, "room", { get(this: RoomPosition): Room | undefined { return this.r ??= Game.rooms[this.roomName]; } });
// // Object.defineProperty(    RoomObject.prototype, "room", { get(this: RoomObject  ): Room | undefined { return this.room; } });

// Object.defineProperty(/*        */ Room.prototype, "roomName", { get(this: Room /*      */): string { return this.name; } });
// // Object.defineProperty(  RoomPosition.prototype, "roomName", { get(this: RoomPosition   ): string { return this.roomName; } });
// Object.defineProperty(/*  */ RoomObject.prototype, "roomName", { get(this: RoomObject /**/): string { return this.pos.roomName; } });

// // Object.defineProperty(/*     */ Room.prototype, "pos", { get(this: Room /*   */): RoomPosition /*       */ { return this; } });
// Object.defineProperty(/**/ RoomPosition.prototype, "pos", { get(this: RoomPosition): RoomPosition | undefined { return this; } });
// // Object.defineProperty(    RoomObject.prototype, "pos", { get(this: RoomObject  ): RoomPosition | undefined { return this.pos; } });

declare global
{
	interface ControllableRoom extends Room
	{
		/**
		 * The Controller structure of this room
		 */
		controller: StructureController;
	}

	interface Room /*        */ { ToString(): string; }
	interface RoomPosition /**/ { ToString(): string; }
	interface RoomObject /*  */ { ToString(): string; }
}

Room.prototype.ToString = function(): string
{
	return `<a href="https://screeps.com/a/#!/room/shard3/${this.name}">${this.name}</a>`;
};

RoomPosition.prototype.ToString = function(): string
{
	return `(${this.x}, ${this.y}, <a href="https://screeps.com/a/#!/room/shard3/${this.roomName}">${this.roomName}</a>)`;
};

Store.prototype.ToString = function(this: StoreDefinition): string
{
	const resourceTypes: readonly string[] = Object.keys(this);

	if (resourceTypes.length === 0 || (resourceTypes.length === 1 && resourceTypes[0] === "energy"))
	{
		return `[${this.energy}/${this.getCapacity("energy")}]`;
	}

	return `[ ${JSON.stringify(this)} / ${this.getCapacity("energy")} ]`;
};

function AppendPropertyString<T>(
	/* inout */ result: readonly string[],
	roomObject: RoomObject,
	propertyName: string,
	valueToStringFunction?: (value: T) => string): void
{
	// @ts-ignore: The whole point is to see if this specific roomObject happens to have the given property
	const value: T | null | undefined = roomObject[propertyName] as T | null | undefined;

	if (value != null) // null || undefined
	{
		// @ts-ignore: The whole point is to see if this specific roomObject happens to have the given property
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		result.push(`${propertyName}: ${valueToStringFunction ? valueToStringFunction(value) : (value.ToString ? value.ToString() : value)}`);
	}
}

RoomObject.prototype.ToString = function(): string
{
	const resultArray: readonly string[] = [];
	AppendPropertyString(resultArray, this, "name");
	AppendPropertyString(resultArray, this, "EnergyLeftToGive");
	AppendPropertyString(resultArray, this, "EnergyLeftToTake");
	// AppendPropertyString(resultArray, this, "e", (cachedEnergy) => this.et === Game.time ? cachedEnergy : "outdated"); // My custom cached ".store.energy" that I update within ticks
	AppendPropertyString(resultArray, this, "store");
	// @ts-ignore: Anything with a `.energy` property should also have `.energyCapacity` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "energy", (energy: number): string => `[${energy}/${this.energyCapacity}]`);
	// @ts-ignore: Anything with a `.progress` property should also have `.progressTotal` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "progress", (progress: number): string => `[${progress}/${this.progressTotal}]`);
	AppendPropertyString(resultArray, this, "pos");
	// @ts-ignore: Anything with a `.hits` property should also have `.hitsMax` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "hits", (hits: number): string => `[${hits}/${this.hitsMax}]`);
	AppendPropertyString(resultArray, this, "fatigue");
	AppendPropertyString(resultArray, this, "ticksToRegeneration");
	AppendPropertyString(resultArray, this, "ticksToLive");
	AppendPropertyString(resultArray, this, "structureType");
	AppendPropertyString(resultArray, this, "id");
	AppendPropertyString(resultArray, this, "memory", JSON.stringify);

	return `${Type.IsCreep(this) ? CreepType.ToString(this.CreepType) : Type.ToString(this.Type)}: { ${resultArray.join(", ")} }`;
};


/* eslint-disable @typescript-eslint/no-empty-interface */
declare global
{
	interface StructureContainer extends EnergyGiver, EnergyTaker { }
	interface StructureExtension extends EnergyTaker { }
	// interface StructureFactory extends EnergyHolder { }
	// interface StructureLab extends EnergyHolder { }
	interface StructureLink extends EnergyGiver, EnergyTaker { }
	// interface StructureNuker extends EnergyHolder { }
	// interface StructurePowerSpawn extends EnergyHolder { }
	interface StructureSpawn extends EnergyTaker { }
	interface StructureStorage extends EnergyGiver, EnergyTaker { }
	// interface StructureTerminal extends EnergyHolder { }
	interface StructureTower extends EnergyTaker { }
}
