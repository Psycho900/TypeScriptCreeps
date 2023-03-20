import { CreepType, Type } from "./Type";

// Should be safe for these to live forever:
const s_roomNameToSources /* */: Record<string, /* */ Source[]> = {};
const s_roomNameToMinerals /**/: Record<string, /**/ Mineral[]> = {};

// Should reset on each tick:
let s_spawns: StructureSpawn[] = Object.values(Game.spawns);
let s_rooms: Room[] /*      */ = Object.values(Game.rooms);

declare global
{
	type RoomObjectCache = Record<Type, RoomObject[] | undefined>;
	type CreepCache /**/ = Record<CreepType, Creep[] | undefined>;

	interface CreepMemory
	{
		_move: { dest: { x: number; y: number; room: string; }; };
	}

	interface Room
	{
		cache: RoomObjectCache | undefined;
		creepsCache: CreepCache | undefined;
	}
}

export abstract /* static */ class Find
{
	public static ResetCacheForBeginningOfTick(): void
	{
		// See "Should reset on each tick" comment near top of file:
		s_spawns = Object.values(Game.spawns);
		s_rooms = Object.values(Game.rooms);

		for (const room of s_rooms)
		{
			// Clear whatever existing caches we had from the previous tick
			room.cache = undefined;
			room.creepsCache = undefined;
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

	public static TypesInRange(roomObject: RoomObject, types: Type, range: number): RoomObject[]
	{
		const room: Room = roomObject.room as Room; // Just don't call this in cases where .room is undefined
		const cache: RoomObjectCache = (room.cache ??= Find.GenerateDefaultRoomCache(room));
		return Find.GetRoomObjectsInRange(
			cache[types] ??= Find.GenerateRoomObjectsOfTypeArray(room, cache, types),
			roomObject.pos,
			range);
	}

	public static Creeps(room: Room): Creep[]
	{
		return Find.CreepsOfTypes(room, CreepType.All);
	}

	public static CreepsOfTypes(room: Room, creepTypes: CreepType): Creep[]
	{
		const creepsCache: CreepCache = (room.creepsCache ??= { [CreepType.All]: room.find(FIND_CREEPS) });
		return creepsCache[creepTypes] ??= Find.GenerateCreepsOfTypeArray(creepsCache[CreepType.All] as Creep[], creepTypes);
	}

	public static Last<T>(elements: T[]): T | undefined
	{
		return elements[elements.length - 1];
	}

	public static HighestScoringElement<T>(
		elements: T[],
		scoreFunction: (element: T) => number,
		secondaryScoreFunction?: (element: T) => number): T | undefined
	{
		if (elements.length <= 1)
		{
			return elements[0];
		}

		if (secondaryScoreFunction)
		{
			// ONLY non-null when we have more than 1 element tied for highest score
			let bestElements: null | T[/* 2+ */] = null;
			let bestElement: T = elements[0];
			let bestScore: number = scoreFunction(bestElement);

			for (let i = 1; i < this.length; ++i)
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

				if (!bestElements) // 2-way tie for highest score
				{
					bestElements = [bestElement, currentElement];
					continue;
				}

				bestElements.push(currentElement); // 3+ way tie for highest score
			}

			if (!bestElements) // Only 1 highest score
			{
				return bestElement; // bestElement is only valid when bestElements is null
			}

			// Treat the normal search below as the tie-breaker search
			elements = bestElements;
			scoreFunction = secondaryScoreFunction;
		}

		let bestElement2: T = elements[0];
		let bestScore2: number = scoreFunction(bestElement2);

		for (let i = 1; i < elements.length; ++i)
		{
			const currentElement: T = elements[i];
			const currentScore: number = scoreFunction(currentElement);

			if (currentScore > bestScore2) // Take the 1st one with the highest score
			{
				bestElement2 = currentElement;
				bestScore2 = currentScore;
			}
		}

		return bestElement2;
	}

	public static HighestScoringRoomObject<T extends RoomObject>(
		roomPosition: RoomPosition,
		elements: T[],
		scoreFunction: (element: T) => number): T | undefined
	{
		return Find.HighestScoringElement(elements, scoreFunction, (test) => -Find.Distance(roomPosition, test));
	}

	public static Distance(
		fromObjectOrPosition: RoomObject | RoomPosition,
		toObjectOrPosition: RoomObject | RoomPosition): number
	{
		const from: RoomPosition = fromObjectOrPosition.pos;
		const to: RoomPosition = toObjectOrPosition.pos;

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
			? Math.max(Find.Distance(creep.pos, destinationPosition) - ((creep.creepType & CreepType.Consumers) ? 3 : 1), 0)
			: 0; // ^ Builders can build from 3 away, pretty much everything else needs to be right next to their destination
	}


	private static GenerateDefaultRoomCache(room: Room): RoomObjectCache
	{
		const roomName: string = room.name;

		return (
			{
				[Type.Source] /* */: s_roomNameToSources[roomName] /* */ ??= room.find(FIND_SOURCES),
				[Type.Mineral] /**/: s_roomNameToMinerals[roomName] /**/ ??= room.find(FIND_MINERALS),
			});
	}

	private static GenerateRoomObjectsOfTypeArray(
		room: Room,
		roomObjectsCache: RoomObjectCache,
		roomObjectTypesToInclude: Type): RoomObject[]
	{
		const roomObjectArraysOfType: RoomObject[][] = [];
		let roomObjectsToAdd: RoomObject[] | undefined;

		const structureTypes = roomObjectTypesToInclude & Type.AllStructures;

		if (structureTypes)
		{
			roomObjectsCache[Type.AllStructures] ??= Find.CacheEachStructureType(roomObjectsCache, room.find(FIND_STRUCTURES));

			// This should succeed for AllStructures OR if requesting a single structure type OR anything else that happens to already be cached.
			if ((roomObjectsToAdd = roomObjectsCache[structureTypes]))
			{
				roomObjectArraysOfType.push(roomObjectsToAdd);
			}
			else
			{
				for (let structureType = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
				{
					if ((roomObjectTypesToInclude & structureType) &&
						(roomObjectsToAdd = roomObjectsCache[structureType] as AnyStructure[]).length)
					{
						roomObjectArraysOfType.push(roomObjectsToAdd);
					}
				}
			}
		}

		if (roomObjectTypesToInclude & Type.Creep)
		{
			roomObjectArraysOfType.push(Find.CreepsOfTypes(room, CreepType.All));
		}

		if ((roomObjectTypesToInclude & Type.ConstructionSite) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.ConstructionSite] ??= room.find(FIND_CONSTRUCTION_SITES))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Flag) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Flag] ??= room.find(FIND_FLAGS))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Mineral) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Mineral] as Mineral[])).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Resource) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Resource] ??= room.find(FIND_DROPPED_RESOURCES))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypesToInclude & Type.Ruin) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Ruin] ??= room.find(FIND_RUINS))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if (roomObjectTypesToInclude & Type.Source)
		{
			roomObjectArraysOfType.push(roomObjectsCache[Type.Source] as Source[]);
		}

		if ((roomObjectTypesToInclude & Type.Tombstone) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Tombstone] ??= room.find(FIND_TOMBSTONES))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if (roomObjectArraysOfType.length > 1)
		{
			return Array.prototype.concat.apply([], roomObjectArraysOfType) as RoomObject[];
		}

		return roomObjectArraysOfType.length
			? roomObjectArraysOfType[0]
			: roomObjectArraysOfType as unknown as RoomObject[]; // All empty arrays are the same type in JavaScript
	}

	private static CacheEachStructureType(
		roomObjectsCache: RoomObjectCache,
		allStructures: AnyStructure[]): AnyStructure[]
	{
		for (let structureType = Type.FirstStructure; structureType !== Type.LastStructure; structureType <<= 1)
		{
			roomObjectsCache[structureType] = [];
		}

		for (const structure of allStructures)
		{
			(roomObjectsCache[structure.type] as RoomObject[]).push(structure);
		}

		return allStructures;
	}

	private static GetRoomObjectsInRange<T extends RoomObject>(
		roomObjects: T[],
		pos: RoomPosition,
		range: number): T[]
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

		const roomObjectsInRange: T[] = [];

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

	private static GenerateCreepsOfTypeArray(allCreeps: Creep[], creepTypes: CreepType): Creep[]
	{
		const creepsOfType: Creep[] = [];

		for (const creep of allCreeps)
		{
			if (creep.creepType & creepTypes)
			{
				creepsOfType.push(creep);
			}
		}

		return creepsOfType;
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
