import { CreepType } from "./CreepType";

declare global
{
	/*              */ type RoomType = 0b0000000000000000000000000000001;
	/*      */ type RoomPositionType = 0b0000000000000000000000000000010;
	/*            */ type CreepsType = 0b0000000000000000000000000000100;
	/*  */ type ConstructionSiteType = 0b0000000000000000000000000001000;
	/*              */ type FlagType = 0b0000000000000000000000000010000;
	/*           */ type MineralType = 0b0000000000000000000000000100000;
	/*          */ type ResourceType = 0b0000000000000000000000001000000;
	/*              */ type RuinType = 0b0000000000000000000000010000000;
	/*            */ type SourceType = 0b0000000000000000000000100000000;
	/*         */ type TombstoneType = 0b0000000000000000000001000000000;
	/*         */ type ContainerType = 0b0000000000000000000010000000000;
	/*            */ type PortalType = 0b0000000000000000000100000000000;
	/*              */ type RoadType = 0b0000000000000000001000000000000;
	/*              */ type WallType = 0b0000000000000000010000000000000;
	/*        */ type ControllerType = 0b0000000000000000100000000000000;
	/*         */ type ExtensionType = 0b0000000000000001000000000000000;
	/*         */ type ExtractorType = 0b0000000000000010000000000000000;
	/*           */ type FactoryType = 0b0000000000000100000000000000000;
	/*       */ type InvaderCoreType = 0b0000000000001000000000000000000;
	/*        */ type KeeperLairType = 0b0000000000010000000000000000000;
	/*               */ type LabType = 0b0000000000100000000000000000000;
	/*              */ type LinkType = 0b0000000001000000000000000000000;
	/*             */ type NukerType = 0b0000000010000000000000000000000;
	/*          */ type ObserverType = 0b0000000100000000000000000000000;
	/*         */ type PowerBankType = 0b0000001000000000000000000000000;
	/*        */ type PowerSpawnType = 0b0000010000000000000000000000000;
	/*           */ type RampartType = 0b0000100000000000000000000000000;
	/*             */ type SpawnType = 0b0001000000000000000000000000000;
	/*           */ type StorageType = 0b0010000000000000000000000000000;
	/*          */ type TerminalType = 0b0100000000000000000000000000000;
	/*             */ type TowerType = 0b1000000000000000000000000000000;

	/*               */ type AnyType =
		| /*             */ RoomType
		| /*     */ RoomPositionType
		| /*    */ AnyRoomObjectType;

	/*     */ type AnyRoomObjectType =
		| /*           */ CreepsType
		| /* */ ConstructionSiteType
		| /*             */ FlagType
		| /*          */ MineralType
		| /*         */ ResourceType
		| /*             */ RuinType
		| /*           */ SourceType
		| /*        */ TombstoneType
		| /*     */ AnyStructureType;

	/*      */ type AnyStructureType =
		| /*        */ ContainerType
		| /*           */ PortalType
		| /*             */ RoadType
		| /*             */ WallType
		| /**/ AnyOwnedStructureType;

	/* */ type AnyOwnedStructureType =
		| /*       */ ControllerType
		| /*        */ ExtensionType
		| /*        */ ExtractorType
		| /*          */ FactoryType
		| /*      */ InvaderCoreType
		| /*       */ KeeperLairType
		| /*              */ LabType
		| /*             */ LinkType
		| /*            */ NukerType
		| /*         */ ObserverType
		| /*        */ PowerBankType
		| /*       */ PowerSpawnType
		| /*          */ RampartType
		| /*            */ SpawnType
		| /*          */ StorageType
		| /*         */ TerminalType
		| /*            */ TowerType;

	type ToInterface<TRoomObjectType extends AnyRoomObjectType> =
		// | (TRoomObjectType extends /*         */ RoomType ? Room /*                */ : never)
		// | (TRoomObjectType extends /* */ RoomPositionType ? RoomPosition /*        */ : never)
		| (TRoomObjectType extends /*          */ CreepsType ? Creep /*               */ : never)
		| (TRoomObjectType extends /**/ ConstructionSiteType ? ConstructionSite /*    */ : never)
		| (TRoomObjectType extends /*            */ FlagType ? Flag /*                */ : never)
		| (TRoomObjectType extends /*         */ MineralType ? Mineral /*             */ : never)
		| (TRoomObjectType extends /*        */ ResourceType ? Resource /*            */ : never)
		| (TRoomObjectType extends /*            */ RuinType ? Ruin /*                */ : never)
		| (TRoomObjectType extends /*          */ SourceType ? Source /*              */ : never)
		| (TRoomObjectType extends /*       */ TombstoneType ? Tombstone /*           */ : never)
		| (TRoomObjectType extends /*       */ ContainerType ? StructureContainer /*  */ : never)
		| (TRoomObjectType extends /*          */ PortalType ? StructurePortal /*     */ : never)
		| (TRoomObjectType extends /*            */ RoadType ? StructureRoad /*       */ : never)
		| (TRoomObjectType extends /*            */ WallType ? StructureWall /*       */ : never)
		| (TRoomObjectType extends /*      */ ControllerType ? StructureController /* */ : never)
		| (TRoomObjectType extends /*       */ ExtensionType ? StructureExtension /*  */ : never)
		| (TRoomObjectType extends /*       */ ExtractorType ? StructureExtractor /*  */ : never)
		| (TRoomObjectType extends /*         */ FactoryType ? StructureFactory /*    */ : never)
		| (TRoomObjectType extends /*     */ InvaderCoreType ? StructureInvaderCore /**/ : never)
		| (TRoomObjectType extends /*      */ KeeperLairType ? StructureKeeperLair /* */ : never)
		| (TRoomObjectType extends /*             */ LabType ? StructureLab /*        */ : never)
		| (TRoomObjectType extends /*            */ LinkType ? StructureLink /*       */ : never)
		| (TRoomObjectType extends /*           */ NukerType ? StructureNuker /*      */ : never)
		| (TRoomObjectType extends /*        */ ObserverType ? StructureObserver /*   */ : never)
		| (TRoomObjectType extends /*       */ PowerBankType ? StructurePowerBank /*  */ : never)
		| (TRoomObjectType extends /*      */ PowerSpawnType ? StructurePowerSpawn /* */ : never)
		| (TRoomObjectType extends /*         */ RampartType ? StructureRampart /*    */ : never)
		| (TRoomObjectType extends /*           */ SpawnType ? StructureSpawn /*      */ : never)
		| (TRoomObjectType extends /*         */ StorageType ? StructureStorage /*    */ : never)
		| (TRoomObjectType extends /*        */ TerminalType ? StructureTerminal /*   */ : never)
		| (TRoomObjectType extends /*           */ TowerType ? StructureTower /*      */ : never);
}

