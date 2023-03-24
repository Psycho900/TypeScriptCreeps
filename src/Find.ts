import { } from "./Creep";
import { CreepType } from "./CreepType";
import { Type } from "./Type";

// Should be safe for these to live forever:
const s_roomNameToSources /* */: Map<string, /* */ Source[]> = new Map<string, /* */ Source[]>();
const s_roomNameToMinerals /**/: Map<string, /**/ Mineral[]> = new Map<string, /**/ Mineral[]>();

// Should reset on each tick:
let s_spawns: StructureSpawn[] = Object.values(Game.spawns);
let s_rooms: /*      */ Room[] = Object.values(Game.rooms);

interface RoomObjectCache extends Map<AnyRoomObjectType, AnyRoomObject[]>
{
	get(key: SourceType): Source[];
	get(key: MineralType): Mineral[];
	get<TRoomObjectType extends AnyRoomObjectType>(key: TRoomObjectType): ToInterface<TRoomObjectType>[] | undefined;
	set<TRoomObjectType extends AnyRoomObjectType>(key: TRoomObjectType, value: ToInterface<TRoomObjectType>[]): this;
	set(key: number, value: []): this;
}

// type RoomObjectCache = Map<AnyRoomObjectType, AnyRoomObject[]>;
	/* {
		[TRoomObjectType in AnyRoomObjectType]?: ToInterface<TRoomObjectType>[];
	} | {
		[key: number]: AnyRoomObject[] | undefined;
	} */;

interface CreepCache extends Map<AnyCreepType, AnyCreep[]>
{
	get<TCreepTypes extends AnyCreepType>(key: TCreepTypes): ToCreepInterface<TCreepTypes>[] | undefined;
	set<TCreepTypes extends AnyCreepType>(key: TCreepTypes, value: ToCreepInterface<TCreepTypes>[]): this;
}

// type CreepCache = Map<AnyCreepType, AnyCreep[]>;
	/* {
		[TCreepTypes in AnyCreepType]?: Creep[];
	} | {
		[key: number]: Creep[] | undefined;
	} */;

