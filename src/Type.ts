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

	// /*               */ type AnyType =
	// 	| /*             */ RoomType
	// 	| /*     */ RoomPositionType
	// 	| /*    */ AnyRoomObjectType;
	//
	// /*     */ type AnyRoomObjectType =
	// 	| /*           */ CreepsType
	// 	| /* */ ConstructionSiteType
	// 	| /*             */ FlagType
	// 	| /*          */ MineralType
	// 	| /*         */ ResourceType
	// 	| /*             */ RuinType
	// 	| /*           */ SourceType
	// 	| /*        */ TombstoneType
	// 	| /*     */ AnyStructureType;

	// /*      */ type AnyStructureType =
	// 	| /*        */ ContainerType
	// 	| /*           */ PortalType
	// 	| /*             */ RoadType
	// 	| /*             */ WallType
	// 	| /**/ AnyOwnedStructureType;
	//
	// /* */ type AnyOwnedStructureType =
	// 	| /*       */ ControllerType
	// 	| /*        */ ExtensionType
	// 	| /*        */ ExtractorType
	// 	| /*          */ FactoryType
	// 	| /*      */ InvaderCoreType
	// 	| /*       */ KeeperLairType
	// 	| /*              */ LabType
	// 	| /*             */ LinkType
	// 	| /*            */ NukerType
	// 	| /*         */ ObserverType
	// 	| /*        */ PowerBankType
	// 	| /*       */ PowerSpawnType
	// 	| /*          */ RampartType
	// 	| /*            */ SpawnType
	// 	| /*          */ StorageType
	// 	| /*         */ TerminalType
	// 	| /*            */ TowerType;

	// type AnyEnergyStoreType =
	// 	| CreepsType
	// 	| RuinType
	// 	| TombstoneType
	// 	| ContainerType
	// 	| ExtensionType
	// 	| FactoryType
	// 	| LabType
	// 	| LinkType
	// 	| NukerType
	// 	| PowerSpawnType
	// 	| SpawnType
	// 	| StorageType
	// 	| TerminalType
	// 	| TowerType;

	type AnyEnergyTakingType =
		// | CreepsType //     Handled by a separate CreepType[]
		| ContainerType
		| ExtensionType
		// | FactoryType //    Add this in if we ever actually make a factory
		// | LabType //        Add this in if we ever actually make a lab
		| LinkType
		// | NukerType //      Add this in if we ever actually make a nuker
		// | PowerSpawnType // Add this in if we ever actually make a power spawn
		| SpawnType
		| StorageType
		// | TerminalType //   Add this in if we ever actually make a terminal
		| TowerType;

	type AnyEnergyGivingType =
		// | CreepsType //     Handled by a separate CreepType[]
		// | ResourceType //   Always present. Commented out because it has no .store unlike the rest
		| RuinType
		| TombstoneType
		| ContainerType
		// | ExtensionType //  Why take energy out of an extension?
		// | FactoryType //    Why take energy out of a factory?
		// | LabType //        Why take energy out of a lab?
		| LinkType
		// | NukerType //      Why take energy out of a nuker?
		// | PowerSpawnType // Why take energy out of a spawn?
		// | SpawnType //      when room.energyAvailable < 300, generates 1 energy per tick
		| StorageType;
		// | TerminalType //   Add this in if we ever do anything with terminals
		// | TowerType //      Why take energy out of a tower?

	type ToInterface<TRoomObjectType extends number> =
		// | (TRoomObjectType extends /*         */ RoomType ? Room /*                */ : never)
		// | (TRoomObjectType extends /* */ RoomPositionType ? RoomPosition /*        */ : never)
		| (TRoomObjectType extends /*          */ CreepsType ? Creep /*               */ : never)
		| (TRoomObjectType extends /**/ ConstructionSiteType ? ConstructionSite /*    */ : never)
		// | (TRoomObjectType extends /*         */ FlagType ? Flag /*                */ : never)
		// | (TRoomObjectType extends /*      */ MineralType ? Mineral /*             */ : never)
		| (TRoomObjectType extends /*        */ ResourceType ? Resource /*            */ : never)
		| (TRoomObjectType extends /*            */ RuinType ? Ruin /*                */ : never)
		| (TRoomObjectType extends /*          */ SourceType ? Source /*              */ : never)
		| (TRoomObjectType extends /*       */ TombstoneType ? Tombstone /*           */ : never)
		| (TRoomObjectType extends /*       */ ContainerType ? StructureContainer /*  */ : never)
		// | (TRoomObjectType extends /*       */ PortalType ? StructurePortal /*     */ : never)
		| (TRoomObjectType extends /*            */ RoadType ? StructureRoad /*       */ : never)
		| (TRoomObjectType extends /*            */ WallType ? StructureWall /*       */ : never)
		| (TRoomObjectType extends /*      */ ControllerType ? StructureController /* */ : never)
		| (TRoomObjectType extends /*       */ ExtensionType ? StructureExtension /*  */ : never)
		// | (TRoomObjectType extends /*    */ ExtractorType ? StructureExtractor /*  */ : never)
		// | (TRoomObjectType extends /*      */ FactoryType ? StructureFactory /*    */ : never)
		// | (TRoomObjectType extends /*  */ InvaderCoreType ? StructureInvaderCore /**/ : never)
		// | (TRoomObjectType extends /*   */ KeeperLairType ? StructureKeeperLair /* */ : never)
		// | (TRoomObjectType extends /*          */ LabType ? StructureLab /*        */ : never)
		| (TRoomObjectType extends /*            */ LinkType ? StructureLink /*       */ : never)
		// | (TRoomObjectType extends /*        */ NukerType ? StructureNuker /*      */ : never)
		// | (TRoomObjectType extends /*     */ ObserverType ? StructureObserver /*   */ : never)
		// | (TRoomObjectType extends /*    */ PowerBankType ? StructurePowerBank /*  */ : never)
		// | (TRoomObjectType extends /*   */ PowerSpawnType ? StructurePowerSpawn /* */ : never)
		// | (TRoomObjectType extends /*      */ RampartType ? StructureRampart /*    */ : never)
		| (TRoomObjectType extends /*           */ SpawnType ? StructureSpawn /*      */ : never)
		| (TRoomObjectType extends /*         */ StorageType ? StructureStorage /*    */ : never)
		// | (TRoomObjectType extends /*     */ TerminalType ? StructureTerminal /*   */ : never)
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

	// public static readonly All /*                                  */  = 0b1111111111111111111111111111111 as const;
	// public static readonly AllRoomObjects /*                       */  = 0b1111111111111111111111111111100 as const;
	public static readonly AllStructures /*                           */  = 0b1111111111111111111110000000000 as const;
	// public static readonly AllOwnedStructures /*                   */  = 0b1111111111111111100000000000000 as const;

	public static readonly BeforeFirstStructure: /*      */ TombstoneType = 0b0000000000000000000001000000000 as const;
	public static readonly LastStructure: /*                 */ TowerType = 0b1000000000000000000000000000000 as const;

	public static readonly SpawnsAndExtensions: SpawnType | ExtensionType = Type.Or(Type.Spawn, Type.Extension);
	public static readonly DecayingEnegrySource /*                     */ = Type.Or(Type.Or(Type.Resource, Type.Ruin), Type.Tombstone);

	public static Or<
		TTypes1 extends number,
		TTypes2 extends number>(
			types1: TTypes1,
			types2: TTypes2): TTypes1 | TTypes2
	{
		return (types1 | types2) as TTypes1 | TTypes2;
	}

	// public static Contains<
	// 	TTypes1 extends number,
	// 	TTypes2 extends number>(
	// 		types1: TTypes1,
	// 		types2: TTypes2): types1 is (TTypes1 & TTypes2)
	// {
	// 	return (types1 & types2) !== 0;
	// }

	public static IsCreep(roomObject: RoomObject): roomObject is Creep
	{
		return roomObject.Type === Type.Creep;
	}

	public static ToString(objectType: number): string
	{
		switch (objectType)
		{
			// Built-in types :
			case Type.Room /*            */: return "Room";
			case Type.RoomPosition /*    */: return "RoomPosition";
			// RoomObject's (room; pos) :
			// {
			case Type.Creep /*           */: return "Creep";
			case Type.ConstructionSite /**/: return "ConstructionSite";
			case Type.Flag /*            */: return "Flag";
			case Type.Mineral /*         */: return "Mineral";
			case Type.Resource /*        */: return "Resource";
			case Type.Ruin /*            */: return "Ruin";
			case Type.Source /*          */: return "Source";
			case Type.Tombstone /*       */: return "Tombstone";
			//     Structure (structureType; hits; hitsMax; destroy; notifyWhenAttacked; isActive)
			//     {
			case Type.Container /*       */: return "Container";
			case Type.Portal /*          */: return "Portal";
			case Type.Road /*            */: return "Road";
			case Type.Wall /*            */: return "Wall";
			//         OwnedStructure (my; owner)
			//         {
			case Type.Controller /*      */: return "Controller";
			case Type.Extension /*       */: return "Extension";
			case Type.Extractor /*       */: return "Extractor";
			case Type.Factory /*         */: return "Factory";
			case Type.InvaderCore /*     */: return "InvaderCore";
			case Type.KeeperLair /*      */: return "KeeperLair";
			case Type.Lab /*             */: return "Lab";
			case Type.Link /*            */: return "Link";
			case Type.Nuker /*           */: return "Nuker";
			case Type.Observer /*        */: return "Observer";
			case Type.PowerBank /*       */: return "PowerBank";
			case Type.PowerSpawn /*      */: return "PowerSpawn";
			case Type.Rampart /*         */: return "Rampart";
			case Type.Spawn /*           */: return "Spawn";
			case Type.Storage /*         */: return "Storage";
			case Type.Terminal /*        */: return "Terminal";
			case Type.Tower /*           */: return "Tower";
			//         }
			//     }
			// }
			default /*                   */: return `0b${objectType?.toString(2) ?? "NULLish"}`;
		}
	}
}