export abstract /* static */ class Type
{
	// Built-in types :
	public static readonly Room: /*                           */ RoomType = 0b0000000000000000000000000000001;
	public static readonly RoomPosition: /*           */ RoomPositionType = 0b0000000000000000000000000000010;

	// RoomObject's (room, pos) :
	// {
	public static readonly Creep: /*                        */ CreepsType = 0b0000000000000000000000000000100;
	public static readonly ConstructionSite: /*   */ ConstructionSiteType = 0b0000000000000000000000000001000;
	public static readonly Flag: /*                           */ FlagType = 0b0000000000000000000000000010000;
	public static readonly Mineral: /*                     */ MineralType = 0b0000000000000000000000000100000;
	public static readonly Resource: /*                   */ ResourceType = 0b0000000000000000000000001000000;
	public static readonly Ruin: /*                           */ RuinType = 0b0000000000000000000000010000000;
	public static readonly Source: /*                       */ SourceType = 0b0000000000000000000000100000000;
	public static readonly Tombstone: /*                 */ TombstoneType = 0b0000000000000000000001000000000;

	//     Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
	//     {
	public static readonly Container: /*                 */ ContainerType = 0b0000000000000000000010000000000;
	public static readonly Portal: /*                       */ PortalType = 0b0000000000000000000100000000000;
	public static readonly Road: /*                           */ RoadType = 0b0000000000000000001000000000000;
	public static readonly Wall: /*                           */ WallType = 0b0000000000000000010000000000000;

	//         OwnedStructure (my, owner)
	//         {
	public static readonly Controller: /*               */ ControllerType = 0b0000000000000000100000000000000;
	public static readonly Extension: /*                 */ ExtensionType = 0b0000000000000001000000000000000;
	public static readonly Extractor: /*                 */ ExtractorType = 0b0000000000000010000000000000000;
	public static readonly Factory: /*                     */ FactoryType = 0b0000000000000100000000000000000;
	public static readonly InvaderCore: /*             */ InvaderCoreType = 0b0000000000001000000000000000000;
	public static readonly KeeperLair: /*               */ KeeperLairType = 0b0000000000010000000000000000000;
	public static readonly Lab: /*                             */ LabType = 0b0000000000100000000000000000000;
	public static readonly Link: /*                           */ LinkType = 0b0000000001000000000000000000000;
	public static readonly Nuker: /*                         */ NukerType = 0b0000000010000000000000000000000;
	public static readonly Observer: /*                   */ ObserverType = 0b0000000100000000000000000000000;
	public static readonly PowerBank: /*                 */ PowerBankType = 0b0000001000000000000000000000000;
	public static readonly PowerSpawn: /*               */ PowerSpawnType = 0b0000010000000000000000000000000;
	public static readonly Rampart: /*                     */ RampartType = 0b0000100000000000000000000000000;
	public static readonly Spawn: /*                         */ SpawnType = 0b0001000000000000000000000000000;
	public static readonly Storage: /*                     */ StorageType = 0b0010000000000000000000000000000;
	public static readonly Terminal: /*                   */ TerminalType = 0b0100000000000000000000000000000;
	public static readonly Tower: /*                         */ TowerType = 0b1000000000000000000000000000000;
	//         }
	//     }
	// }

	public static readonly All: /*                             */ AnyType = 0b1111111111111111111111111111111 as AnyType;
	public static readonly AllRoomObjects: /*        */ AnyRoomObjectType = 0b1111111111111111111111111111100 as AnyRoomObjectType;
	public static readonly AllStructures: /*          */ AnyStructureType = 0b1111111111111111111110000000000 as AnyStructureType;
	public static readonly AllOwnedStructures: /**/ AnyOwnedStructureType = 0b1111111111111111100000000000000 as AnyOwnedStructureType;

	public static readonly FirstStructure: /*            */ ContainerType = 0b0000000000000000000010000000000;
	public static readonly LastStructure: /*                 */ TowerType = 0b1000000000000000000000000000000;

	// public static Or<
	// 	T1 extends AnyType,
	// 	T2 extends AnyType>(
	// 		value1: T1,
	// 		value2: T2): T1 | T2
	// {
	// 	return (value1 | value2) as T1 | T2;
	// }

	public static Contains<
		T1 extends AnyType,
		T2 extends AnyType>(
			value1: T1,
			value2: T2): value1 is (T1 & T2)
	{
		return (value1 & value2) !== 0;
	}

	public static IsCreep(roomObject: RoomObject): roomObject is Creep
	{
		return roomObject.type === Type.Creep;
	}
}

