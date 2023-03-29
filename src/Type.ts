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
	public static readonly Room: /*                           */ RoomType = 0b0000000000000000000000000000001 as const;
	public static readonly RoomPosition: /*           */ RoomPositionType = 0b0000000000000000000000000000010 as const;

	// RoomObject's (room, pos) :
	// {
	public static readonly Creep: /*                        */ CreepsType = 0b0000000000000000000000000000100 as const;
	public static readonly ConstructionSite: /*   */ ConstructionSiteType = 0b0000000000000000000000000001000 as const;
	public static readonly Flag: /*                           */ FlagType = 0b0000000000000000000000000010000 as const;
	public static readonly Mineral: /*                     */ MineralType = 0b0000000000000000000000000100000 as const;
	public static readonly Resource: /*                   */ ResourceType = 0b0000000000000000000000001000000 as const;
	public static readonly Ruin: /*                           */ RuinType = 0b0000000000000000000000010000000 as const;
	public static readonly Source: /*                       */ SourceType = 0b0000000000000000000000100000000 as const;
	public static readonly Tombstone: /*                 */ TombstoneType = 0b0000000000000000000001000000000 as const;

	//     Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
	//     {
	public static readonly Container: /*                 */ ContainerType = 0b0000000000000000000010000000000 as const;
	public static readonly Portal: /*                       */ PortalType = 0b0000000000000000000100000000000 as const;
	public static readonly Road: /*                           */ RoadType = 0b0000000000000000001000000000000 as const;
	public static readonly Wall: /*                           */ WallType = 0b0000000000000000010000000000000 as const;

	//         OwnedStructure (my, owner)
	//         {
	public static readonly Controller: /*               */ ControllerType = 0b0000000000000000100000000000000 as const;
	public static readonly Extension: /*                 */ ExtensionType = 0b0000000000000001000000000000000 as const;
	public static readonly Extractor: /*                 */ ExtractorType = 0b0000000000000010000000000000000 as const;
	public static readonly Factory: /*                     */ FactoryType = 0b0000000000000100000000000000000 as const;
	public static readonly InvaderCore: /*             */ InvaderCoreType = 0b0000000000001000000000000000000 as const;
	public static readonly KeeperLair: /*               */ KeeperLairType = 0b0000000000010000000000000000000 as const;
	public static readonly Lab: /*                             */ LabType = 0b0000000000100000000000000000000 as const;
	public static readonly Link: /*                           */ LinkType = 0b0000000001000000000000000000000 as const;
	public static readonly Nuker: /*                         */ NukerType = 0b0000000010000000000000000000000 as const;
	public static readonly Observer: /*                   */ ObserverType = 0b0000000100000000000000000000000 as const;
	public static readonly PowerBank: /*                 */ PowerBankType = 0b0000001000000000000000000000000 as const;
	public static readonly PowerSpawn: /*               */ PowerSpawnType = 0b0000010000000000000000000000000 as const;
	public static readonly Rampart: /*                     */ RampartType = 0b0000100000000000000000000000000 as const;
	public static readonly Spawn: /*                         */ SpawnType = 0b0001000000000000000000000000000 as const;
	public static readonly Storage: /*                     */ StorageType = 0b0010000000000000000000000000000 as const;
	public static readonly Terminal: /*                   */ TerminalType = 0b0100000000000000000000000000000 as const;
	public static readonly Tower: /*                         */ TowerType = 0b1000000000000000000000000000000 as const;
	//         }
	//     }
	// }

	public static readonly All: /*                             */ AnyType = 0b1111111111111111111111111111111 as AnyType;
	public static readonly AllRoomObjects: /*        */ AnyRoomObjectType = 0b1111111111111111111111111111100 as AnyRoomObjectType;
	public static readonly AllStructures: /*          */ AnyStructureType = 0b1111111111111111111110000000000 as AnyStructureType;
	public static readonly AllOwnedStructures: /**/ AnyOwnedStructureType = 0b1111111111111111100000000000000 as AnyOwnedStructureType;

	public static readonly FirstStructure: /*            */ ContainerType = 0b0000000000000000000010000000000 as const;
	public static readonly LastStructure: /*                 */ TowerType = 0b1000000000000000000000000000000 as const;

	public static readonly SpawnsAndExtensions: SpawnType | ExtensionType = Type.Or(Type.Spawn, Type.Extension);

	public static Or<
		T1 extends AnyType,
		T2 extends AnyType>(
			value1: T1,
			value2: T2): T1 | T2
	{
		return (value1 | value2) as T1 | T2;
	}

	public static Contains<
		TTypes1 extends AnyType,
		TTypes2 extends AnyType>(
			types1: TTypes1,
			types2: TTypes2): types1 is (TTypes1 & TTypes2)
	{
		return (types1 & types2) !== 0;
	}

	public static IsCreep(roomObject: RoomObject): roomObject is Creep
	{
		return roomObject.type === Type.Creep;
	}
}

const c_typeToString =
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
} as const;

const c_creepTypeToString =
{
	[CreepType.Harvester /**/]: "Harvester",
	[CreepType.Runner /*   */]: "Runner",
	[CreepType.Builder /*  */]: "Builder",
	[CreepType.Upgrader /* */]: "Upgrader",
	[CreepType.Miner /*    */]: "Miner",
	[CreepType.Claimer /*  */]: "Claimer",
	[CreepType.Attacker /* */]: "Attacker",
	[CreepType.Enemy /*    */]: "Enemy",
} as const;

