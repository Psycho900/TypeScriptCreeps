import { Collection } from "./Collection";
import { CreepType } from "./CreepType";
import { Log } from "./Log";
import { Type } from "./Type";

// Should be safe for these to live forever:
const s_roomNameToSources /*    */: Map<string, /* */ readonly Source[]> = new Map<string, /* */ readonly Source[]>();
const s_roomNameToMinerals /*   */: Map<string, /**/ readonly Mineral[]> = new Map<string, /**/ readonly Mineral[]>();
const s_roomNameToRoomCenters /**/: Map<string, /*      */ RoomPosition> = new Map<string, /*      */ RoomPosition>();

// Should reset on each tick:
let s_spawns: /**/ readonly StructureSpawn[] = Object.values(Game.spawns);
let s_creeps: /*       */ readonly MyCreep[] = Object.values(Game.creeps);
let s_rooms: /*           */ readonly Room[] = Object.values(Game.rooms);
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
	public static ResetCacheForBeginningOfTick(): void
	{
		// See "Should reset on each tick" comment near top of file:
		s_spawns = Object.values(Game.spawns);
		s_creeps = Object.values(Game.creeps);

		for (const room of s_rooms = Object.values(Game.rooms))
		{
			const roomName: string = room.name;

			// Clear whatever existing caches we had from the previous tick
			const creepsCache: CreepCache = (room.creepsCache ??= new Map<number, readonly Creep[]>());
			creepsCache.clear();
			creepsCache.set(CreepType.All, room.find(FIND_CREEPS));

			const roomCache: RoomObjectCache = (room.cache ??= new Map<number, readonly RoomObject[]>());
			roomCache.clear();
			roomCache
				.set(Type.Creep /*  */, Find.CreepsOfTypes(room, CreepType.AllMine)) // MUST be after "room.find(FIND_CREEPS)" above
				.set(Type.Mineral /**/, Find.GetOrFindGeneric(s_roomNameToMinerals /**/, roomName, room, FIND_MINERALS))
				.set(Type.Source /* */, Find.GetOrFindGeneric(s_roomNameToSources /* */, roomName, room, FIND_SOURCES));
		}
	}

	public static VisibleRooms(): readonly Room[]
	{
		return s_rooms;
	}

	public static MySpawns(): readonly StructureSpawn[]
	{
		return s_spawns;
	}

	public static MyCreeps(): readonly MyCreep[]
	{
		return s_creeps;
	}

	public static Center(room: Room): RoomPosition
	{
		let result: RoomPosition;
		return s_roomNameToRoomCenters.get(room.name)
			?? (s_roomNameToRoomCenters.set(room.name, result = new RoomPosition(25, 25, room.name)), result);
	}

	public static MyObjects<TRoomObjectTypes extends number>(
		room: Room,
		types: TRoomObjectTypes): readonly ToInterface<TRoomObjectTypes>[]
	{
		return Find.GetOrAdd(room.cache, types, () => Find.GenerateMyRoomObjectsOfTypeArray(room, types)) as readonly ToInterface<TRoomObjectTypes>[];
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
		let result: readonly ToCreepInterface<TCreepTypes>[];
		return room.creepsCache.get(creepTypes) as ToCreepInterface<TCreepTypes>[]
			?? (room.creepsCache.set(creepTypes, result = Find.GenerateCreepsOfTypeArray(room.creepsCache.get(CreepType.All)!, creepTypes) as ToCreepInterface<TCreepTypes>[]), result);
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
			Find.GetOrAdd(cache, Type.AllStructures, () => Find.CacheEachStructureType(cache, room.find(FIND_STRUCTURES)));

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
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.ConstructionSite, room, FIND_MY_CONSTRUCTION_SITES)).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Flag) !== 0 &&
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Flag, room, FIND_FLAGS)).length !== 0)
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
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Resource, room, FIND_DROPPED_RESOURCES)).length !== 0)
		{
			if (lastRoomObjectsOfTypes !== null)
			{
				(roomObjectsOfTypes ??= []).push.apply(roomObjectsOfTypes, lastRoomObjectsOfTypes as RoomObject[]);
			}

			lastRoomObjectsOfTypes = roomObjectsToAdd;
		}

		if ((roomObjectTypesToInclude & Type.Ruin) !== 0 &&
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Ruin, room, FIND_RUINS)).length !== 0)
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
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Tombstone, room, FIND_TOMBSTONES)).length !== 0)
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

	private static CacheEachStructureType(
		cache: RoomObjectCache,
		allStructures: Structure[]): readonly Structure[]
	{
		let allNonEnemyStructures: Structure[] | null = null;
		const allStructuresLength = allStructures.length;

		for (let index = 0; index < allStructuresLength; ++index)
		{
			const structure: Structure = allStructures[index];

			// @ts-ignore: Intentional Reflection to collect all non-enemy structures
			if (structure.my !== false)
			{
				allNonEnemyStructures?.push(structure);
				let structuresOfType: Structure[] | undefined;
				if ((structuresOfType = cache.get(structure.type) as Structure[] | undefined) !== undefined)
				{
					structuresOfType.push(structure);
				}
				else
				{
					cache.set(structure.type, [structure]);
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
			if (cache.get(structureType) === undefined)
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

	private static GetOrAdd(
		cache: RoomObjectCache,
		roomObjectType: number,
		valueFactory: () => readonly RoomObject[]): readonly RoomObject[]
	{
		let result: readonly RoomObject[];
		return cache.get(roomObjectType) ?? (cache.set(roomObjectType, result = valueFactory()), result);
	}

	private static GetOrFind(
		cache: RoomObjectCache,
		roomObjectType: number,
		room: Room,
		findConstant: FindConstant): readonly RoomObject[]
	{
		let result: readonly RoomObject[];
		return cache.get(roomObjectType) ?? (cache.set(roomObjectType, result = room.find(findConstant) as readonly RoomObject[]), result);
	}

	private static GetOrFindGeneric<TKey, TValue>(
		map: Map<TKey, TValue>,
		key: TKey,
		room: Room,
		findConstant: number): TValue
	{
		let result: TValue;
		return map.get(key) ?? (map.set(key, result = room.find(findConstant as FIND_STRUCTURES) as unknown as TValue), result);
	}
}

Log.Info(`[${Game.time}] ${s_spawns.length} spawns (last is ${Collection.Last(s_spawns)?.ToString()}). ${s_rooms.length} rooms (last is ${Collection.Last(s_rooms)?.ToString()})`);