const c_typeToString: Record<AnyType, string> =
{
	// Built-in types :
	[Type.Room /*            */]: "Room",
	[Type.RoomPosition /*    */]: "RoomPosition",

	// RoomObject's (room, pos) :
	// {
	[Type.Creep /*           */]: "Creep",
	[Type.ConstructionSite /**/]: "ConstructionSite",
	[Type.Flag /*            */]: "Flag",
	[Type.Mineral /*         */]: "Mineral",
	[Type.Resource /*        */]: "Resource",
	[Type.Ruin /*            */]: "Ruin",
	[Type.Source /*          */]: "Source",
	[Type.Tombstone /*       */]: "Tombstone",

	//     Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
	//     {
	[Type.Container /*       */]: "Container",
	[Type.Portal /*          */]: "Portal",
	[Type.Road /*            */]: "Road",
	[Type.Wall /*            */]: "Wall",

	//         OwnedStructure (my, owner)
	//         {
	[Type.Controller /*      */]: "Controller",
	[Type.Extension /*       */]: "Extension",
	[Type.Extractor /*       */]: "Extractor",
	[Type.Factory /*         */]: "Factory",
	[Type.InvaderCore /*     */]: "InvaderCore",
	[Type.KeeperLair /*      */]: "KeeperLair",
	[Type.Lab /*             */]: "Lab",
	[Type.Link /*            */]: "Link",
	[Type.Nuker /*           */]: "Nuker",
	[Type.Observer /*        */]: "Observer",
	[Type.PowerBank /*       */]: "PowerBank",
	[Type.PowerSpawn /*      */]: "PowerSpawn",
	[Type.Rampart /*         */]: "Rampart",
	[Type.Spawn /*           */]: "Spawn",
	[Type.Storage /*         */]: "Storage",
	[Type.Terminal /*        */]: "Terminal",
	[Type.Tower /*           */]: "Tower",
	//         }
	//     }
	// }
};