declare global
{
	interface Room /*                */ { Type: /*                 */ RoomType; }
	interface RoomPosition /*        */ { Type: /*         */ RoomPositionType; }

	interface RoomObject /*          */ { Type: /*                   */ number; }
	// {
	interface Creep /*               */ { Type: /*               */ CreepsType; }
	interface ConstructionSite /*    */ { Type: /*     */ ConstructionSiteType; }
	interface Mineral /*             */ { Type: /*              */ MineralType; }
	interface Resource /*            */ { Type: /*             */ ResourceType; }
	interface Ruin /*                */ { Type: /*                 */ RuinType; }
	interface Source /*              */ { Type: /*               */ SourceType; }
	interface Tombstone /*           */ { Type: /*            */ TombstoneType; }

	interface Structure /*           */ { Type: /*                   */ number; }
	//     {
	interface StructureContainer /*  */ { Type: /*            */ ContainerType; }
	interface StructurePortal /*     */ { Type: /*               */ PortalType; }
	interface StructureRoad /*       */ { Type: /*                 */ RoadType; }
	interface StructureWall /*       */ { Type: /*                 */ WallType; }

	interface OwnedStructure /*      */ { Type: /*                   */ number; }
	//         {
	interface StructureController /* */ { Type: /*           */ ControllerType; }
	interface StructureExtension /*  */ { Type: /*            */ ExtensionType; }
	interface StructureExtractor /*  */ { Type: /*            */ ExtractorType; }
	interface StructureFactory /*    */ { Type: /*              */ FactoryType; }
	interface StructureInvaderCore /**/ { Type: /*          */ InvaderCoreType; }
	interface StructureKeeperLair /* */ { Type: /*           */ KeeperLairType; }
	interface StructureLab /*        */ { Type: /*                  */ LabType; }
	interface StructureLink /*       */ { Type: /*                 */ LinkType; }
	interface StructureNuker /*      */ { Type: /*                */ NukerType; }
	interface StructureObserver /*   */ { Type: /*             */ ObserverType; }
	interface StructurePowerBank /*  */ { Type: /*            */ PowerBankType; }
	interface StructurePowerSpawn /* */ { Type: /*           */ PowerSpawnType; }
	interface StructureRampart /*    */ { Type: /*              */ RampartType; }
	interface StructureSpawn /*      */ { Type: /*                */ SpawnType; }
	interface StructureStorage /*    */ { Type: /*              */ StorageType; }
	interface StructureTerminal /*   */ { Type: /*             */ TerminalType; }
	interface StructureTower /*      */ { Type: /*                */ TowerType; }
	//         }
	//     }
	// }
}

