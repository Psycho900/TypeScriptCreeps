import { } from "./Objects";
import { Type, Types } from "./Type";
import { Collection } from "./Collection";
import { CreepTypes } from "./CreepType";
import { Log } from "./Log";

type RoomObjectCache /*    */ = Map<number, readonly RoomObject[]>;
type CreepCache /*         */ = Map<number, readonly Creep[]>;

declare global
{
	interface Room
	{
		cache: RoomObjectCache;
		creepCache: CreepCache;
	}
}

// Should be safe for these to live forever:
const s_roomNameToSources /*    */: Map<string, /* */ readonly Source[]> = new Map<string, /* */ readonly Source[]>();
const s_roomNameToMinerals /*   */: Map<string, /**/ readonly Mineral[]> = new Map<string, /**/ readonly Mineral[]>();
const s_roomNameToRoomCenters /**/: Map<string, /*      */ RoomPosition> = new Map<string, /*      */ RoomPosition>();

// Should reset on each tick:
let s_mySpawnedCreepCache: CreepCache;

export abstract /* static */ class Find
{
	// Should reset on each tick:
	public static s_mySpawns: /*              */ readonly StructureSpawn[] = Object.values(Game.spawns);
	public static s_myConstructionSites: /* */ readonly ConstructionSite[] = Object.values(Game.constructionSites);
	public static s_mySpawningAndSpawnedCreeps: /**/ readonly AnyMyCreep[] = Object.values(Game.creeps);
	public static s_visibleRooms: /*                    */ readonly Room[] = Object.values(Game.rooms);

	public static EnsureInitializedForBeginningOfTick(): void // reinitializeSpawnsFunction: (spawns: readonly StructureSpawn[]) => readonly StructureSpawn[]): void
	{
		// See "Should reset on each tick" comment near top of file:
		Find.s_mySpawns /*             */ = Object.values(Game.spawns); // reinitializeSpawnsFunction(Object.values(Game.spawns));
		Find.s_myConstructionSites /*  */ = Object.values(Game.constructionSites);
		Find.s_mySpawningAndSpawnedCreeps = CreepTypes.EnsureMyCreepsAreInitializedForBeginningOfTick(Object.values(Game.creeps));
		Find.s_visibleRooms /*         */ = Object.values(Game.rooms);

		// {
		// 	s_visibleRooms.length = 0;
		// 	for (const roomName in Game.rooms)
		// 	{
		// 		// if (roomName !== "W29S25")
		// 		{
		// 			s_visibleRooms.push(Game.rooms[roomName]);
		// 		}
		// 	}
		// }

		for (const room of Find.s_visibleRooms)
		{
			const roomName: string = room.name;

			// Clear whatever existing caches we had from the previous tick
			const creepCache: CreepCache = (room.creepCache ||= new Map<number, readonly Creep[]>());
			creepCache.clear();
			creepCache.set(CreepTypes.All, CreepTypes.EnsureEnemyCreepsAreInitializedForBeginningOfTick(room.find(FIND_CREEPS)));

			const roomCache: RoomObjectCache = (room.cache ||= new Map<number, readonly RoomObject[]>());
			roomCache.clear();
			roomCache
				// .set(Type.Creep/**/, Find.Creeps(room, CreepType.AllMine)) // MUST be after "room.find(FIND_CREEPS)" above
				.set(Type.Mineral /**/, s_roomNameToMinerals.get(roomName) ||
					Find.SetAndGet(s_roomNameToMinerals, roomName, room.find(FIND_MINERALS)))
				.set(Type.Source /* */, s_roomNameToSources.get(roomName) ||
					Find.SetAndGet(s_roomNameToSources, roomName, room.find(FIND_SOURCES)));
		}

		if (Find.AreAnyCreepsSpawning(Find.s_mySpawningAndSpawnedCreeps) !== false)
		{
			const mySpawnedCreeps: MyCreep[] = [];

			for (const creep of Find.s_mySpawningAndSpawnedCreeps)
			{
				if (creep.spawning === false)
				{
					mySpawnedCreeps.push(creep);
				}
			}

			s_mySpawnedCreepCache = new Map<number, readonly MyCreep[]>()
				.set(CreepTypes.All, mySpawnedCreeps);
			// .set(CreepType.AllMine, mySpawnedCreeps);
		}
		else if (Find.s_visibleRooms.length === 1)
		{
			s_mySpawnedCreepCache = Find.s_visibleRooms[0].creepCache;
		}
		else
		{
			s_mySpawnedCreepCache = new Map<number, readonly MyCreep[]>()
				.set(CreepTypes.All, Find.s_mySpawningAndSpawnedCreeps);
			// .set(CreepType.AllMine, s_mySpawningAndSpawnedCreeps);
		}
	}

	private static AreAnyCreepsSpawning(creeps: readonly MyCreep[]): boolean
	{
		for (const creep of creeps)
		{
			if (creep.spawning !== false)
			{
				return true;
			}
		}

		return false;
	}

	public static MySpawnedCreeps<TCreepTypes extends number>(
		creepTypes: TCreepTypes): readonly ToMyCreepInterface<TCreepTypes>[]
	{
		type TCreeps = readonly ToMyCreepInterface<TCreepTypes>[];
		return s_mySpawnedCreepCache.get(creepTypes) as TCreeps | undefined ||
			Find.SetAndGet(s_mySpawnedCreepCache, creepTypes, Find.GenerateCreepArray(s_mySpawnedCreepCache.get(CreepTypes.All)!, creepTypes)) as TCreeps;
	}

	public static Center(roomName: string): RoomPosition
	{
		return s_roomNameToRoomCenters.get(roomName) ||
			Find.SetAndGet(s_roomNameToRoomCenters, roomName, new RoomPosition(25, 25, roomName));
	}

	public static MyObjects<TRoomObjectTypes extends number>(
		room: Room,
		types: TRoomObjectTypes): readonly ToInterface<TRoomObjectTypes>[]
	{
		type TRoomObjects = readonly ToInterface<TRoomObjectTypes>[];
		return room.cache
			? room.cache.get(types) as TRoomObjects | undefined || Find.SetAndGet(room.cache, types, Find.GenerateMyRoomObjectsOfTypeArray(room, types)) as TRoomObjects
			: Collection.c_empty;
	}

	public static Creeps<TCreepTypes extends number>(
		room: Room,
		creepTypes: TCreepTypes): readonly ToCreepInterface<TCreepTypes>[]
	{
		type TCreeps = readonly ToCreepInterface<TCreepTypes>[];
		const creepCache: CreepCache = room.creepCache;
		return creepCache.get(creepTypes) as TCreeps | undefined ||
			Find.SetAndGet(creepCache, creepTypes, Find.GenerateCreepArray(creepCache.get(CreepTypes.All)!, creepTypes)) as TCreeps;
	}

	public static Closest<TRoomObject extends RoomObject>(
		roomPosition: RoomPosition,
		elements: readonly TRoomObject[]): TRoomObject | undefined
	{
		const elementsLength: number = elements.length;
		let bestElement: TRoomObject | undefined = elements[0];

		if (elementsLength > 1)
		{
			let closestDistance: number = Find.Distance(roomPosition, bestElement.pos);

			for (let i: number = 1; i < elementsLength; ++i)
			{
				const currentElement: TRoomObject = elements[i];
				const currentDistance: number = Find.Distance(roomPosition, currentElement.pos);

				if (currentDistance < closestDistance) // Take the 1st one with the smallest distance
				{
					bestElement = currentElement;
					closestDistance = currentDistance;
				}
			}
		}

		return bestElement;
	}

	// public static ClosestPair<
	// 	TRoomObject1 extends RoomObject,
	// 	TRoomObject2 extends RoomObject>(
	// 		elements1: readonly TRoomObject1[],
	// 		elements2: readonly TRoomObject2[]): readonly [TRoomObject1, TRoomObject2] | null
	// {
	// 	const elements1Length: number = elements1.length;
	// 	const elements2Length: number = elements2.length;
	//
	// 	if (elements1Length <= 0 || elements2Length <= 0)
	// 	{
	// 		return null;
	// 	}
	//
	// 	let bestElement1: TRoomObject1 | undefined;
	// 	let bestElement2: TRoomObject2 | undefined;
	// 	let smallestDistance: number | undefined;
	//
	// 	for (const element1 of elements1)
	// 	{
	// 		const element1Pos = element1.pos;
	//
	// 		for (const element2 of elements2)
	// 		{
	// 			const currentDistance: number = Find.Distance(element1Pos, element2.pos);
	//
	// 			if (currentDistance >= smallestDistance!) // All comparisons with undefined return `false`
	// 			{
	// 				continue;
	// 			}
	//
	// 			bestElement1 = element1;
	// 			bestElement2 = element2;
	// 			smallestDistance = currentDistance;
	// 		}
	// 	}
	//
	// 	return [bestElement1!, bestElement2!];
	// }

	public static IsSameRoomAndWithinRange(from: RoomPosition, to: RoomPosition, range: number): boolean
	{
		return Math.abs(to.x - from.x) <= range
			&& Math.abs(to.y - from.y) <= range
			&& to.roomName === from.roomName;
	}

	public static Distance(from: RoomPosition, to: RoomPosition): number
	{
		let fromX: number = from.x;
		let fromY: number = from.y;
		let toX: number = to.x;
		let toY: number = to.y;

		const fromRoomName: string = from.roomName;
		const toRoomName: string = to.roomName;

		if (fromRoomName !== toRoomName)
		{
			let characterIndex: number;
			let magnitude: number;
			let char: number;

			// toRoomName adjustments
			magnitude = toRoomName.charCodeAt(characterIndex = toRoomName.length - 1) - 0x30; // '0'
			if ((char = toRoomName.charCodeAt(--characterIndex)) <= 0x39) // '9'
			{
				magnitude += 10 * (char - 0x30); // '0'
				char = toRoomName.charCodeAt(--characterIndex);
			}
			toY += (char === 0x4E /* 'N' */ ? -50 * magnitude : 50 * magnitude + 50); // Origin is in the upper-left

			magnitude = toRoomName.charCodeAt(--characterIndex) - 0x30; // '0'
			if ((char = toRoomName.charCodeAt(--characterIndex)) <= 0x39) // '9'
			{
				magnitude += 10 * (char - 0x30); // '0'
				char = toRoomName.charCodeAt(0);
			}
			toX += (char === 0x57 /* 'W' */ ? -50 * magnitude : 50 * magnitude + 50); // Origin is in the upper-left

			// fromRoomName adjustments
			magnitude = fromRoomName.charCodeAt(characterIndex = fromRoomName.length - 1) - 0x30; // '0'
			if ((char = fromRoomName.charCodeAt(--characterIndex)) <= 0x39) // '9'
			{
				magnitude += 10 * (char - 0x30); // '0'
				char = fromRoomName.charCodeAt(--characterIndex);
			}
			fromY += (char === 0x4E /* 'N' */ ? -50 * magnitude : 50 * magnitude + 50); // Origin is in the upper-left

			magnitude = fromRoomName.charCodeAt(--characterIndex) - 0x30; // '0'
			if ((char = fromRoomName.charCodeAt(--characterIndex)) <= 0x39) // '9'
			{
				magnitude += 10 * (char - 0x30); // '0'
				char = fromRoomName.charCodeAt(0);
			}
			fromX += (char === 0x57 /* 'W' */ ? -50 * magnitude : 50 * magnitude + 50); // Origin is in the upper-left
		}

		return Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
	}

	public static DirectionTo(from: RoomPosition, to: RoomPosition): DirectionConstant
	{
		if ((Game.time & 3) === 0)
		{
			return from.getDirectionTo(to);
		}

		let deltaX: number;
		let deltaY: number;
		const slope: number = (deltaY = to.y - from.y) / (deltaX = to.x - from.x);

		return slope === 1
			? (deltaX > 0 ? BOTTOM_RIGHT : TOP_LEFT)
			: slope === -1
				? (deltaX > 0 ? TOP_RIGHT : BOTTOM_LEFT)
				: slope > -1 && slope < 1
					? (deltaX > 0 ? RIGHT : LEFT)
					: (deltaY > 0 ? BOTTOM : TOP);
	}

	private static GenerateMyRoomObjectsOfTypeArray(room: Room, roomObjectTypesToInclude: number): readonly RoomObject[]
	{
		let lastRoomObjectsOfTypes: readonly RoomObject[] | undefined;
		let roomObjectsOfTypes: RoomObject[] | undefined;
		let roomObjectsToAdd: readonly RoomObject[];

		const cache: RoomObjectCache = room.cache;
		const structureTypes: number = roomObjectTypesToInclude & Type.AllStructures;

		if (structureTypes !== 0)
		{
			if (cache.has(Type.AllStructures) === false)
			{
				cache.set(Type.AllStructures, Find.CacheEachNonEnemyStructureType(cache, room.find(FIND_STRUCTURES)));
			}

			// This should succeed for AllStructures OR if requesting a single structure type OR anything else that happens to already be cached.
			let structuresToAdd: readonly RoomObject[] | undefined;
			if ((structuresToAdd = cache.get(structureTypes)) === undefined)
			{
				for (let structureType: number = Type.LastStructure; structureType !== Type.BeforeFirstStructure; structureType >>= 1) // Backwards so that spawning a new creep uses energy from all spawns THEN extensions
				{
					if ((roomObjectTypesToInclude & structureType) !== 0 &&
						(roomObjectsToAdd = cache.get(structureType)!).length !== 0)
					{
						if (lastRoomObjectsOfTypes !== undefined)
						{
							(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
						}

						lastRoomObjectsOfTypes = roomObjectsToAdd;
					}
				}
			}
			else if (structuresToAdd.length !== 0)
			{
				if (lastRoomObjectsOfTypes !== undefined)
				{
					(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
				}

				lastRoomObjectsOfTypes = structuresToAdd;
			}
		}

		if ((roomObjectTypesToInclude & Type.Creep) !== 0) // &&
		// (roomObjectsToAdd = cache.get(Type.Creep)!).length !== 0)
		{
			Log.Error("Apparently we ask for Creeps this way now? Uncomment nearby code AND the commented logic in Find.Reinitialize*()", ERR_INVALID_ARGS, `roomObjectTypesToInclude: ${Types.ToString(roomObjectTypesToInclude)}`);

			// if (lastRoomObjectsOfTypes !== undefined)
			// {
			// 	(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			// }
			//
			// lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.ConstructionSite) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.ConstructionSite) ||
				Find.SetAndGet(cache, Type.ConstructionSite, room.find(FIND_MY_CONSTRUCTION_SITES))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== undefined)
			{
				(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Flag) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Flag) ||
				Find.SetAndGet(cache, Type.Flag, room.find(FIND_FLAGS))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== undefined)
			{
				(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Mineral) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Mineral)!).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== undefined)
			{
				(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Resource) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Resource) ||
				Find.SetAndGet(cache, Type.Resource, Find.SetEnergyGiverFieldsFromResource(room.find(FIND_DROPPED_RESOURCES)))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== undefined)
			{
				(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Ruin) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Ruin) ||
				Find.SetAndGet(cache, Type.Ruin, Find.SetEnergyGiverFieldsFromStore(room.find(FIND_RUINS)))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== undefined)
			{
				(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Source) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Source)!).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== undefined)
			{
				(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Tombstone) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Tombstone) ||
				Find.SetAndGet(cache, Type.Tombstone, Find.SetEnergyGiverFieldsFromStore(room.find(FIND_TOMBSTONES)))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== undefined)
			{
				(roomObjectsOfTypes ||= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		return roomObjectsOfTypes !== undefined
			? (roomObjectsOfTypes.push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes!), roomObjectsOfTypes)
			: lastRoomObjectsOfTypes !== undefined
				? lastRoomObjectsOfTypes
				: Collection.c_empty;
	}

	private static CacheEachNonEnemyStructureType(
		cache: RoomObjectCache,
		allStructures: Structure[]): readonly Structure[]
	{
		let allNonEnemyStructures: Structure[] | undefined;
		const allStructuresLength = allStructures.length;

		for (let index = 0; index < allStructuresLength; ++index)
		{
			const structure: Structure = allStructures[index];

			// @ts-expect-error: Intentional Reflection to collect all non-enemy structures
			const store: StoreDefinition | undefined = structure.store as StoreDefinition | undefined;
			if (store !== undefined)
			{
				(structure as EnergyGiver & Structure).EnergyLeftToGive = store.energy;
				(structure as EnergyTaker & Structure).EnergyLeftToTake = store.getFreeCapacity("energy");
			}

			// @ts-expect-error: Intentional Reflection to collect all non-enemy structures
			if (structure.my !== false)
			{
				if (allNonEnemyStructures !== undefined)
				{
					allNonEnemyStructures.push(structure);
				}

				const structuresOfType: Structure[] | undefined = cache.get(structure.Type) as Structure[] | undefined;
				if (structuresOfType === undefined)
				{
					cache.set(structure.Type, [structure]);
				}
				else
				{
					structuresOfType.push(structure);
				}
			}
			else if (allNonEnemyStructures === undefined)
			{
				allNonEnemyStructures = [];

				for (let index2 = 0; index2 < index; ++index2)
				{
					allNonEnemyStructures.push(allStructures[index2]);
				}
			}
		}

		for (let structureType: number = Type.LastStructure; structureType !== Type.BeforeFirstStructure; structureType >>= 1)
		{
			if (cache.has(structureType) === false)
			{
				cache.set(structureType, Collection.c_empty);
			}
		}

		return allNonEnemyStructures !== undefined ? allNonEnemyStructures : allStructures;
	}

	private static GenerateCreepArray(
		allCreeps: readonly Creep[],
		creepTypes: number): readonly Creep[]
	{
		let creepsOfType: Creep[] | undefined;

		for (const creep of allCreeps)
		{
			if (creep.IsAny(creepTypes) !== false)
			{
				if (creepsOfType === undefined)
				{
					creepsOfType = [creep];
				}
				else
				{
					creepsOfType.push(creep);
				}
			}
		}

		return creepsOfType || Collection.c_empty;
	}

	private static SetAndGet<TKey, TValue>(map: Map<TKey, TValue>, key: TKey, value: TValue): TValue
	{
		map.set(key, value);
		return value;
	}

	private static SetEnergyGiverFieldsFromResource(resources: readonly Resource[]): readonly Resource[]
	{
		for (const resource of resources)
		{
			resource.EnergyLeftToGive = resource.resourceType === "energy" ? resource.amount : 0;
		}

		return resources;
	}

	private static SetEnergyGiverFieldsFromStore(energyGivers: readonly (Ruin | Tombstone)[]): readonly (Ruin | Tombstone)[]
	{
		for (const energyGiver of energyGivers)
		{
			energyGiver.EnergyLeftToGive = energyGiver.store.energy;
		}

		return energyGivers;
	}
}

// Log.Info(`[${Game.time}] ${s_mySpawns.length} spawns (last is ${Collection.Last(s_mySpawns)?.ToString()}). ${s_visibleRooms.length} rooms (last is ${Collection.Last(s_visibleRooms)?.ToString()})`);