const c_creepTypeToString: Record<AnyCreepType, string> =
{
	[CreepType.Harvester /**/]: "Harvester",
	[CreepType.Runner /*   */]: "Runner",
	[CreepType.Builder /*  */]: "Builder",
	[CreepType.Upgrader /* */]: "Upgrader",
	[CreepType.Miner /*    */]: "Miner",
	[CreepType.Claimer /*  */]: "Claimer",
	[CreepType.Attacker /* */]: "Attacker",
	[CreepType.Enemy /*    */]: "Enemy",
};

declare global
{
	interface Room /*                */ { type: /*                 */ RoomType; }
	interface RoomPosition /*        */ { type: /*         */ RoomPositionType; }

	interface RoomObject /*          */ { type: /*        */ AnyRoomObjectType; }
	// {
	interface Creep /*               */ { type: /*               */ CreepsType; }
	interface ConstructionSite /*    */ { type: /*     */ ConstructionSiteType; }
	interface Mineral /*             */ { type: /*              */ MineralType; }
	interface Resource /*            */ { type: /*             */ ResourceType; }
	interface Ruin /*                */ { type: /*                 */ RuinType; }
	interface Source /*              */ { type: /*               */ SourceType; }
	interface Tombstone /*           */ { type: /*            */ TombstoneType; }

	interface Structure /*           */ { type: /*         */ AnyStructureType; }
	//     {
	interface StructureContainer /*  */ { type: /*            */ ContainerType; }
	interface StructurePortal /*     */ { type: /*               */ PortalType; }
	interface StructureRoad /*       */ { type: /*                 */ RoadType; }
	interface StructureWall /*       */ { type: /*                 */ WallType; }

	interface OwnedStructure /*      */ { type: /*    */ AnyOwnedStructureType; }
	//         {
	interface StructureController /* */ { type: /*           */ ControllerType; }
	interface StructureExtension /*  */ { type: /*            */ ExtensionType; }
	interface StructureExtractor /*  */ { type: /*            */ ExtractorType; }
	interface StructureFactory /*    */ { type: /*              */ FactoryType; }
	interface StructureInvaderCore /**/ { type: /*          */ InvaderCoreType; }
	interface StructureKeeperLair /* */ { type: /*           */ KeeperLairType; }
	interface StructureLab /*        */ { type: /*                  */ LabType; }
	interface StructureLink /*       */ { type: /*                 */ LinkType; }
	interface StructureNuker /*      */ { type: /*                */ NukerType; }
	interface StructureObserver /*   */ { type: /*             */ ObserverType; }
	interface StructurePowerBank /*  */ { type: /*            */ PowerBankType; }
	interface StructurePowerSpawn /* */ { type: /*           */ PowerSpawnType; }
	interface StructureRampart /*    */ { type: /*              */ RampartType; }
	interface StructureSpawn /*      */ { type: /*                */ SpawnType; }
	interface StructureStorage /*    */ { type: /*              */ StorageType; }
	interface StructureTerminal /*   */ { type: /*             */ TerminalType; }
	interface StructureTower /*      */ { type: /*                */ TowerType; }
	//         }
	//     }
	// }
}

