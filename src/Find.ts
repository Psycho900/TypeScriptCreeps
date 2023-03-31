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
let s_creeps: /*         */ readonly Creep[] = Object.values(Game.creeps);
let s_rooms: /*           */ readonly Room[] = Object.values(Game.rooms);
// let s_globalCache: RoomObjectCache;

type RoomObjectCache = Map<number, readonly RoomObject[]>;
type CreepCache = Map<number, readonly Creep[]>;

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
			let allCreepsInRoom: readonly Creep[];

			// Clear whatever existing caches we had from the previous tick
			const roomCreepsCache: CreepCache = (room.creepsCache ??= new Map<number, readonly Creep[]>());
			roomCreepsCache.clear();
			roomCreepsCache.set(CreepType.All, allCreepsInRoom = room.find(FIND_CREEPS));

			const roomCache: RoomObjectCache = (room.cache ??= new Map<number, readonly RoomObject[]>());
			roomCache.clear();
			roomCache
				.set(Type.Creep /*  */, allCreepsInRoom)
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

	public static MyCreeps(): readonly Creep[]
	{
		return s_creeps;
	}

	public static Center(room: Room): RoomPosition
	{
		let result: RoomPosition;
		return s_roomNameToRoomCenters.get(room.name)
			?? (s_roomNameToRoomCenters.set(room.name, result = new RoomPosition(25, 25, room.name)), result);
	}

	public static MyTypes<TRoomObjectTypes extends number>(
		room: Room,
		types: TRoomObjectTypes): readonly ToInterface<TRoomObjectTypes>[]
	{
		return Find.GetOrAdd(room.cache, types, () => Find.GenerateMyRoomObjectsOfTypeArray(room, types)) as readonly ToInterface<TRoomObjectTypes>[];
	}

	public static MyTypesInRange<TRoomObjectTypes extends number>(
		roomObject: RoomObject,
		types: TRoomObjectTypes,
		range: number): readonly ToInterface<TRoomObjectTypes>[]
	{
		return Find.GetRoomObjectsInRange(
			Find.MyTypes(roomObject.room!, types),
			roomObject.pos,
			range) as readonly ToInterface<TRoomObjectTypes>[];
	}

	public static CreepsOfTypes<TCreepTypes extends number>(room: Room, creepTypes: TCreepTypes): readonly ToCreepInterface<TCreepTypes>[]
	{
		return Find.GetOrAddCreeps(
			room.creepsCache,
			creepTypes,
			() => Find.GenerateCreepsOfTypeArray(room.creepsCache.get(CreepType.All)!, creepTypes)) as ToCreepInterface<TCreepTypes>[];
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
					continue; // Take the 1st one with the smallest distance
				}

				bestElement1 = element1;
				bestElement2 = element2;
				smallestDistance = currentDistance;
			}
		}

		return [bestElement1!, bestElement2!];
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
		const roomObjectArraysOfType: (readonly RoomObject[])[] = [];

		const cache: RoomObjectCache = room.cache;
		const structureTypes: number = roomObjectTypesToInclude & Type.AllStructures;

		if (structureTypes)
		{
			Find.GetOrAdd(cache, Type.AllStructures, () => Find.CacheEachStructureType(cache, room.find(FIND_STRUCTURES)));

			// This should succeed for AllStructures OR if requesting a single structure type OR anything else that happens to already be cached.
			let structuresToAdd: readonly RoomObject[] | undefined;
			if ((structuresToAdd = cache.get(structureTypes)))
			{
				Find.PushIfNotEmpty(roomObjectArraysOfType, structuresToAdd);
			}
			else
			{
				for (let structureType: number = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
				{
					if ((roomObjectTypesToInclude & structureType) !== 0)
					{
						Find.PushIfNotEmpty(roomObjectArraysOfType, cache.get(structureType)!);
					}
				}
			}
		}

		if ((roomObjectTypesToInclude & Type.Creep) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, cache.get(Type.Creep)!);
		}

		if ((roomObjectTypesToInclude & Type.ConstructionSite) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, Find.GetOrFind(cache, Type.ConstructionSite, room, FIND_MY_CONSTRUCTION_SITES));
		}

		if ((roomObjectTypesToInclude & Type.Flag) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, Find.GetOrFind(cache, Type.Flag, room, FIND_FLAGS));
		}

		if ((roomObjectTypesToInclude & Type.Mineral) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, cache.get(Type.Mineral)!);
		}

		if ((roomObjectTypesToInclude & Type.Resource) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, Find.GetOrFind(cache, Type.Resource, room, FIND_DROPPED_RESOURCES));
		}

		if ((roomObjectTypesToInclude & Type.Ruin) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, Find.GetOrFind(cache, Type.Ruin, room, FIND_RUINS));
		}

		if ((roomObjectTypesToInclude & Type.Source) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, cache.get(Type.Source)!);
		}

		if ((roomObjectTypesToInclude & Type.Tombstone) !== 0)
		{
			Find.PushIfNotEmpty(roomObjectArraysOfType, Find.GetOrFind(cache, Type.Tombstone, room, FIND_TOMBSTONES));
		}

		if (roomObjectArraysOfType.length > 1)
		{
			return Array.prototype.concat.apply([], roomObjectArraysOfType) as readonly RoomObject[];
		}

		return roomObjectArraysOfType.length !== 0
			? roomObjectArraysOfType[0]
			: roomObjectArraysOfType as readonly unknown[] as readonly RoomObject[]; // All empty arrays are the same type in JavaScript
	}

	private static PushIfNotEmpty(
		roomObjectArraysOfType: (readonly RoomObject[])[],
		roomObjectsToAdd: readonly RoomObject[]): void
	{
		if (roomObjectsToAdd.length !== 0)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}
	}

	private static CacheEachStructureType(
		cache: RoomObjectCache,
		allStructures: readonly Structure[]): readonly Structure[]
	{
		for (let structureType: number = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
		{
			cache.set(structureType, []);
		}

		const allNonEnemyStructures: Structure[] = [];

		for (const structure of allStructures)
		{
			// @ts-ignore: Intentional Reflection to collect all non-enemy structures
			if (structure.my !== false)
			{
				allNonEnemyStructures.push(structure);
				(cache.get(structure.type) as RoomObject[]).push(structure);
			}
		}

		return allNonEnemyStructures;
	}

	private static GetRoomObjectsInRange(
		roomObjects: readonly RoomObject[],
		pos: RoomPosition,
		range: number): readonly RoomObject[]
	{
		if (roomObjects.length <= 0)
		{
			return roomObjects;
		}

		let x: number = pos.x;
		let y: number = pos.y;
		const minX: number = x - range;
		const maxX: number = x + range;
		const minY: number = y - range;
		const maxY: number = y + range;

		const roomObjectsInRange: RoomObject[] = [];

		for (const roomObjectToTest of roomObjects)
		{
			const posToTest: RoomPosition = roomObjectToTest.pos;

			if ((x = posToTest.x) >= minX && x <= maxX &&
				(y = posToTest.y) >= minY && y <= maxY)
			{
				roomObjectsInRange.push(roomObjectToTest);
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

	private static GetOrAddCreeps(
		creepCache: CreepCache,
		creepType: number,
		valueFactory: () => readonly Creep[]): readonly Creep[]
	{
		let result: readonly Creep[];
		return creepCache.get(creepType) ?? (creepCache.set(creepType, result = valueFactory()), result);
	}

	private static GetOrFindGeneric<TKey, TValue>(
		map: Map<TKey, TValue>,
		key: TKey,
		room: Room,
		findConstant: FindConstant): TValue
	{
		let result: TValue;
		return map.get(key) ?? (map.set(key, result = room.find(findConstant) as unknown as TValue), result);
	}
}

Log.Info(`[${Game.time}] ${s_spawns.length} spawns (last is ${Collection.Last(s_spawns)?.ToString()}). ${s_rooms.length} rooms (last is ${Collection.Last(s_rooms)?.ToString()})`);
