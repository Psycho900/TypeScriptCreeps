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
	None /*      */ = 0,
	Harvester /* */ = 1 << 0,
	Runner /*    */ = 1 << 1,
	Builder /*   */ = 1 << 2,
	Upgrader /*  */ = 1 << 3,
	Miner /*     */ = 1 << 4,
	Claimer /*   */ = 1 << 5,
	Attacker /*  */ = 1 << 6,
	Enemy /*     */ = 1 << 7, // Keep this one last before the groups! (Or update the "All" definition below)

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

	interface Room /*         */ { creepType: CreepType; }
	interface RoomPosition /* */ { creepType: CreepType; }
	interface RoomObject /*   */ { creepType: CreepType; }

	interface Room /*         */ { room: Room; }
	interface RoomPosition /* */ { room: Room | undefined; }
	// interface RoomObject /**/ { room: Room | undefined; }

	interface Room /*         */ { roomName: string; }
	// interface RoomPosition    { roomName: string; }
	interface RoomObject /*   */ { roomName: string; }
}

Room.prototype.creepType /*        */ = CreepType.None;
RoomPosition.prototype.creepType /**/ = CreepType.None;
RoomObject.prototype.creepType /*  */ = CreepType.None;
Object.defineProperty(Creep.prototype /*       */, "creepType" /**/, { get: function (this: Creep) /*       */ { return this.memory ? this.memory.t : CreepType.Enemy; } });

Object.defineProperty(Room.prototype /*        */, "room" /*     */, { get: function (this: Room) /*        */ { return this; } });
Object.defineProperty(RoomPosition.prototype /**/, "room" /*     */, { get: function (this: RoomPosition) /**/ { return Game.rooms[this.roomName]; } });
// Object.defineProperty(RoomObject.prototype    , "room"          , { get: function (this: RoomObject)        { return this.room; } });

Object.defineProperty(Room.prototype /*        */, "roomName" /* */, { get: function (this: Room) /*        */ { return this.name; } });
// Object.defineProperty(RoomPosition.prototype  , "roomName" /* */, { get: function (this: RoomPosition)      { return this.roomName; } });
Object.defineProperty(RoomObject.prototype /*  */, "roomName" /* */, { get: function (this: RoomObject) /*  */ { return this.pos.roomName; } });

declare global
{
	interface Room /*         */ { ToString(): string; }
	interface RoomPosition /* */ { ToString(): string; }
	interface RoomObject /*   */ { ToString(): string; }
}

Room.prototype.ToString = function ()
{
	return `<a href="https://screeps.com/a/#!/room/shard2/${this.name}">${this.name}</a>`;
};

// @ts-ignore: TODO_KevSchil: Figure out how to do the generic prototype here
Store.prototype.ToString = function (this: StoreDefinitionUnlimited)
{
	const resourceTypes = Object.keys(this);

	if (resourceTypes.length == 0 || (resourceTypes.length == 1 && resourceTypes[0] === RESOURCE_ENERGY))
	{
		return `[${this.energy}/${this.getCapacity(RESOURCE_ENERGY)}]`;
	}

	return `[ ${JSON.stringify(this)} / ${this.getCapacity(RESOURCE_ENERGY)} ]`;
};

RoomPosition.prototype.ToString = function ()
{
	return `(${this.x}, ${this.y}, <a href="https://screeps.com/a/#!/room/shard2/${this.roomName}">${this.roomName}</a>)`;
};

function AppendPropertyString<T>(
	/*inout*/ result: string[],
	roomObject: RoomObject,
	propertyName: string,
	valueToStringFunction?: (value: T) => string)
{
	// @ts-ignore: The whole point is to see if this specific roomObject happens to have the given property
	const value = roomObject[propertyName];

	if (value != null) // null || undefined
	{
		result.push(`${propertyName}: ${valueToStringFunction ? valueToStringFunction(value) : (value.ToString ? value.ToString() : value)}`);
	}
}

RoomObject.prototype.ToString = function ()
{
	let resultArray: string[] = [];
	AppendPropertyString(resultArray, this, "name");
	//AppendPropertyString(resultArray, this, "e", (cachedEnergy) => this.et === Game.time ? cachedEnergy : "outdated"); // My custom cached ".store.energy" that I update within ticks
	AppendPropertyString(resultArray, this, "store");
	// @ts-ignore: Anything with a `.energy` property should also have `.energyCapacity` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "energy", (energy) => `[${energy}/${this.energyCapacity}]`);
	// @ts-ignore: Anything with a `.progress` property should also have `.progressTotal` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "progress", (progress) => `[${progress}/${this.progressTotal}]`);
	AppendPropertyString(resultArray, this, "pos");
	// @ts-ignore: Anything with a `.hits` property should also have `.hitsMax` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "hits", (hits) => `[${hits}/${this.hitsMax}]`);
	AppendPropertyString(resultArray, this, "fatigue");
	AppendPropertyString(resultArray, this, "ticksToRegeneration");
	AppendPropertyString(resultArray, this, "ticksToLive");
	AppendPropertyString(resultArray, this, "structureType");
	AppendPropertyString(resultArray, this, "id");
	AppendPropertyString(resultArray, this, "memory", JSON.stringify);

	return `${Type[this.type]}: { ${resultArray.join(", ")} }`;
};
