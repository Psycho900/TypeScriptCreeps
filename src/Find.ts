import { } from "./Objects";
import { Collection } from "./Collection";
import { CreepType } from "./CreepType";
import { Log } from "./Log";
import { Type } from "./Type";

// Should be safe for these to live forever:
const s_roomNameToSources /*    */: Map<string, /* */ readonly Source[]> = new Map<string, /* */ readonly Source[]>();
const s_roomNameToMinerals /*   */: Map<string, /**/ readonly Mineral[]> = new Map<string, /**/ readonly Mineral[]>();
const s_roomNameToRoomCenters /**/: Map<string, /*      */ RoomPosition> = new Map<string, /*      */ RoomPosition>();

// Should reset on each tick:
let s_spawns: /*             */ readonly StructureSpawn[] = Object.values(Game.spawns);
let s_constructionSites: /**/ readonly ConstructionSite[] = Object.values(Game.constructionSites);
let s_spawningAndSpawnedCreeps: /*  */ readonly MyCreep[] = Object.values(Game.creeps);
let s_spawnedCreeps: /*                      */ MyCreep[];
let s_rooms: /*                        */ readonly Room[] = Object.values(Game.rooms);
// let s_globalCache: RoomObjectCache;

type RoomObjectCache = Map<number, readonly RoomObject[]>;
type CreepCache /**/ = Map<number, readonly Creep[]>;

declare global
{
	interface Room
	{
		cache: RoomObjectCache;
		creepsCache: CreepCache;
	}
}

