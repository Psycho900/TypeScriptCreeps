function InclusiveGroup(min: number, max: number): number
{
	return max | (max - min);
}

export enum Type
{
	// Built-in types :
	Room /*            */ = 1 << 0,
	RoomPosition /*    */ = 1 << 1,

	// RoomObject's (room, pos) :
	// {
	Creep /*           */ = 1 << 2,
	ConstructionSite /**/ = 1 << 3,
	Flag /*            */ = 1 << 4,
	Mineral /*         */ = 1 << 5,
	Resource /*        */ = 1 << 6,
	Ruin /*            */ = 1 << 7,
	Source /*          */ = 1 << 8,
	Tombstone /*       */ = 1 << 9,

	// Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
	// {
	Container /*       */ = 1 << 10,
	Portal /*          */ = 1 << 11,
	Road /*            */ = 1 << 12,
	Wall /*            */ = 1 << 13,

	// OwnedStructure (my, owner)
	// {
	Controller /*      */ = 1 << 14,
	Extension /*       */ = 1 << 15,
	Extractor /*       */ = 1 << 16,
	Factory /*         */ = 1 << 17,
	InvaderCore /*     */ = 1 << 18,
	KeeperLair /*      */ = 1 << 19,
	Lab /*             */ = 1 << 20,
	Link /*            */ = 1 << 21,
	Nuker /*           */ = 1 << 22,
	Observer /*        */ = 1 << 23,
	PowerBank /*       */ = 1 << 24,
	PowerSpawn /*      */ = 1 << 25,
	Rampart /*         */ = 1 << 26,
	Spawn /*           */ = 1 << 27,
	Storage /*         */ = 1 << 28,
	Terminal /*        */ = 1 << 29,
	Tower /*           */ = 1 << 30,
	// }
	// }
	// }

	FirstRoomObject = Creep,
	FirstStructure = Container,
	FirstOwnedStructure = Controller,
	LastOwnedStructure = Tower,
	LastStructure = Tower,
	LastRoomObject = Tower,

	AllRoomObjects = InclusiveGroup(FirstRoomObject, LastRoomObject),
	AllStructures = InclusiveGroup(FirstStructure, LastStructure),
	AllOwnedStructures = InclusiveGroup(FirstOwnedStructure, LastOwnedStructure),
}

export enum CreepType
{
	None /*     */ = 0,
	Harvester /**/ = 1 << 0,
	Runner /*   */ = 1 << 1,
	Builder /*  */ = 1 << 2,
	Upgrader /* */ = 1 << 3,
	Miner /*    */ = 1 << 4,
	Claimer /*  */ = 1 << 5,
	Attacker /* */ = 1 << 6,
	Enemy /*    */ = 1 << 7, // Keep this one last before the groups! (Or update the "All" definition below)

	All = (Enemy << 1) - 1,

	Producers = Harvester | Miner,
	Consumers = Builder | Upgrader,
}

declare global
{
	interface Room /*        */ { type: Type; }
	interface RoomPosition /**/ { type: Type; }
	interface RoomObject /*  */ { type: Type; }
}

// Built-in types :
Room.prototype.type = Type.Room;
RoomPosition.prototype.type = Type.RoomPosition;

// RoomObject's (room, pos) :
// {
Creep.prototype.type = Type.Creep;
ConstructionSite.prototype.type = Type.ConstructionSite;
Flag.prototype.type = Type.Flag;
Mineral.prototype.type = Type.Mineral;
Resource.prototype.type = Type.Resource;
Ruin.prototype.type = Type.Ruin;
Source.prototype.type = Type.Source;
Tombstone.prototype.type = Type.Tombstone;

// Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
// {
StructureContainer.prototype.type = Type.Container;
StructurePortal.prototype.type = Type.Portal;
StructureRoad.prototype.type = Type.Road;
StructureWall.prototype.type = Type.Wall;

// OwnedStructure (my, owner)
// {
StructureController.prototype.type = Type.Controller;
StructureExtension.prototype.type = Type.Extension;
StructureExtractor.prototype.type = Type.Extractor;
StructureFactory.prototype.type = Type.Factory;
StructureInvaderCore.prototype.type = Type.InvaderCore;
StructureKeeperLair.prototype.type = Type.KeeperLair;
StructureLab.prototype.type = Type.Lab;
StructureLink.prototype.type = Type.Link;
StructureNuker.prototype.type = Type.Nuker;
StructureObserver.prototype.type = Type.Observer;
StructurePowerBank.prototype.type = Type.PowerBank;
StructurePowerSpawn.prototype.type = Type.PowerSpawn;
StructureRampart.prototype.type = Type.Rampart;
StructureSpawn.prototype.type = Type.Spawn;
StructureStorage.prototype.type = Type.Storage;
StructureTerminal.prototype.type = Type.Terminal;
StructureTower.prototype.type = Type.Tower;
// }
// }
// }