// Built-in types :
/*                */ Room.prototype.Type = Type.Room;
/*        */ RoomPosition.prototype.Type = Type.RoomPosition;

// RoomObject's (room, pos) :
// {
/*               */ Creep.prototype.Type = Type.Creep;
/*    */ ConstructionSite.prototype.Type = Type.ConstructionSite;
/*                */ Flag.prototype.Type = Type.Flag;
/*             */ Mineral.prototype.Type = Type.Mineral;
/*            */ Resource.prototype.Type = Type.Resource;
/*                */ Ruin.prototype.Type = Type.Ruin;
/*              */ Source.prototype.Type = Type.Source;
/*           */ Tombstone.prototype.Type = Type.Tombstone;

//     Structure (structureType, hits, hitsMax, destroy, notifyWhenAttacked, isActive)
//     {
/*  */ StructureContainer.prototype.Type = Type.Container;
/*     */ StructurePortal.prototype.Type = Type.Portal;
/*       */ StructureRoad.prototype.Type = Type.Road;
/*       */ StructureWall.prototype.Type = Type.Wall;

//         OwnedStructure (my, owner)
//         {
/* */ StructureController.prototype.Type = Type.Controller;
/*  */ StructureExtension.prototype.Type = Type.Extension;
/*  */ StructureExtractor.prototype.Type = Type.Extractor;
/*    */ StructureFactory.prototype.Type = Type.Factory;
/**/ StructureInvaderCore.prototype.Type = Type.InvaderCore;
/* */ StructureKeeperLair.prototype.Type = Type.KeeperLair;
/*        */ StructureLab.prototype.Type = Type.Lab;
/*       */ StructureLink.prototype.Type = Type.Link;
/*      */ StructureNuker.prototype.Type = Type.Nuker;
/*   */ StructureObserver.prototype.Type = Type.Observer;
/*  */ StructurePowerBank.prototype.Type = Type.PowerBank;
/* */ StructurePowerSpawn.prototype.Type = Type.PowerSpawn;
/*    */ StructureRampart.prototype.Type = Type.Rampart;
/*      */ StructureSpawn.prototype.Type = Type.Spawn;
/*    */ StructureStorage.prototype.Type = Type.Storage;
/*   */ StructureTerminal.prototype.Type = Type.Terminal;
/*      */ StructureTower.prototype.Type = Type.Tower;
//         }
//     }
// }