export abstract /* static */ class Find
{
	public static ResetCachedValuesForBeginningOfTick(): void
	{
		// See "Should reset on each tick" comment near top of file:
		s_spawns /*             */ = Object.values(Game.spawns);
		s_constructionSites /*  */ = Object.values(Game.constructionSites);
		s_spawningAndSpawnedCreeps = Object.values(Game.creeps);

		s_spawnedCreeps.length = 0;
		for (const creep of s_spawningAndSpawnedCreeps)
		{
			if (creep.spawning === false)
			{
				s_spawnedCreeps.push(creep);
			}
		}

		for (const room of s_rooms = Object.values(Game.rooms))
		{
			const roomName: string = room.name;

			// Clear whatever existing caches we had from the previous tick
			const creepsCache: CreepCache = (room.creepsCache ??= new Map<number, readonly Creep[]>());
			creepsCache.clear();
			creepsCache.set(CreepType.All, CreepType.ResetCachedValuesForBeginningOfTick(room.find(FIND_CREEPS)));

			const roomCache: RoomObjectCache = (room.cache ??= new Map<number, readonly RoomObject[]>());
			roomCache.clear();
			roomCache
				// .set(Type.Creep/**/, Find.CreepsOfTypes(room, CreepType.AllMine)) // MUST be after "room.find(FIND_CREEPS)" above
				.set(Type.Mineral /**/, s_roomNameToMinerals.get(roomName) ??
					Find.SetAndGet(s_roomNameToMinerals, roomName, room.find(FIND_MINERALS)))
				.set(Type.Source /* */, s_roomNameToSources.get(roomName) ??
					Find.SetAndGet(s_roomNameToSources, roomName, room.find(FIND_SOURCES)));
		}
	}

	public static MySpawnedCreeps(): readonly MyCreep[]
	{
		return s_spawnedCreeps;
	}

	public static MySpawns(): readonly StructureSpawn[]
	{
		return s_spawns;
	}

	public static MyConstructionSites(): readonly ConstructionSite[]
	{
		return s_constructionSites;
	}

	public static VisibleRooms(): readonly Room[]
	{
		return s_rooms;
	}

	public static Center(room: Room): RoomPosition
	{
		return s_roomNameToRoomCenters.get(room.name) ??
			Find.SetAndGet(s_roomNameToRoomCenters, room.name, new RoomPosition(25, 25, room.name));
	}

	public static MyObjects<TRoomObjectTypes extends number>(
		room: Room,
		types: TRoomObjectTypes): readonly ToInterface<TRoomObjectTypes>[]
	{
		return room.cache.get(types) as readonly ToInterface<TRoomObjectTypes>[] | undefined ??
			Find.SetAndGet(room.cache, types, Find.GenerateMyRoomObjectsOfTypeArray(room, types)) as readonly ToInterface<TRoomObjectTypes>[];
	}

	public static MyObjectsInRange<TRoomObjectTypes extends number>(
		roomObject: RoomObject,
		types: TRoomObjectTypes,
		range: number): readonly ToInterface<TRoomObjectTypes>[]
	{
		return Find.GetObjectsInRange(
			Find.MyObjects(roomObject.room!, types),
			roomObject.pos,
			range) as readonly ToInterface<TRoomObjectTypes>[];
	}

	public static CreepsOfTypes<TCreepTypes extends number>(room: Room, creepTypes: TCreepTypes): readonly ToCreepInterface<TCreepTypes>[]
	{
		return room.creepsCache.get(creepTypes) as ToCreepInterface<TCreepTypes>[] | undefined ??
			Find.SetAndGet(room.creepsCache, creepTypes, Find.GenerateCreepsOfTypeArray(room.creepsCache.get(CreepType.All)!, creepTypes)) as ToCreepInterface<TCreepTypes>[];
	}

	public static HighestScoring<TRoomObject extends RoomObject>(
		roomPosition: RoomPosition,
		elements: readonly TRoomObject[],
		scoreFunction: (element: TRoomObject) => number): TRoomObject | undefined
	{
		return Collection.HighestScoringElement2(
			elements,
			scoreFunction,
			(test: TRoomObject): number => -Find.Distance(roomPosition, test.pos));
	}

	public static Closest<TRoomObject extends RoomObject>(
		roomPosition: RoomPosition,
		elements: readonly TRoomObject[]): TRoomObject | undefined
	{
		return Collection.HighestScoringElement(
			elements,
			(test: TRoomObject): number => -Find.Distance(roomPosition, test.pos));
	}

	public static ClosestPair<
		TRoomObject1 extends RoomObject,
		TRoomObject2 extends RoomObject>(
			elements1: readonly TRoomObject1[],
			elements2: readonly TRoomObject2[]): readonly [TRoomObject1, TRoomObject2] | null
	{
		const elements1Length: number = elements1.length;
		const elements2Length: number = elements2.length;

		if (elements1Length <= 0 || elements2Length <= 0)
		{
			return null;
		}

		let bestElement1: TRoomObject1 | undefined;
		let bestElement2: TRoomObject2 | undefined;
		let smallestDistance: number | undefined;

		for (const element1 of elements1)
		{
			const element1Pos = element1.pos;

			for (const element2 of elements2)
			{
				const currentDistance: number = Find.Distance(element1Pos, element2.pos);

				if (currentDistance >= smallestDistance!) // All comparisons with undefined return `false`
				{
					continue;
				}

				bestElement1 = element1;
				bestElement2 = element2;
				smallestDistance = currentDistance;
			}
		}

		return [bestElement1!, bestElement2!];
	}

	public static IsSameRoomAndWithinRange(fromObject: RoomObject, to: RoomPosition, range: number): boolean
	{
		const from: RoomPosition = fromObject.pos;
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

	private static GenerateMyRoomObjectsOfTypeArray(room: Room, roomObjectTypesToInclude: number): readonly RoomObject[]
	{
		let lastRoomObjectsOfTypes: readonly RoomObject[] | null = null;
		let roomObjectsOfTypes: RoomObject[] | null = null;
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
				for (let structureType: number = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
				{
					if ((roomObjectTypesToInclude & structureType) !== 0 &&
						(roomObjectsToAdd = cache.get(structureType)!).length !== 0)
					{
						if (lastRoomObjectsOfTypes !== null)
						{
							(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
						}

						lastRoomObjectsOfTypes = roomObjectsToAdd;
					}
				}
			}
			else if (structuresToAdd.length !== 0)
			{
				if (lastRoomObjectsOfTypes !== null)
				{
					(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
				}

				lastRoomObjectsOfTypes = structuresToAdd;
			}
		}

		if ((roomObjectTypesToInclude & Type.Creep) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Creep)!).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.ConstructionSite) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.ConstructionSite) ??
				Find.SetAndGet(cache, Type.ConstructionSite, room.find(FIND_MY_CONSTRUCTION_SITES))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Flag) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Flag) ??
				Find.SetAndGet(cache, Type.Flag, room.find(FIND_FLAGS))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Mineral) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Mineral)!).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Resource) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Resource) ??
				Find.SetAndGet(cache, Type.Resource, Find.SetEnergyGiverFieldsFromResource(room.find(FIND_DROPPED_RESOURCES)))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Ruin) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Ruin) ??
				Find.SetAndGet(cache, Type.Ruin, Find.SetEnergyGiverFieldsFromStore(room.find(FIND_RUINS)))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Source) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Source)!).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Tombstone) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Tombstone) ??
				Find.SetAndGet(cache, Type.Tombstone, Find.SetEnergyGiverFieldsFromStore(room.find(FIND_TOMBSTONES)))).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		return roomObjectsOfTypes !== null
			? (roomObjectsOfTypes.push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]), roomObjectsOfTypes)
			: lastRoomObjectsOfTypes !== null
				? lastRoomObjectsOfTypes
				: Collection.Empty();
	}

	private static CacheEachNonEnemyStructureType(
		cache: RoomObjectCache,
		allStructures: Structure[]): readonly Structure[]
	{
		let allNonEnemyStructures: Structure[] | null = null;
		const allStructuresLength = allStructures.length;

		for (let index = 0; index < allStructuresLength; ++index)
		{
			const structure: Structure = allStructures[index];

			// @ts-ignore: Intentional Reflection to collect all non-enemy structures
			const store: StoreDefinition | undefined = structure.store as StoreDefinition | undefined;
			if (store !== undefined)
			{
				(structure as EnergyGiver & Structure).EnergyLeftToGive = store.energy;
				(structure as EnergyTaker & Structure).EnergyLeftToTake = store.getFreeCapacity("energy");
			}

			// @ts-ignore: Intentional Reflection to collect all non-enemy structures
			if (structure.my !== false)
			{
				allNonEnemyStructures?.push(structure);
				const structuresOfType: Structure[] | undefined = cache.get(structure.Type) as Structure[] | undefined;
				if (structuresOfType !== undefined)
				{
					structuresOfType.push(structure);
				}
				else
				{
					cache.set(structure.Type, [structure]);
				}
			}
			else if (allNonEnemyStructures === null)
			{
				allNonEnemyStructures = [];

				for (let index2 = 0; index2 < index; ++index2)
				{
					allNonEnemyStructures.push(allStructures[index2]);
				}
			}
		}

		for (let structureType: number = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
		{
			if (cache.has(structureType) === false)
			{
				cache.set(structureType, Collection.Empty());
			}
		}

		return allNonEnemyStructures !== null ? allNonEnemyStructures : allStructures;
	}

	private static GetObjectsInRange(
		roomObjects: readonly RoomObject[],
		position: RoomPosition,
		range: number): readonly RoomObject[]
	{
		if (roomObjects.length <= 0)
		{
			return roomObjects;
		}

		let x: number = position.x;
		let y: number = position.y;
		const minX: number = x - range;
		const maxX: number = x + range;
		const minY: number = y - range;
		const maxY: number = y + range;

		const roomObjectsInRange: RoomObject[] = [];

		for (const testObject of roomObjects)
		{
			const testPosition: RoomPosition = testObject.pos;

			if ((x = testPosition.x) >= minX && x <= maxX &&
				(y = testPosition.y) >= minY && y <= maxY)
			{
				roomObjectsInRange.push(testObject);
			}
		}

		return roomObjectsInRange;
	}

	private static GenerateCreepsOfTypeArray(
		allCreeps: readonly Creep[],
		creepTypes: number): readonly Creep[]
	{
		const creepsOfType: Creep[] = [];

		for (const creep of allCreeps)
		{
			if (creep.IsAny(creepTypes))
			{
				creepsOfType.push(creep);
			}
		}

		return creepsOfType;
	}

	private static SetAndGet<TKey, TValue>(
		map: Map<TKey, TValue>,
		key: TKey,
		value: TValue): TValue
	{
		map.set(key, value);
		return value;
	}

	private static SetEnergyGiverFieldsFromResource(resources: Resource[]): readonly Resource[]
	{
		for (const resource of resources)
		{
			resource.EnergyLeftToGive = resource.resourceType === "energy" ? resource.amount : 0;
		}

		return resources;
	}

	private static SetEnergyGiverFieldsFromStore(energyGivers: (Ruin | Tombstone)[]): readonly (Ruin | Tombstone)[]
	{
		for (const energyGiver of energyGivers)
		{
			energyGiver.EnergyLeftToGive = energyGiver.store.energy;
		}

		return energyGivers;
	}
}

Log.Info(`[${Game.time}] ${s_spawns.length} spawns (last is ${Collection.Last(s_spawns)?.ToString()}). ${s_rooms.length} rooms (last is ${Collection.Last(s_rooms)?.ToString()})`);