// Built-in types :
/*                */ Room.prototype.type = Type.Room;
/*        */ RoomPosition.prototype.type = Type.RoomPosition;

// RoomObject's (room, pos) :
// {
/*               */ Creep.prototype.type = Type.Creep;
/*    */ ConstructionSite.prototype.type = Type.ConstructionSite;
/*                */ Flag.prototype.type = Type.Flag;
/*             */ Mineral.prototype.type = Type.Mineral;
/*            */ Resource.prototype.type = Type.Resource;
/*                */ Ruin.prototype.type = Type.Ruin;
/*              */ Source.prototype.type = Type.Source;
/*           */ Tombstone.prototype.type = Type.Tombstone;

//     Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
//     {
/*  */ StructureContainer.prototype.type = Type.Container;
/*     */ StructurePortal.prototype.type = Type.Portal;
/*       */ StructureRoad.prototype.type = Type.Road;
/*       */ StructureWall.prototype.type = Type.Wall;

//         OwnedStructure (my, owner)
//         {
/* */ StructureController.prototype.type = Type.Controller;
/*  */ StructureExtension.prototype.type = Type.Extension;
/*  */ StructureExtractor.prototype.type = Type.Extractor;
/*    */ StructureFactory.prototype.type = Type.Factory;
/**/ StructureInvaderCore.prototype.type = Type.InvaderCore;
/* */ StructureKeeperLair.prototype.type = Type.KeeperLair;
/*        */ StructureLab.prototype.type = Type.Lab;
/*       */ StructureLink.prototype.type = Type.Link;
/*      */ StructureNuker.prototype.type = Type.Nuker;
/*   */ StructureObserver.prototype.type = Type.Observer;
/*  */ StructurePowerBank.prototype.type = Type.PowerBank;
/* */ StructurePowerSpawn.prototype.type = Type.PowerSpawn;
/*    */ StructureRampart.prototype.type = Type.Rampart;
/*      */ StructureSpawn.prototype.type = Type.Spawn;
/*    */ StructureStorage.prototype.type = Type.Storage;
/*   */ StructureTerminal.prototype.type = Type.Terminal;
/*      */ StructureTower.prototype.type = Type.Tower;
//         }
//     }
// }

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
	interface Room /*        */ { ToString(): string; ts?: string; }
	interface RoomPosition /**/ { ToString(): string; ts?: string; }
	interface RoomObject /*  */ { ToString(): string; }
}

Room.prototype.ToString = function (): string
{
	return this.ts ??= `<a href="https://screeps.com/a/#!/room/shard3/${this.name}">${this.name}</a>`;
};

RoomPosition.prototype.ToString = function (): string
{
	return this.ts ??= `(${this.x}, ${this.y}, <a href="https://screeps.com/a/#!/room/shard3/${this.roomName}">${this.roomName}</a>)`;
};

Store.prototype.ToString = function (this: StoreDefinition): string
{
	const resourceTypes: string[] = Object.keys(this);

	if (resourceTypes.length === 0 || (resourceTypes.length === 1 && resourceTypes[0] === RESOURCE_ENERGY))
	{
		return `[${this.energy}/${this.getCapacity(RESOURCE_ENERGY)}]`;
	}

	return `[ ${JSON.stringify(this)} / ${this.getCapacity(RESOURCE_ENERGY)} ]`;
};

function AppendPropertyString<T>(
	/* inout */ result: string[],
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

RoomObject.prototype.ToString = function (): string
{
	const resultArray: string[] = [];
	AppendPropertyString(resultArray, this, "name");
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

	return `${Type.IsCreep(this) ? c_creepTypeToString[this.GetCreepType()] : c_typeToString[this.type]}: { ${resultArray.join(", ")} }`;
};