declare global
{
	interface CreepMemory { t: CreepType; }

	interface Room /*        */ { creepType: CreepType; }
	interface RoomPosition /**/ { creepType: CreepType; }
	interface RoomObject /*  */ { creepType: CreepType; }

	interface Room /*        */ { room: Room; }
	interface RoomPosition /**/ { room: Room | undefined; }
	// interface RoomObject     { room: Room | undefined; }

	interface Room /*        */ { roomName: string; }
	// interface RoomPosition   { roomName: string; }
	interface RoomObject /*  */ { roomName: string; }

	// interface Room /*     */ { pos: RoomPosition; }
	interface RoomPosition /**/ { pos: RoomPosition; }
	// interface RoomObject     { pos: RoomPosition; }
}

Room.prototype.creepType /*        */ = CreepType.None;
RoomPosition.prototype.creepType /**/ = CreepType.None;
RoomObject.prototype.creepType /*  */ = CreepType.None;
Object.defineProperty(Creep.prototype, "creepType", { get(this: Creep): CreepType { const creepMemory = Memory.creeps[this.name]; return creepMemory ? creepMemory.t : CreepType.Enemy; } });

Object.defineProperty(Room.prototype /*        */, "room", { get(this: Room /*   */): Room /*       */ { return this; } });
Object.defineProperty(RoomPosition.prototype /**/, "room", { get(this: RoomPosition): Room | undefined { return Game.rooms[this.roomName]; } });
// Object.defineProperty(RoomObject.prototype    , "room", { get(this: RoomObject  ): Room | undefined { return this.room; } });

Object.defineProperty(Room.prototype /*        */, "roomName", { get(this: Room /*      */): string { return this.name; } });
// Object.defineProperty(RoomPosition.prototype  , "roomName", { get(this: RoomPosition   ): string { return this.roomName; } });
Object.defineProperty(RoomObject.prototype /*  */, "roomName", { get(this: RoomObject /**/): string { return this.pos.roomName; } });

// Object.defineProperty(Room.prototype /*     */, "pos", { get(this: Room /*   */): RoomPosition /*       */ { return this; } });
Object.defineProperty(RoomPosition.prototype /**/, "pos", { get(this: RoomPosition): RoomPosition | undefined { return this; } });
// Object.defineProperty(RoomObject.prototype    , "pos", { get(this: RoomObject  ): RoomPosition | undefined { return this.pos; } });

declare global
{
	interface Room /*        */ { ToString(): string; }
	interface RoomPosition /**/ { ToString(): string; }
	interface RoomObject /*  */ { ToString(): string; }
}

Room.prototype.ToString = function (): string
{
	return `<a href="https://screeps.com/a/#!/room/shard2/${this.name}">${this.name}</a>`;
};

// @ts-ignore: I think this is the best we can do for this type that isn't declared in our code anywhere
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
Store.prototype.ToString = function (this: StoreDefinition): string
{
	const resourceTypes: string[] = Object.keys(this);
	const energyCapacity: number = this.getCapacity(RESOURCE_ENERGY);

	if (resourceTypes.length === 0 || (resourceTypes.length === 1 && resourceTypes[0] === RESOURCE_ENERGY))
	{
		return `[${this.energy}/${energyCapacity}]`;
	}

	return `[ ${JSON.stringify(this)} / ${energyCapacity} ]`;
};

RoomPosition.prototype.ToString = function (): string
{
	return `(${this.x}, ${this.y}, <a href="https://screeps.com/a/#!/room/shard3/${this.roomName}">${this.roomName}</a>)`;
};

function AppendPropertyString<T>(
	/* inout */ result: string[],
	roomObject: RoomObject,
	propertyName: string,
	valueToStringFunction?: (value: T) => string): void
{
	// @ts-ignore: The whole point is to see if this specific roomObject happens to have the given property
	const value: T = roomObject[propertyName] as T;

	if (value != null) // null || undefined
	{
		// @ts-ignore: The whole point is to see if this specific roomObject happens to have the given property
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		result.push(`${propertyName}: ${valueToStringFunction ? valueToStringFunction(value) : (value.ToString ? value.ToString() : value)}`);
	}
}

RoomObject.prototype.ToString = function (): string
{
	const resultArray: string[] = [];
	AppendPropertyString(resultArray, this, "name");
	// AppendPropertyString(resultArray, this, "e", (cachedEnergy) => this.et === Game.time ? cachedEnergy : "outdated"); // My custom cached ".store.energy" that I update within ticks
	AppendPropertyString(resultArray, this, "store");
	// @ts-ignore: Anything with a `.energy` property should also have `.energyCapacity` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "energy", (energy): string => `[${energy}/${this.energyCapacity}]`);
	// @ts-ignore: Anything with a `.progress` property should also have `.progressTotal` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "progress", (progress): string => `[${progress}/${this.progressTotal}]`);
	AppendPropertyString(resultArray, this, "pos");
	// @ts-ignore: Anything with a `.hits` property should also have `.hitsMax` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "hits", (hits): string => `[${hits}/${this.hitsMax}]`);
	AppendPropertyString(resultArray, this, "fatigue");
	AppendPropertyString(resultArray, this, "ticksToRegeneration");
	AppendPropertyString(resultArray, this, "ticksToLive");
	AppendPropertyString(resultArray, this, "structureType");
	AppendPropertyString(resultArray, this, "id");
	AppendPropertyString(resultArray, this, "memory", JSON.stringify);

	return `${Type[this.type]}: { ${resultArray.join(", ")} }`;
};
