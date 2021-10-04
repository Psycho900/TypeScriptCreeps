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
	Road /*            */ = 1 << 11,
	Wall /*            */ = 1 << 12,

	// OwnedStructure (my, owner)
	// {
	Controller /*      */ = 1 << 13,
	Extension /*       */ = 1 << 14,
	Extractor /*       */ = 1 << 15,
	KeeperLair /*      */ = 1 << 16,
	Lab /*             */ = 1 << 17,
	Link /*            */ = 1 << 18,
	Nuker /*           */ = 1 << 19,
	Observer /*        */ = 1 << 20,
	PowerBank /*       */ = 1 << 21,
	PowerSpawn /*      */ = 1 << 22,
	Rampart /*         */ = 1 << 23,
	Spawn /*           */ = 1 << 24,
	Storage /*         */ = 1 << 25,
	Terminal /*        */ = 1 << 26,
	Tower /*           */ = 1 << 27,
	// }
	// }
	// }
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
StructureRoad.prototype.type = Type.Road;
StructureWall.prototype.type = Type.Wall;

// OwnedStructure (my, owner)
// {
StructureController.prototype.type = Type.Controller;
StructureExtension.prototype.type = Type.Extension;
StructureExtractor.prototype.type = Type.Extractor;
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
Object.defineProperty(Creep.prototype /*       */, "creepType" /**/, { get: function (this: Creep) /*       */ { return this.memory.t; } });

Object.defineProperty(Room.prototype /*        */, "room" /*     */, { get: function (this: Room) /*        */ { return this; } });
Object.defineProperty(RoomPosition.prototype /**/, "room" /*     */, { get: function (this: RoomPosition) /**/ { return Game.rooms[this.roomName]; } });
// Object.defineProperty(RoomObject.prototype    , "room"          , { get: function (this: RoomObject)        { return this.room; } });

Object.defineProperty(Room.prototype /*        */, "roomName" /* */, { get: function (this: Room) /*        */ { return this.name; } });
// Object.defineProperty(RoomPosition.prototype  , "roomName" /* */, { get: function (this: RoomPosition)      { return this.roomName; } });
Object.defineProperty(RoomObject.prototype /*  */, "roomName" /* */, { get: function (this: RoomObject) /*  */ { return this.pos.roomName; } });

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
		result.push(`${propertyName}: ${valueToStringFunction ? valueToStringFunction(value) : value}`);
	}
}

Object.prototype.toString = function ()
{
	// @ts-ignore: If this object happens to have a `name` property, then display it
	return this.name || JSON.stringify(this);
};

Room.prototype.toString = function ()
{
	return `<a href="https://screeps.com/a/#!/room/shard2/${this.name}">${this.name}</a>`;
};

// @ts-ignore: TODO_KevSchil: Figure out how to do the generic prototype here
Store.prototype.toString = function (this: StoreDefinitionUnlimited)
{
	const resourceTypes = Object.keys(this);

	if (resourceTypes.length == 0 || (resourceTypes.length == 1 && resourceTypes[0] === RESOURCE_ENERGY))
	{
		return `[${this.energy}/${this.getCapacity(RESOURCE_ENERGY)}]`;
	}

	return `[ ${JSON.stringify(this)} / ${this.getCapacity(RESOURCE_ENERGY)} ]`;
};

RoomPosition.prototype.toString = function ()
{
	return `(${this.x}, ${this.y}, <a href="https://screeps.com/a/#!/room/shard2/${this.roomName}">${this.roomName}</a>)`;
};

RoomObject.prototype.toString = function ()
{
	let resultArray: string[] = [];
	AppendPropertyString(resultArray, this, "name");
	// @ts-ignore: Anything with a `.e` property should also have `.et` (and if not, then undefined is handled just fine here)
	AppendPropertyString(resultArray, this, "e", (cachedEnergy) => this.et === Game.time ? cachedEnergy : "outdated"); // My custom cached ".store.energy" that I update within ticks
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
	AppendPropertyString(resultArray, this, "memory");

	return `${Type[this.type]}: { ${resultArray.join(", ")} }`;
};