declare global
{
	interface Room /*                */ { readonly type: /*                 */ RoomType; }
	interface RoomPosition /*        */ { readonly type: /*         */ RoomPositionType; }

	interface RoomObject /*          */ { readonly type: /*        */ AnyRoomObjectType; }
	// {
	interface Creep /*               */ { readonly type: /*               */ CreepsType; }
	interface ConstructionSite /*    */ { readonly type: /*     */ ConstructionSiteType; }
	interface Mineral /*             */ { readonly type: /*              */ MineralType; }
	interface Resource /*            */ { readonly type: /*             */ ResourceType; }
	interface Ruin /*                */ { readonly type: /*                 */ RuinType; }
	interface Source /*              */ { readonly type: /*               */ SourceType; }
	interface Tombstone /*           */ { readonly type: /*            */ TombstoneType; }

	interface Structure /*           */ { readonly type: /*         */ AnyStructureType; }
	//     {
	interface StructureContainer /*  */ { readonly type: /*            */ ContainerType; }
	interface StructurePortal /*     */ { readonly type: /*               */ PortalType; }
	interface StructureRoad /*       */ { readonly type: /*                 */ RoadType; }
	interface StructureWall /*       */ { readonly type: /*                 */ WallType; }

	interface OwnedStructure /*      */ { readonly type: /*    */ AnyOwnedStructureType; }
	//         {
	interface StructureController /* */ { readonly type: /*           */ ControllerType; }
	interface StructureExtension /*  */ { readonly type: /*            */ ExtensionType; }
	interface StructureExtractor /*  */ { readonly type: /*            */ ExtractorType; }
	interface StructureFactory /*    */ { readonly type: /*              */ FactoryType; }
	interface StructureInvaderCore /**/ { readonly type: /*          */ InvaderCoreType; }
	interface StructureKeeperLair /* */ { readonly type: /*           */ KeeperLairType; }
	interface StructureLab /*        */ { readonly type: /*                  */ LabType; }
	interface StructureLink /*       */ { readonly type: /*                 */ LinkType; }
	interface StructureNuker /*      */ { readonly type: /*                */ NukerType; }
	interface StructureObserver /*   */ { readonly type: /*             */ ObserverType; }
	interface StructurePowerBank /*  */ { readonly type: /*            */ PowerBankType; }
	interface StructurePowerSpawn /* */ { readonly type: /*           */ PowerSpawnType; }
	interface StructureRampart /*    */ { readonly type: /*              */ RampartType; }
	interface StructureSpawn /*      */ { readonly type: /*                */ SpawnType; }
	interface StructureStorage /*    */ { readonly type: /*              */ StorageType; }
	interface StructureTerminal /*   */ { readonly type: /*             */ TerminalType; }
	interface StructureTower /*      */ { readonly type: /*                */ TowerType; }
	//         }
	//     }
	// }
}

// Built-in types :
/*                */ Room.prototype.type = Type.Room as const;
/*        */ RoomPosition.prototype.type = Type.RoomPosition as const;

// RoomObject's (room, pos) :
// {
/*               */ Creep.prototype.type = Type.Creep as const;
/*    */ ConstructionSite.prototype.type = Type.ConstructionSite as const;
/*                */ Flag.prototype.type = Type.Flag as const;
/*             */ Mineral.prototype.type = Type.Mineral as const;
/*            */ Resource.prototype.type = Type.Resource as const;
/*                */ Ruin.prototype.type = Type.Ruin as const;
/*              */ Source.prototype.type = Type.Source as const;
/*           */ Tombstone.prototype.type = Type.Tombstone as const;

//     Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
//     {
/*  */ StructureContainer.prototype.type = Type.Container as const;
/*     */ StructurePortal.prototype.type = Type.Portal as const;
/*       */ StructureRoad.prototype.type = Type.Road as const;
/*       */ StructureWall.prototype.type = Type.Wall as const;

//         OwnedStructure (my, owner)
//         {
/* */ StructureController.prototype.type = Type.Controller as const;
/*  */ StructureExtension.prototype.type = Type.Extension as const;
/*  */ StructureExtractor.prototype.type = Type.Extractor as const;
/*    */ StructureFactory.prototype.type = Type.Factory as const;
/**/ StructureInvaderCore.prototype.type = Type.InvaderCore as const;
/* */ StructureKeeperLair.prototype.type = Type.KeeperLair as const;
/*        */ StructureLab.prototype.type = Type.Lab as const;
/*       */ StructureLink.prototype.type = Type.Link as const;
/*      */ StructureNuker.prototype.type = Type.Nuker as const;
/*   */ StructureObserver.prototype.type = Type.Observer as const;
/*  */ StructurePowerBank.prototype.type = Type.PowerBank as const;
/* */ StructurePowerSpawn.prototype.type = Type.PowerSpawn as const;
/*    */ StructureRampart.prototype.type = Type.Rampart as const;
/*      */ StructureSpawn.prototype.type = Type.Spawn as const;
/*    */ StructureStorage.prototype.type = Type.Storage as const;
/*   */ StructureTerminal.prototype.type = Type.Terminal as const;
/*      */ StructureTower.prototype.type = Type.Tower as const;
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
	interface Room /*        */ { readonly ToString(): string; ts?: string; }
	interface RoomPosition /**/ { readonly ToString(): string; ts?: string; }
	interface RoomObject /*  */ { readonly ToString(): string; }
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
	const resourceTypes: readonly string[] = Object.keys(this);

	if (resourceTypes.length === 0 || (resourceTypes.length === 1 && resourceTypes[0] === RESOURCE_ENERGY))
	{
		return `[${this.energy}/${this.getCapacity(RESOURCE_ENERGY)}]`;
	}

	return `[ ${JSON.stringify(this)} / ${this.getCapacity(RESOURCE_ENERGY)} ]`;
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

RoomObject.prototype.ToString = function (): string
{
	const resultArray: readonly string[] = [];
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
