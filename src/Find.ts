import { Type, CreepType } from "Type";

// Should be safe for these to live forever:
let s_roomNameToSources: Record<string, Source[]> = {};
let s_roomNameToMinerals: Record<string, Mineral[]> = {};

// Should reset on each tick:
let s_spawns: StructureSpawn[] = Object.values(Game.spawns);
let s_rooms: Room[] = Object.values(Game.rooms);

declare global
{
	interface CreepMemory { _move: { dest: { x: number; y: number; room: string; }; }; }

	interface Room
	{
		cache: Record<Type, RoomObject[] | undefined> | undefined |
		{
		};

		creepsCache: Record<CreepType, Creep[] | undefined> | undefined;
	}
}

export abstract /*static*/ class Find
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

	public static RoomObjectsOfType(room: Room, types: Type): RoomObject[]
	{
		const cache: Record<Type, RoomObject[] | undefined> = (room.cache ??=
		{
			[Type.Source]: (s_roomNameToSources[room.name] ??= room.find(FIND_SOURCES)),
			[Type.Mineral]: (s_roomNameToMinerals[room.name] ??= room.find(FIND_MINERALS)),
		});

		return cache[types] ??= Find.GenerateRoomObjectsOfTypeArray(room, cache, types);
	}

	public static CreepsOfType(room: Room, creepTypes: CreepType): Creep[]
	{
		const creepsCache = (room.creepsCache ??= { [CreepType.All]: room.find(FIND_CREEPS) });
		return creepsCache[creepTypes] ??= Find.GenerateCreepsOfTypeArray(creepsCache[CreepType.All] as Creep[], creepTypes);
	}

	private static GenerateRoomObjectsOfTypeArray(
		room: Room,
		roomObjectsCache: Record<Type, RoomObject[] | undefined>,
		roomObjectTypes: Type): RoomObject[]
	{
		const roomObjectArraysOfType: RoomObject[][] = [];
		let roomObjectsToAdd: RoomObject[] | undefined;

		const structureTypes = roomObjectTypes & Type.AllStructures;

		if (structureTypes)
		{
			roomObjectsCache[Type.AllStructures] ??= Find.CacheEachStructureType(roomObjectsCache, room.find(FIND_STRUCTURES));

			// This should succeed for AllStructures OR if requesting a single structure type OR anything else that happens to already be cached.
			roomObjectsToAdd = roomObjectsCache[structureTypes];

			if (!roomObjectsToAdd)
			{
				for (let structureType = Type.FirstStructure; structureType != Type.LastStructure; structureType <<= 1)
				{
					if ((roomObjectTypes & structureType) &&
						(roomObjectsToAdd = roomObjectsCache[structureType] as AnyStructure[]).length)
					{
						roomObjectArraysOfType.push(roomObjectsToAdd);
					}
				}
			}
			else if (roomObjectsToAdd.length)
			{
				roomObjectArraysOfType.push(roomObjectsToAdd);
			}
		}

		if ((roomObjectTypes & Type.Creep) &&
			(roomObjectsToAdd = Find.CreepsOfType(room, CreepType.All)).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypes & Type.ConstructionSite) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.ConstructionSite] ??= room.find(FIND_CONSTRUCTION_SITES))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypes & Type.Flag) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Flag] ??= room.find(FIND_FLAGS))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypes & Type.Mineral) &&
			(roomObjectsToAdd = roomObjectsCache[Type.Mineral] as Mineral[]).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypes & Type.Resource) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Resource] ??= room.find(FIND_DROPPED_RESOURCES))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypes & Type.Ruin) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Ruin] ??= room.find(FIND_RUINS))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypes & Type.Source) &&
			(roomObjectsToAdd = roomObjectsCache[Type.Source] as Source[]).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if ((roomObjectTypes & Type.Tombstone) &&
			(roomObjectsToAdd = (roomObjectsCache[Type.Tombstone] ??= room.find(FIND_TOMBSTONES))).length)
		{
			roomObjectArraysOfType.push(roomObjectsToAdd);
		}

		if (roomObjectArraysOfType.length > 1)
		{
			return Array.prototype.concat.apply([], roomObjectArraysOfType);
		}

		return roomObjectArraysOfType.length
			? roomObjectArraysOfType[0]
			: roomObjectArraysOfType as unknown as RoomObject[]; // All T[0] are the same type in JavaScript
	}

	private static CacheEachStructureType(
		roomObjectsCache: Record<Type, RoomObject[] | undefined>,
		allStructures: AnyStructure[]): AnyStructure[]
	{
		for (const structure of allStructures)
		{
			(roomObjectsCache[structure.type] ??= []).push(structure);
		}

		return allStructures;
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

	public static Last<T>(elements: T[]): T | undefined
	{
		return elements[elements.length - 1];
	}

	public static HighestScoringElement<T>(elements: T[], scoreFunction: (element: T) => number, secondaryScoreFunction?: (element: T) => number): T | undefined
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

		let bestElement: T = elements[0];
		let bestScore: number = scoreFunction(bestElement);

		for (let i = 1; i < elements.length; ++i)
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

	public static HighestScoringRoomObject<T extends RoomObject>(roomPosition: RoomPosition, elements: T[], scoreFunction: (element: T) => number): T | undefined
	{
		return Find.HighestScoringElement(elements, scoreFunction, (test) => -Find.Distance(roomPosition, test.pos));
	}

	public static Distance(from: RoomPosition, to: RoomPosition): number
	{
		const fromRoomName: string = from.roomName;
		const toRoomName: string = to.roomName;

		if (fromRoomName === toRoomName)
		{
			return from.getRangeTo(to);
		}

		return 50 * Game.map.getRoomLinearDistance(fromRoomName, toRoomName); // TODO_KevSchil: PathFinder.search is too expensive

		////to.range = 1; // PathFinder requires this if a creep can't be on top of "to".
		////const pathResult = PathFinder.search(this.pos, to);
		////
		////if (pathResult.incomplete !== false)
		////{
		////    Log.Error("GetDistance: PathFinder.search did not complete!", null, this, to);
		////    return 1000000;
		////}
		////
		////return pathResult.path.length + 1; // +1 because of the "to.range = 1;" above
	}

	public static Destination(creep: Creep): RoomPosition | undefined
	{
		const creepMemory = Memory.creeps[creep.name];
		let destination;

		return creepMemory
			&& creepMemory._move
			&& (destination = creepMemory._move.dest)
			&& new RoomPosition(destination.x, destination.y, destination.room);
	}

	public static DistanceToDestination(creep: Creep): number
	{
		const destinationPosition = Find.Destination(creep);

		if (!destinationPosition)
		{
			return 0;
		}

		const destinationDistance = Find.Distance(creep.pos, destinationPosition);
		const maxDistanceToBeNearDestination = (creep.creepType & CreepType.Consumers) ? 3 : 1; // Builders can build from 3 away, pretty much everything else needs to be right next to their destination
		return Math.max(destinationDistance - maxDistanceToBeNearDestination, 0);
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

console.log(`[${Game.time}] ${s_spawns.length} spawns (last is ${Find.Last(s_spawns)?.ToString()}). ${s_rooms.length} rooms (last is ${Find.Last(s_rooms)?.ToString()})`);
