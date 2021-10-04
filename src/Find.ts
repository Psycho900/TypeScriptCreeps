import { CreepType } from "Type";

let c_spawns: StructureSpawn[] = Object.values(Game.spawns);
let c_rooms: Room[] = Object.values(Game.rooms);

declare global
{
	interface Array<T>
	{
		FindHighestScoringElement(scoreFunction: (element: T) => number, secondaryScoreFunction?: (element: T) => number): T | undefined;
		GetLast(): T | undefined;
	}
}

Array.prototype.FindHighestScoringElement = function <T>(scoreFunction: (element: T) => number, secondaryScoreFunction?: (element: T) => number)
{
	if (this.length <= 1)
	{
		return this[0];
	}

	let elements: T[] = this;

	if (secondaryScoreFunction)
	{
		// ONLY non-null when we have more than 1 element tied for highest score
		let bestElements: null | T[/* 2+ */] = null;
		let bestElement: T = this[0];
		let bestScore: number = scoreFunction(bestElement);

		for (let i = 1; i < this.length; ++i)
		{
			const currentElement: T = this[i];
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
};

Array.prototype.GetLast = function ()
{
	return this[this.length - 1];
};

declare global
{
	interface RoomPosition /**/ { FindHighestScoringElement<T extends RoomObject | RoomPosition>(elements: T[], scoreFunction: (element: T) => number): T | undefined; }
	interface RoomObject /*  */ { FindHighestScoringElement<T extends RoomObject | RoomPosition>(elements: T[], scoreFunction: (element: T) => number): T | undefined; }
}

RoomPosition.prototype.FindHighestScoringElement = function <T extends RoomObject | RoomPosition>(elements: T[], scoreFunction: (element: T) => number)
{
	return elements.FindHighestScoringElement(scoreFunction, (test) => -this.GetDistanceTo(test));
};

RoomObject.prototype.FindHighestScoringElement = function <T extends RoomObject | RoomPosition>(elements: T[], scoreFunction: (element: T) => number)
{
	return this.pos.FindHighestScoringElement(elements, scoreFunction);
};

declare global
{
	interface Room /*        */ { GetDistanceTo(to: RoomObject | RoomPosition): number; }
	interface RoomPosition /**/ { GetDistanceTo(to: RoomObject | RoomPosition): number; }
	interface RoomObject /*  */ { GetDistanceTo(to: RoomObject | RoomPosition): number; }
}

Room.prototype.GetDistanceTo = function (to)
{
	const toRoomName: string = to.roomName; // Cache getter result

	if (this.name === toRoomName)
	{
		return 0;
	}

	return 50 * Game.map.getRoomLinearDistance(this.name, toRoomName);
};

RoomPosition.prototype.GetDistanceTo = function (to)
{
	const toRoomName: string = to.roomName; // Cache getter result

	if (this.roomName === toRoomName)
	{
		return this.getRangeTo(to);
	}

	return 50 * Game.map.getRoomLinearDistance(this.roomName, toRoomName); // TODO_KevSchil: PathFinder.search is too expensive

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
};

RoomObject.prototype.GetDistanceTo = function (to)
{
	return this.pos.GetDistanceTo(to);
};

declare global
{
	interface CreepMemory { _move: { dest: { x: number; y: number; room: string; }; }; }

	interface Creep { GetDestinationPosition(): RoomPosition | undefined; }
	interface Creep { DistanceToDestination(): number; }
}

Creep.prototype.GetDestinationPosition = function ()
{
	const destination = this.memory._move && this.memory._move.dest;
	return destination && new RoomPosition(destination.x, destination.y, destination.room);
};

Creep.prototype.DistanceToDestination = function ()
{
	const destinationPosition = this.GetDestinationPosition();

	if (!destinationPosition)
	{
		return 0;
	}

	const destinationDistance = this.GetDistanceTo(destinationPosition);
	const maxDistanceToBeNearDestination = (this.creepType & CreepType.Consumers) ? 3 : 1; // Builders can build from 3 away, pretty much everything else needs to be right next to their destination
	return Math.max(destinationDistance - maxDistanceToBeNearDestination, 0);
};

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

Room.prototype.FindClosests = RoomObject.prototype.FindClosests;
Room.prototype.FindClosest = RoomObject.prototype.FindClosest;

module.exports =
{
	HighestScoringElements: FindHighestScoringElements,
	HighestScoringElement: FindHighestScoringElement,
	IsCreepNearDestination: IsCreepNearDestination,

	Rooms: function () { return c_rooms; },
	Creeps: function () { return Object.values(Game.creeps); },
	Spawns: function () { return c_spawns; },
	Sources: function () { return c_sources; },
	Minerals: function () { return c_minerals; },
	Structures: function () { return Object.values(Game.structures); },
	Controllers: function () { return c_controllers; },
};

*/

console.log(`[${Game.time}] ${c_spawns.length} spawns (last is ${c_spawns.GetLast()}). ${c_rooms.length} rooms (last is ${c_rooms.GetLast()})`);