declare global
{
	interface CreepMemory
	{
		_move: { dest: { x: number; y: number; room: string; }; };
	}

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

		for (const room of s_rooms = Object.values(Game.rooms))
		{
			const roomName: string = room.name;

			// Clear whatever existing caches we had from the previous tick
			room.cache = new Map<AnyRoomObjectType, AnyRoomObject[]>()
				.set(Type.Source /* */, Find.GetOrFindGeneric(s_roomNameToSources /* */, roomName, room, FIND_SOURCES))
				.set(Type.Mineral /**/, Find.GetOrFindGeneric(s_roomNameToMinerals /**/, roomName, room, FIND_MINERALS)) as RoomObjectCache;

			room.creepsCache = new Map<AnyCreepType, AnyCreep[]>()
				.set(CreepType.All, room.find(FIND_CREEPS)) as CreepCache;
		}
	}

	public static Spawns(): StructureSpawn[]
	{
		return s_spawns;
	}

	public static Rooms(): Room[]
	{
		return s_rooms;
	}

	public static Types<TRoomObjectTypes extends AnyRoomObjectType>(
		room: Room,
		types: TRoomObjectTypes): ToInterface<TRoomObjectTypes>[]
	{
		return Find.GetOrAdd(room.cache, types, () => Find.GenerateRoomObjectsOfTypeArray(room, types));
	}

	public static TypesInRange<TRoomObjectTypes extends AnyRoomObjectType>(
		roomObject: RoomObject,
		types: TRoomObjectTypes,
		range: number): ToInterface<TRoomObjectTypes>[]
	{
		return Find.GetRoomObjectsInRange(
			Find.Types(roomObject.room!, types),
			roomObject.pos,
			range);
	}

	public static CreepsOfTypes<TCreepType extends AnyCreepType>(room: Room, creepTypes: TCreepType): Creep[]
	{
		return Find.GetOrAddCreeps(
			room.creepsCache,
			creepTypes,
			() => Find.GenerateCreepsOfTypeArray(room.creepsCache.get(CreepType.All)!, creepTypes));
	}

	public static Last<T>(elements: T[]): T | undefined
	{
		return elements[elements.length - 1];
	}

	public static HighestScoringElement<T>(
		elements: T[],
		scoreFunction: (element: T) => number): T | undefined
	{
		const elementsLength: number = elements.length;
		let bestElement: T = elements[0];

		if (elementsLength <= 1)
		{
			return bestElement;
		}

		let bestScore: number = scoreFunction(bestElement);

		for (let i: number = 1; i < elementsLength; ++i)
		{
			const currentElement: T = elements[i];
			const currentScore: number = scoreFunction(currentElement);

			if (currentScore > bestScore) // Take the 1st one with the highest score
			{
				bestElement = currentElement;
				bestScore = currentScore;
			}
		}

		return bestElement;
	}

	public static HighestScoringElement2<T>(
		elements: T[],
		/*    */ scoreFunction: (element: T) => number,
		secondaryScoreFunction: (element: T) => number): T | undefined
	{
		let elementsLength: number = elements.length;
		let bestElement: T = elements[0];

		if (elementsLength <= 1)
		{
			return bestElement;
		}

		let bestScore: number = scoreFunction(bestElement);

		// ONLY non-null when we have more than 1 element tied for highest score
		let bestElements: null | T[/* 2+ */] = null;

		for (let i: number = 1; i < elementsLength; ++i)
		{
			const currentElement: T = elements[i];
			const currentScore: number = scoreFunction(currentElement);

			if (currentScore < bestScore) // Common case
			{
				continue;
			}

			if (currentScore > bestScore) // New highest score
			{
				bestElements = null; // No more tie-breaker!
				bestElement = currentElement;
				bestScore = currentScore;
				continue;
			}

			if (bestElements === null) // 2-way tie for highest score
			{
				bestElements = [bestElement, currentElement];
				continue;
			}

			bestElements.push(currentElement); // 3+ way tie for highest score
		}

		if (bestElements === null) // Only 1 highest score
		{
			return bestElement; // bestElement is only valid when bestElements is null
		}

		// Treat the normal search below as the tie-breaker search
		elements = bestElements;
		elementsLength = bestElements.length;
		// bestElement = bestElements[0]; // This should still be the 1st element in bestElements
		bestScore = secondaryScoreFunction(bestElement);

		for (let i: number = 1; i < elementsLength; ++i)
		{
			const currentElement: T = elements[i];
			const currentScore: number = secondaryScoreFunction(currentElement);

			if (currentScore > bestScore) // Take the 1st one with the highest score
			{
				bestElement = currentElement;
				bestScore = currentScore;
			}
		}

		return bestElement;
	}

	public static HighestScoringRoomObject<TRoomObject extends AnyRoomObject>(
		roomPosition: RoomPosition,
		elements: TRoomObject[],
		scoreFunction: (element: TRoomObject) => number): TRoomObject | undefined
	{
		return Find.HighestScoringElement2(
			elements,
			scoreFunction,
			(test: TRoomObject): number => -Find.Distance(roomPosition, test.pos));
	}

	public static Distance(
		from: RoomPosition,
		to: RoomPosition): number
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

	public static Destination(creep: Creep): RoomPosition | undefined
	{
		let destination: { x: number; y: number; room: string; } | undefined;

		return (destination = Memory.creeps[creep.name]?._move?.dest)
			&& new RoomPosition(destination.x, destination.y, destination.room);
	}

	public static DistanceToDestination(creep: Creep): number
	{
		const destinationPosition: RoomPosition | undefined = Find.Destination(creep);

		return destinationPosition
			? Math.max(Find.Distance(creep.pos, destinationPosition) - (creep.IsAny(CreepType.AllConsumers) ? 3 : 1), 0)
			: 0; // ^ Builders can build from 3 away, pretty much everything else needs to be right next to their destination
	}

	private static GenerateRoomObjectsOfTypeArray<
		TRoomObjectTypes extends AnyRoomObjectType,
		TRoomObjects extends ToInterface<TRoomObjectTypes>>(
			room: Room,
			roomObjectTypesToInclude: TRoomObjectTypes): TRoomObjects[]
	{
		const roomObjectArraysOfType: TRoomObjects[][] = [];
		let roomObjectsToAdd: TRoomObjects[] | undefined;

		const cache: RoomObjectCache = room.cache;
		const structureTypes: TRoomObjectTypes & AnyStructureType = (roomObjectTypesToInclude & Type.AllStructures) as TRoomObjectTypes & AnyStructureType;

		if (structureTypes)
		{
			Find.GetOrAdd(cache, Type.AllStructures, () => Find.CacheEachStructureType(cache, room.find(FIND_STRUCTURES)));

			// This should succeed for AllStructures OR if requesting a single structure type OR anything else that happens to already be cached.
			if ((roomObjectsToAdd = cache.get(structureTypes) as (TRoomObjects & AnyStructure)[] | undefined))
			{
				roomObjectArraysOfType.push(roomObjectsToAdd);
			}
			else
			{
				for (let structureType: AnyStructureType = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
				{
					if ((roomObjectTypesToInclude & structureType) !== 0 &&
						(roomObjectsToAdd = cache.get(structureType as AnyStructureType) as (TRoomObjects & AnyStructure)[]).length !== 0)
					{
						roomObjectArraysOfType.push(roomObjectsToAdd);
					}
				}
			}
		}

		if ((roomObjectTypesToInclude & Type.Creep) !== 0)
		{
			roomObjectArraysOfType.push(Find.CreepsOfTypes(room, CreepType.All) as (TRoomObjects & Creep)[]);
		}

		if ((roomObjectTypesToInclude & Type.ConstructionSite) !== 0 &&
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.ConstructionSite, room, FIND_CONSTRUCTION_SITES) as TRoomObjects[]).length !== 0)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Flag) !== 0 &&
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Flag, room, FIND_FLAGS) as TRoomObjects[]).length !== 0)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Mineral) !== 0 &&
			(roomObjectsToAdd = cache.get(Type.Mineral) as (TRoomObjects & Mineral)[]).length !== 0)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Resource) !== 0 &&
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Resource, room, FIND_DROPPED_RESOURCES) as TRoomObjects[]).length !== 0)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Ruin) !== 0 &&
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Ruin, room, FIND_RUINS) as TRoomObjects[]).length !== 0)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Source) !== 0)
		{
			roomObjectArraysOfType.push(cache.get(Type.Source) as (TRoomObjects & Source)[]);
		}

		if ((roomObjectTypesToInclude & Type.Tombstone) !== 0 &&
			(roomObjectsToAdd = Find.GetOrFind(cache, Type.Tombstone, room, FIND_TOMBSTONES) as TRoomObjects[]).length !== 0)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if (roomObjectArraysOfType.length > 1)
		{
			return Array.prototype.concat.apply([], roomObjectArraysOfType) as TRoomObjects[];
		}

		return roomObjectArraysOfType.length !== 0
			? roomObjectArraysOfType[0]
			: roomObjectArraysOfType as unknown[] as TRoomObjects[]; // All empty arrays are the same type in JavaScript
	}

	private static CacheEachStructureType(
		cache: RoomObjectCache,
		allStructures: AnyStructure[]): AnyStructure[]
	{
		for (let structureType: AnyStructureType = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
		{
			cache.set(structureType, []);
		}

		for (const structure of allStructures)
		{
			cache.get(structure.type)!.push(structure);
		}

		return allStructures;
	}

	private static GetRoomObjectsInRange<TRoomObject extends AnyRoomObject>(
		roomObjects: TRoomObject[],
		pos: RoomPosition,
		range: number): TRoomObject[]
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

		const roomObjectsInRange: TRoomObject[] = [];

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

	private static GenerateCreepsOfTypeArray<TCreepType extends AnyCreepType>(
		allCreeps: Creep[],
		creepTypes: TCreepType): ToCreepInterface<TCreepType>[]
	{
		const creepsOfType: ToCreepInterface<TCreepType>[] = [];

		for (const creep of allCreeps)
		{
			if (creep.IsAny(creepTypes))
			{
				creepsOfType.push(creep);
			}
		}

		return creepsOfType;
	}

	private static GetOrAdd<TRoomObjectType extends AnyRoomObjectType>(
		cache: RoomObjectCache,
		key: TRoomObjectType,
		valueFactory: () => ToInterface<TRoomObjectType>[]): ToInterface<TRoomObjectType>[]
	{
		let result: ToInterface<TRoomObjectType>[] | undefined;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		(result = cache.get(key)) ?? cache.set(key, result = valueFactory());
		return result;
	}

	private static GetOrFind<
		TRoomObjectType extends AnyRoomObjectType,
		TFindConstant extends Exclude<FindConstant, ExitConstant>,
		TRoomObject extends ToInterface<TRoomObjectType> & FindTypes[TFindConstant]>(
			cache: RoomObjectCache,
			key: TRoomObjectType,
			room: Room,
			findConstant: TFindConstant): TRoomObject[]
	{
		let result: TRoomObject[] | undefined;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		(result = cache.get(key) as TRoomObject[] | undefined) ?? cache.set(key, result = room.find(findConstant));
		return result;
	}

	private static GetOrAddCreeps<TCreepType extends AnyCreepType>(
		creepCache: CreepCache,
		key: TCreepType,
		valueFactory: () => ToCreepInterface<TCreepType>[]): ToCreepInterface<TCreepType>[]
	{
		let result: ToCreepInterface<TCreepType>[] | undefined;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		(result = creepCache.get(key)) ?? creepCache.set(key, result = valueFactory());
		return result;
	}

	private static GetOrFindGeneric<TKey, TFindConstant extends FindConstant>(
		map: Map<TKey, FindTypes[TFindConstant][]>,
		key: TKey,
		room: Room,
		findConstant: TFindConstant): FindTypes[TFindConstant][]
	{
		let result: FindTypes[TFindConstant][] | undefined;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		(result = map.get(key)) ?? map.set(key, result = room.find(findConstant));
		return result;
	}
}

/*

function IsCreepNearDestination(creep)
{
	return creep.DistanceToDestination() <= 1;
}

RoomObject.prototype.FindClosests = function (roomObjects)
{
	return FindHighestScoringElements(roomObjects, (test) => -this.GetDistanceTo(test));
};

RoomObject.prototype.FindClosest = function (roomObjects)
{
	const closestRoomObjects = this.FindClosests(roomObjects);
	return closestRoomObjects[0];
};

*/

// eslint-disable-next-line no-console
console.log(`[${Game.time}] ${s_spawns.length} spawns (last is ${Find.Last(s_spawns)?.ToString()}). ${s_rooms.length} rooms (last is ${Find.Last(s_rooms)?.ToString()})`);
