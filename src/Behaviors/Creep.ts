import { Collection } from "../Collection";
import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

type AnyEnergyGivingObject = ToInterface<AnyEnergyGivingType>;
type AnyEnergyTakingObject = ToInterface<AnyEnergyTakingType>;

// Harvester arrays:
const c_typesHarvestersTakeEnergyFrom = // In priority order
	[
		Type.Tombstone,
		Type.Ruin,
	] as const;

const c_typesHarvestersGiveEnergyTo = // In priority order
	[
		Type.Extension,
		Type.Spawn,
		Type.Tower,
		Type.Storage,
		Type.Link,
		Type.Container,
	] as const;

const c_creepTypesHarvestersGiveEnergyTo = // In priority order
	[
		CreepType.Builder,
		CreepType.Upgrader,
		CreepType.Runner,
		CreepType.Harvester,
	] as const;

// Upgrader & Builder arrays:
const c_typesConsumersTakeEnergyFrom = // In priority order
	[
		Type.Tombstone,
		Type.Ruin,
		Type.Container,
		Type.Storage,
		Type.Link,
	] as const;

const c_typesConsumersGiveEnergyTo = // In priority order
	[
		Type.Extension,
		// Type.Tower, // Harvesters can reach these, so let them handle it
		// Type.Spawn, // Harvesters can reach these, so let them handle it
	] as const;

const c_creepTypesConsumersGiveEnergyTo = // In priority order
	[
		CreepType.Builder,
		CreepType.Upgrader,
	] as const;

// Runner arrays:
const c_typesRunnersTakeEnergyFrom = // In priority order
	[
		Type.Resource,
		Type.Tombstone,
		Type.Ruin,
		Type.Container,
		Type.Storage,
		Type.Link,
	] as const;

const c_energyBanksThatGiveAndTakeEnergy =
	[
		Type.Container,
		Type.Storage,
		Type.Link,
	] as const;

export abstract /* static */ class CreepBehavior
{
	public static Act(): void
	{
		for (const creep of Find.MySpawnedCreeps(CreepType.All)) // Get off room boundaries
		{
			const creepPosition: RoomPosition = creep.pos;
			if (creepPosition.x === 0)
			{
				CreepBehavior.MoveTowards(creep, RIGHT);
			}
			else if (creepPosition.x === 49)
			{
				CreepBehavior.MoveTowards(creep, LEFT);
			}
			else if (creepPosition.y === 0)
			{
				CreepBehavior.MoveTowards(creep, BOTTOM);
			}
			else if (creepPosition.y === 49)
			{
				CreepBehavior.MoveTowards(creep, TOP);
			}
		}

		// Harvesters, Upgraders, and Builders
		for (const room of Find.VisibleRooms())
		{
			const nonRunnerCreeps: readonly AnyProducerOrConsumerCreep[] = Find.Creeps(room, CreepType.AllProducersOrConsumers);
			const constructionSites: readonly /*   */ ConstructionSite[] = Find.MyObjects(room, Type.ConstructionSite);

			for (const creep of nonRunnerCreeps) // First, make sure everything prioritizes the things only they can do
			{
				if (creep.spawning !== false)
				{
					continue;
				}

				switch (creep.CreepType)
				{
					case CreepType.Harvester: // eslint-disable-next-line @typescript-eslint/no-unused-expressions
						CreepBehavior.TryHarvest(creep) !== false
							|| CreepBehavior.TryRepair(creep) !== false
							|| (constructionSites.length !== 0 && CreepBehavior.TryBuild(creep, Find.Closest(creep.pos, constructionSites)!));
						continue;

					case CreepType.Upgrader:
					case CreepType.Builder: // eslint-disable-next-line @typescript-eslint/no-unused-expressions
						(constructionSites.length !== 0
							? CreepBehavior.TryBuild(creep, constructionSites[0])
							: CreepBehavior.TryUpgradeController(creep)) !== false
							|| CreepBehavior.TryRepair(creep);
						continue;
				}
			}

			let source: Source;

			for (const creep of nonRunnerCreeps) // Next, non-runners should give & take as many resources nearby as possible
			{
				if (creep.spawning !== false)
				{
					continue;
				}

				switch (creep.CreepType)
				{
					case CreepType.Harvester:
						if (creep.EnergyLeftToGive !== 0)
						{
							CreepBehavior.GiveEnergyInRange(
								creep,
								(source = creep.Target).pos,
								source.energy !== 0 ? 2 : Math.max(2, (source.ticksToRegeneration / 6 - 3) | 0),
								c_typesHarvestersGiveEnergyTo,
								c_creepTypesHarvestersGiveEnergyTo);
						}

						if (creep.EnergyLeftToTake !== 0) // Harvesters only pick up if they have a place to put it
						{
							CreepBehavior.TakeEnergyInRange(
								creep,
								(source = creep.Target).pos,
								source.energy !== 0 ? 2 : Math.max(2, (source.ticksToRegeneration / 6 - 3) | 0),
								c_typesHarvestersTakeEnergyFrom);
						}

						continue;

					case CreepType.Upgrader:
					case CreepType.Builder:
						if (creep.EnergyLeftToGive !== 0)
						{
							CreepBehavior.GiveEnergyInRange(
								creep,
								(constructionSites[0] || creep.Target).pos,
								4,
								c_typesConsumersGiveEnergyTo,
								Collection.Empty());
						}

						if (creep.EnergyLeftToTake !== 0)
						{
							CreepBehavior.TakeEnergyInRange(
								creep,
								(constructionSites[0] || creep.Target).pos,
								4,
								c_typesConsumersTakeEnergyFrom);
						}

						continue;
				}
			}
		}

		// Set Energy banks's EnergyLeftToGive or EnergyLeftToTake to 0 depending on how close it is to a controller or construction site
		for (const room of Find.VisibleRooms())
		{
			if (room.controller === undefined)
			{
				continue;
			}

			const constructionSite: ConstructionSite | undefined = Find.MyObjects(room, Type.ConstructionSite)[0];

			for (const type of c_energyBanksThatGiveAndTakeEnergy)
			{
				for (const testEnergyBank of Find.MyObjects(room, type))
				{
					const testPosition: RoomPosition = testEnergyBank.pos;

					if (constructionSite === undefined)
					{
						if (Find.IsSameRoomAndWithinRange(testPosition, room.controller.pos, 4) !== false)
						{
							testEnergyBank.EnergyLeftToGive = 0; // Do not take from energy banks near controllers
						}
						else
						{
							testEnergyBank.EnergyLeftToTake = 0; // Do not give to energy banks (that are probably) near sources
						}
					}
					else
					{
						if (Find.IsSameRoomAndWithinRange(testPosition, constructionSite.pos, 4) !== false)
						{
							testEnergyBank.EnergyLeftToGive = 0; // Do not take from energy banks near construction sites
						}
						else
						{
							testEnergyBank.EnergyLeftToTake = 0; // Do not give to energy banks (that are probably) near sources

							if (Find.IsSameRoomAndWithinRange(testPosition, room.controller.pos, 4) !== false)
							{
								testEnergyBank.EnergyLeftToGive = 0; // Do not take from energy banks near controllers
							}
						}
					}
				}
			}
		}

		// Runners
		{
			const runners: readonly RunnerCreep[] = Find.MySpawnedCreeps(CreepType.Runner);

			for (const runner of runners) // Runners should only give/take nearby resources NOT handled by others
			{
				CreepBehavior.TryRepair(runner);

				const energyGiven: number = runner.EnergyLeftToGive === 0 ? 0 :
					CreepBehavior.GiveEnergyInRange(runner, runner.pos, 1, c_typesHarvestersGiveEnergyTo, c_creepTypesConsumersGiveEnergyTo);

				if (runner.EnergyLeftToTake !== 0)
				{
					runner.EnergyLeftToGive += CreepBehavior.TakeEnergyInRange(runner, runner.pos, 1, c_typesConsumersTakeEnergyFrom);
				}

				// This can/should only be done immediately before CreepBehavior.Run, which always operates on 2+ ticks in the future
				runner.EnergyLeftToTake += energyGiven;
			}

			for (const runner of runners)
			{
				if (runner.CanMove !== false)
				{
					CreepBehavior.Run(runner);
				}
			}
		}
	}

	private static GiveEnergyInRange(
		creep: AnyProducerOrConsumerCreep | RunnerCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[],
		creepTypesInPriorityOrder: readonly AnyEnergyTakingCreepType[]): number // Returns amount of energy given
	{
		let energyGiven: number = CreepBehavior.InternalGiveEnergyInRange(
			creep,
			targetPosition,
			targetRange,
			typesInPriorityOrder,
			creepTypesInPriorityOrder);

		if (creep.fatigue !== 0 && Find.IsSameRoomAndWithinRange(creep.pos, targetPosition, targetRange + 1) === false) // ||
		// (creep.CreepType === CreepType.Harvester && CreepBehavior.IsKingOfTheHill(creep) !== false))
		{
			energyGiven += creep.EnergyLeftToGive; // DropAll sets "creep.EnergyLeftToGive" to 0, so add first
			CreepBehavior.DropAll(creep);
			creep.EnergyLeftToTake = 0; // Don't take any more energy for long-distance adventures
		}

		return energyGiven;
	}

	private static InternalGiveEnergyInRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[],
		creepTypesInPriorityOrder: readonly AnyEnergyTakingCreepType[]): number // Returns amount of energy given
	{
		const room: Room = creep.room;
		const creepPosition: RoomPosition = creep.pos;

		if (room.name !== targetPosition.roomName) // When going to a different room, then only give without moving, so we don't move away from our target room
		{
			targetPosition = creepPosition;
			targetRange = 1;
		}

		let x: number = targetPosition.x;
		let y: number = targetPosition.y;
		let minX: number = x - targetRange;
		let maxX: number = x + targetRange;
		let minY: number = y - targetRange;
		let maxY: number = y + targetRange;

		let testObject: AnyEnergyTakingObject | Creep;
		let testPosition: RoomPosition;
		let testDistance: number;
		let testEnergy: number;

		let energyToGive: number = 0;
		let closestObject: AnyEnergyTakingObject | Creep | undefined;
		let closestObjectDistance: number = Find.Distance(creepPosition, targetPosition) + targetRange + 1;

		for (const testType of typesInPriorityOrder)
		{
			const testObjects: readonly AnyEnergyTakingObject[] = Find.MyObjects(room, testType);
			let testObjectIndex: number = testObjects.length;

			while (testObjectIndex-- !== 0)
			{
				if ((testEnergy = (testObject = testObjects[testObjectIndex]).EnergyLeftToTake) === 0 ||
					((testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance))
				{
					continue;
				}
				else if (testDistance > 1)
				{
					if ((x = testPosition.x) >= minX && x <= maxX && (y = testPosition.y) >= minY && y <= maxY)
					{
						closestObject = testObject;
						closestObjectDistance = testDistance;
					}

					continue;
				}

				closestObject = testObject;

				if (testEnergy >= creep.EnergyLeftToGive)
				{
					energyToGive = creep.EnergyLeftToGive;
				}
				else
				{
					energyToGive = testEnergy;

					while (testObjectIndex-- !== 0)
					{
						if ((testEnergy = (testObject = testObjects[testObjectIndex]).EnergyLeftToTake) > energyToGive
							&& Find.IsSameRoomAndWithinRange(creepPosition, testObject.pos, 1) !== false)
						{
							closestObject = testObject;

							if (testEnergy >= creep.EnergyLeftToGive)
							{
								energyToGive = creep.EnergyLeftToGive;
								break;
							}

							energyToGive = testEnergy;
						}
					}
				}

				if (Log.Succeeded(creep.transfer(closestObject, "energy", energyToGive), creep, closestObject) === false)
				{
					return 0;
				}

				closestObject.EnergyLeftToTake -= energyToGive;
				creep.EnergyLeftToGive -= energyToGive;
				return energyToGive;
			}

			if (closestObject !== undefined) // Only daisy-chain it to creeps that are closer to closestObjectToCreep than us
			{
				const closestObjectToCreepDistanceMinus1 = closestObjectDistance - 1;

				if ((x = creepPosition.x) < (y = (testPosition = closestObject.pos).x)) // [sic] (pretend "y" is "x2")
				{
					minX = Math.max(minX, y - closestObjectToCreepDistanceMinus1); // [sic] (pretend "y" is "x2")
					maxX = Math.min(maxX, x + closestObjectToCreepDistanceMinus1);
				}
				else
				{
					minX = Math.max(minX, x - closestObjectToCreepDistanceMinus1);
					maxX = Math.min(maxX, y + closestObjectToCreepDistanceMinus1); // [sic] (pretend "y" is "x2")
				}

				if ((y = creepPosition.y) < (x = testPosition.y)) // [sic] (pretend "x" is "y2")
				{
					minY = Math.max(minY, x - closestObjectToCreepDistanceMinus1); // [sic] (pretend "x" is "y2")
					maxY = Math.min(maxY, y + closestObjectToCreepDistanceMinus1);
				}
				else
				{
					minY = Math.max(minY, y - closestObjectToCreepDistanceMinus1);
					maxY = Math.min(maxY, x + closestObjectToCreepDistanceMinus1); // [sic] (pretend "x" is "y2")
				}

				break;
			}
		}

		const creepType: number = creep.CreepType;

		// See if we can daisy-chain our energy closer to our target to avoid moving
		for (const testCreepType of creepTypesInPriorityOrder)
		{
			const testCreeps: readonly MyCreep[] = Find.Creeps(room, testCreepType);
			let testCreepIndex: number = testCreeps.length;

			while (testCreepIndex-- !== 0)
			{
				if ((testEnergy = (testObject = testCreeps[testCreepIndex]).EnergyLeftToTake) === 0 ||
					testObject.spawning !== false ||
					((testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance) ||
					testObject.id === creep.id)
				{
					continue;
				}
				else if (testDistance > 1)
				{
					if (creepType !== testCreepType && (x = testPosition.x) >= minX && x <= maxX && (y = testPosition.y) >= minY && y <= maxY)
					{
						closestObject = testObject; // Moving to the same creep type results in lots of wasteful jiggling around
						closestObjectDistance = testDistance;
					}

					continue;
				}

				closestObject = testObject;

				if (testEnergy >= creep.EnergyLeftToGive)
				{
					energyToGive = creep.EnergyLeftToGive;
				}
				else
				{
					energyToGive = testEnergy;

					while (testCreepIndex-- !== 0)
					{
						if ((testEnergy = (testObject = testCreeps[testCreepIndex]).EnergyLeftToTake) > energyToGive
							&& Find.IsSameRoomAndWithinRange(creepPosition, testObject.pos, 1) !== false)
						{
							closestObject = testObject;

							if (testEnergy >= creep.EnergyLeftToGive)
							{
								energyToGive = creep.EnergyLeftToGive;
								break;
							}

							energyToGive = testEnergy;
						}
					}
				}

				if (Log.Succeeded(creep.transfer(closestObject, "energy", energyToGive), creep, closestObject) === false)
				{
					return 0;
				}

				closestObject.EnergyLeftToTake -= energyToGive;
				creep.EnergyLeftToGive -= energyToGive;
				return energyToGive;
			}

			if (closestObject !== undefined && closestObject.Type === Type.Creep)
			{
				break;
			}
		}

		if (closestObject !== undefined && /* creep.EnergyLeftToTake === 0 && */ creep.CanMove === true) // Only move if we will be full?
		{
			const closestObjectPosition: RoomPosition = closestObject.pos;

			if (Find.IsSameRoomAndWithinRange(targetPosition, closestObjectPosition, --targetRange) !== false)
			{
				CreepBehavior.MoveTo(creep, closestObject);
			}
			else
			{
				CreepBehavior.MoveTowards(creep, Find.DirectionTo(creep.pos, closestObjectPosition));
			}
		}

		return energyToGive;
	}

	private static TakeEnergyInRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyGivingType[]): number // Returns amount of energy taken
	{
		const creepPosition: RoomPosition = creep.pos;

		if (Find.IsSameRoomAndWithinRange(creepPosition, targetPosition, targetRange) === false)
		{
			return 0; // too far away from destination
		}

		const room: Room = creep.room;
		if (room.name !== targetPosition.roomName) // When going to a different room, then only give without moving, so we don't move away from our target room
		{
			targetPosition = creepPosition;
			targetRange = 1;
		}

		let x: number = targetPosition.x;
		let y: number = targetPosition.y;
		const minX: number = x - targetRange;
		const maxX: number = x + targetRange;
		const minY: number = y - targetRange;
		const maxY: number = y + targetRange;

		let energyToPickUp: number = 0;
		let closestObject: AnyEnergyGivingObject | Resource | undefined;
		let closestObjectDistance: number = Find.Distance(creepPosition, targetPosition) + targetRange + 1;

		let testPosition: RoomPosition;
		let testDistance: number;
		let testEnergy: number;
		let testObject: AnyEnergyGivingObject | Resource;
		let testObjects: readonly (AnyEnergyGivingObject | Resource)[] = Find.MyObjects(room, Type.Resource);
		let testObjectIndex: number = testObjects.length;

		while (testObjectIndex-- !== 0)
		{
			if ((testEnergy = (testObject = testObjects[testObjectIndex]).EnergyLeftToGive) === 0 ||
				((testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance))
			{
				continue;
			}
			else if (testDistance > 1)
			{
				if ((x = testPosition.x) >= minX && x <= maxX && (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObject = testObject;
					closestObjectDistance = testDistance;
				}

				continue;
			}

			closestObject = testObject;

			if (testEnergy >= creep.EnergyLeftToTake)
			{
				energyToPickUp = creep.EnergyLeftToTake;
			}
			else
			{
				energyToPickUp = testEnergy;

				while (testObjectIndex-- !== 0)
				{
					if ((testEnergy = (testObject = testObjects[testObjectIndex]).EnergyLeftToGive) > energyToPickUp
						&& Find.IsSameRoomAndWithinRange(creepPosition, testObject.pos, 1) !== false)
					{
						closestObject = testObject;

						if (testEnergy >= creep.EnergyLeftToTake)
						{
							energyToPickUp = creep.EnergyLeftToTake;
							break;
						}

						energyToPickUp = testEnergy;
					}
				}
			}

			if (Log.Succeeded(creep.pickup(closestObject as Resource), creep, closestObject) === false ||
				(closestObject.EnergyLeftToGive -= energyToPickUp, creep.EnergyLeftToTake -= energyToPickUp) !== 0)
			{
				closestObject = void 0;
				closestObjectDistance = 2;
				break;
			}

			return energyToPickUp;
		}

		let energyToWithdraw: number = 0;

		for (const testType of typesInPriorityOrder)
		{
			testObjects = Find.MyObjects(room, testType);
			testObjectIndex = testObjects.length;

			while (testObjectIndex-- !== 0)
			{
				if ((testEnergy = (testObject = testObjects[testObjectIndex]).EnergyLeftToGive) === 0 ||
					((testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance))
				{
					continue;
				}
				else if (testDistance > 1)
				{
					if ((x = testPosition.x) >= minX && x <= maxX && (y = testPosition.y) >= minY && y <= maxY)
					{
						closestObject = testObject;
						closestObjectDistance = testDistance;
					}

					continue;
				}

				closestObject = testObject;

				if (testEnergy >= creep.EnergyLeftToTake)
				{
					energyToWithdraw = creep.EnergyLeftToTake;
				}
				else
				{
					energyToWithdraw = testEnergy;

					while (testObjectIndex-- !== 0)
					{
						if ((testEnergy = (testObject = testObjects[testObjectIndex]).EnergyLeftToGive) > energyToWithdraw
							&& Find.IsSameRoomAndWithinRange(creepPosition, testObject.pos, 1) !== false)
						{
							closestObject = testObject;

							if (testEnergy >= creep.EnergyLeftToTake)
							{
								energyToWithdraw = creep.EnergyLeftToTake;
								break;
							}

							energyToWithdraw = testEnergy;
						}
					}
				}

				if (Log.Succeeded(creep.withdraw(closestObject as AnyEnergyGivingObject, "energy", energyToWithdraw), creep, closestObject) === false)
				{
					return energyToPickUp;
				}

				closestObject.EnergyLeftToGive -= energyToWithdraw;
				creep.EnergyLeftToTake -= energyToWithdraw;
				return energyToWithdraw + energyToPickUp;
			}

			if (closestObject !== undefined)
			{
				break;
			}
		}

		if (closestObject !== undefined && /* creep.EnergyLeftToGive === 0 && */ creep.CanMove === true) // Only move if we will be empty?
		{
			const closestObjectPosition: RoomPosition = closestObject.pos;

			if (Find.IsSameRoomAndWithinRange(targetPosition, closestObjectPosition, --targetRange) !== false)
			{
				CreepBehavior.MoveTo(creep, closestObject);
			}
			else
			{
				CreepBehavior.MoveTowards(creep, Find.DirectionTo(creep.pos, closestObjectPosition));
			}
		}

		return energyToWithdraw + energyToPickUp;
	}

	// // Return true iff full and standing on the hill of resources containing
	// // the most energy of all nearby resources (to coalesce resource piles).
	// private static IsKingOfTheHill(creep: HarvesterCreep): boolean
	// {
	//	if (creep.EnergyLeftToTake !== 0)
	//	{
	//		return false;
	//	}
	//
	//	// const source: Source = creep.Target;
	//	const sourcePosition: RoomPosition = creep.Target.pos;
	//	let highestEnergyResource: Resource | undefined;
	//	let highestEnergyResourceEnergy: number = 0;
	//
	//	for (const resource of Find.MyObjects(creep.room, Type.Resource))
	//	{
	//		if (resource.EnergyLeftToGive > highestEnergyResourceEnergy &&
	//			Find.IsSameRoomAndWithinRange(sourcePosition, resource.pos, 1) !== false)
	//		{
	//			highestEnergyResource = resource;
	//			highestEnergyResourceEnergy = resource.EnergyLeftToGive;
	//		}
	//	}
	//
	//	return highestEnergyResource !== undefined
	//		&& highestEnergyResource.pos.isEqualTo(creep.pos);
	// }

	private static DropAll(creep: MyCreep): void
	{
		for (const resourceType in creep.store)
		{
			if (resourceType === "energy")
			{
				if (creep.EnergyLeftToGive !== 0 &&
					Log.Succeeded(creep.drop(resourceType), creep))
				{
					creep.EnergyLeftToGive = 0;
				}
			}
			else if (RESOURCES_ALL.includes(resourceType))
			{
				Log.Succeeded(creep.drop(resourceType), creep, resourceType);
			}
		}
	}

	private static TryHarvest(creep: HarvesterCreep): boolean
	{
		const source: Source = creep.Target;
		const sourceEnergy: number = source.energy;

		if ((sourceEnergy === 0 && Find.Distance(creep.pos, source.pos) < (source.ticksToRegeneration / 6 - 3)) ||
			CreepBehavior.TryBeInRange(creep, source, 1) === false ||
			sourceEnergy === 0 ||
			Log.Succeeded(creep.harvest(source), creep, source) === false)
		{
			return false;
		}

		creep.EnergyLeftToTake -= Math.min(
			sourceEnergy,
			2 * creep.getActiveBodyparts("work"),
			creep.EnergyLeftToTake);
		return true;
	}

	// According to https://docs.screeps.com/simultaneous-actions.html this never counts as an action?
	private static TryUpgradeController(creep: UpgraderCreep | BuilderCreep): false
	{
		const controller: StructureController = creep.Target;

		if (controller.upgradeBlocked === 0 ||
			CreepBehavior.TryBeInRange(creep, controller, 3) === false ||
			creep.EnergyLeftToGive === 0 ||
			Log.Succeeded(creep.upgradeController(controller), creep, controller) === false)
		{
			return false;
		}

		creep.EnergyLeftToGive -= Math.min(
			creep.EnergyLeftToGive,
			creep.getActiveBodyparts("work"));
		return false;
	}

	private static TryBuild(
		creep: HarvesterCreep | UpgraderCreep | BuilderCreep,
		constructionSite: ConstructionSite): boolean
	{
		if (CreepBehavior.TryBeInRange(creep, constructionSite, 3) === false ||
			creep.EnergyLeftToGive === 0 ||
			Log.Succeeded(creep.build(constructionSite), creep, constructionSite) === false)
		{
			return false;
		}

		creep.EnergyLeftToGive -= Math.min(
			constructionSite.progressTotal - constructionSite.progress,
			creep.EnergyLeftToGive,
			5 * creep.getActiveBodyparts("work"));
		return true;
	}

	private static TryRepair(creep: MyCreep): boolean
	{
		if (creep.EnergyLeftToGive === 0)
		{
			return false;
		}

		const creepPosition: RoomPosition = creep.pos;
		let lowestHitPointStructure: Structure | undefined;
		let lowestHitPoints: number = 245000;

		for (const structure of Find.MyObjects(creep.room, Type.AllStructures) as readonly Structure[])
		{
			const hitPoints: number = structure.hits;
			if (structure.hitsMax - hitPoints >= 100
				&& hitPoints < lowestHitPoints
				&& Find.IsSameRoomAndWithinRange(creepPosition, structure.pos, 3) !== false)
			{
				lowestHitPointStructure = structure;
				lowestHitPoints = hitPoints;
			}
		}

		if (lowestHitPointStructure === undefined
			|| Log.Succeeded(creep.repair(lowestHitPointStructure), creep, lowestHitPointStructure) === false)
		{
			return false;
		}

		creep.EnergyLeftToGive -= Math.min(
			creep.getActiveBodyparts("work"),
			creep.EnergyLeftToGive);
		return true;
	}

	private static TryBeInRange(
		creep: AnyProducerOrConsumerCreep,
		target: RoomObject,
		range: number): boolean
	{
		const creepPosition: RoomPosition = creep.pos;
		const distanceFromCreepToTargetArea: number = Find.Distance(creepPosition, target.pos) - range;
		if (distanceFromCreepToTargetArea <= 0)
		{
			return true; // Anything after this point always returns false
		}

		if (creep.CanMove === false && creep.fatigue === 0)
		{
			return false; // This means we already successfully moved somewhere else
		}

		let runner: RunnerCreep | undefined;
		if (distanceFromCreepToTargetArea === 1
			|| (runner = Find.Closest(creepPosition, Find.MySpawnedCreeps(CreepType.Runner))) === undefined)
		{
			return CreepBehavior.MoveTo(creep, target);
		}

		creep.EnergyLeftToTake = 0; // Don't take any more energy for long-distance adventures
		runner.EnergyLeftToTake = 0; // Don't take any more energy for long-distance adventures

		if (runner.CanMove === false)
		{
			if (runner.fatigue !== 0 && runner.EnergyLeftToGive !== 0)
			{
				CreepBehavior.DropAll(runner);
			}

			return CreepBehavior.MoveTo(creep, target);
		}

		const runnerPosition: RoomPosition = runner.pos;
		if (Find.IsSameRoomAndWithinRange(creepPosition, runnerPosition, 1) === false) // Runner too far away
		{
			CreepBehavior.MoveTo(runner, creep);
			return CreepBehavior.MoveTo(creep, target);
		}

		// Pulling confirmed
		Log.Succeeded(runner.pull(creep), runner, creep);
		Log.Succeeded(creep.move(runner), creep, runner);
		return creep.CanMove =
			(distanceFromCreepToTargetArea === 2 && Find.IsSameRoomAndWithinRange(runnerPosition, target.pos, range + 1) !== false
				? CreepBehavior.MoveTowards(runner, runnerPosition.getDirectionTo(creep)) // Swap places when close enough
				: CreepBehavior.MoveTo(runner, target));
	}

	private static Run(runner: RunnerCreep): void
	{
		let bestTarget: (RoomObject & EnergyGiverOrTaker) | undefined;
		let maxEnergyFlowPerTick: number = 0;
		let runnerEnergyDifference = 0;

		let testEnergy: number;
		let testScore: number;

		const runnerPosition: RoomPosition = runner.pos;
		let calculateTaking: boolean = runner.EnergyLeftToTake >= runner.EnergyLeftToGive;

		for (let energyDirectionsCalculated: number = 0;
			energyDirectionsCalculated !== 2;
			++energyDirectionsCalculated, calculateTaking = calculateTaking === false)
		{
			if (calculateTaking !== false) // Calculate Runner taking energy
			{
				const runnerEnergyLeftToTake: number = runner.EnergyLeftToTake;
				if (runnerEnergyLeftToTake <= maxEnergyFlowPerTick) // Only calculate if best case scenario is better (all energy / 1 tick)
				{
					continue;
				}

				for (const room of Find.VisibleRooms())
				{
					for (const type of c_typesRunnersTakeEnergyFrom)
					{
						for (const testObject of Find.MyObjects(room, type))
						{
							if ((testEnergy = testObject.EnergyLeftToGive) > maxEnergyFlowPerTick &&
								(testScore = Math.min(testEnergy, runnerEnergyLeftToTake) / Math.max(1, Find.Distance(runnerPosition, testObject.pos) - 1)) > maxEnergyFlowPerTick)
							{
								bestTarget = testObject;
								runnerEnergyDifference = maxEnergyFlowPerTick = testScore;
							}
						}
					}
				}

				for (const testObject of Find.MySpawnedCreeps(CreepType.Harvester))
				{
					if ((testEnergy = testObject.EnergyLeftToGive) > maxEnergyFlowPerTick &&
						(testScore = Math.min(testEnergy, runnerEnergyLeftToTake) / Math.max(1, Find.Distance(runnerPosition, testObject.pos) - 1)) > maxEnergyFlowPerTick)
					{
						bestTarget = testObject;
						runnerEnergyDifference = maxEnergyFlowPerTick = testScore;
					}
				}
			}
			else // Calculate Runner giving energy
			{
				const runnerEnergyLeftToGive: number = runner.EnergyLeftToGive;
				if (runnerEnergyLeftToGive <= maxEnergyFlowPerTick) // Only calculate if best case scenario is better (all energy / 1 tick)
				{
					continue;
				}

				for (const type of c_typesHarvestersGiveEnergyTo)
				{
					for (const room of Find.VisibleRooms())
					{
						for (const testObject of Find.MyObjects(room, type))
						{
							if ((testEnergy = testObject.EnergyLeftToTake) > maxEnergyFlowPerTick &&
								(testScore = Math.min(testEnergy, runnerEnergyLeftToGive) / Math.max(1, Find.Distance(runnerPosition, testObject.pos) - 1)) > maxEnergyFlowPerTick)
							{
								bestTarget = testObject;
								runnerEnergyDifference = -(maxEnergyFlowPerTick = testScore);
							}
						}
					}
				}

				for (const testObject of Find.MySpawnedCreeps(CreepType.AllConsumers))
				{
					if ((testEnergy = testObject.EnergyLeftToTake) > maxEnergyFlowPerTick &&
						(testScore = Math.min(testEnergy, runnerEnergyLeftToGive) / Math.max(1, Find.Distance(runnerPosition, testObject.pos) - 1)) > maxEnergyFlowPerTick)
					{
						bestTarget = testObject;
						runnerEnergyDifference = -(maxEnergyFlowPerTick = testScore);
					}
				}
			}
		}

		if (bestTarget === undefined)
		{
			return;
		}

		CreepBehavior.MoveTo(runner, bestTarget);

		if (runnerEnergyDifference > 0)
		{
			runner.EnergyLeftToTake -= maxEnergyFlowPerTick;
			(bestTarget as EnergyGiver).EnergyLeftToGive -= maxEnergyFlowPerTick;
		}
		else
		{
			runner.EnergyLeftToGive -= maxEnergyFlowPerTick;
			(bestTarget as EnergyTaker).EnergyLeftToTake -= maxEnergyFlowPerTick;
		}
	}

	private static MoveTo(creep: MyCreep, target: RoomObject | RoomPosition): false
	{
		// if (creep.CanMove === true && (creep.name === "H-63"))
		// {
		// 	Log.Error(creep.name + " moving", OK, creep, target);
		// }

		return creep.CanMove === true
			&& Log.Succeeded(creep.moveTo(target), creep, target) !== false
			&& (creep.CanMove = false);
	}

	private static MoveTowards(creep: MyCreep, direction: DirectionConstant): false
	{
		// if (creep.CanMove === true && (creep.name === "H-63"))
		// {
		// 	Log.Error(creep.name + " moving towards", OK, creep, direction.toString());
		// }

		return creep.CanMove === true
			&& Log.Succeeded(creep.move(direction), creep) !== false
			&& (creep.CanMove = false);
	}

	// private static Destination(creep: UpgraderCreep | BuilderCreep): RoomPosition
	// {
	// 	let destination: { readonly x: number; readonly y: number; readonly room: string; } | undefined;
	//
	// 	return creep.Destination ||= (destination = Memory.creeps[creep.name]?._move?.dest) !== undefined
	// 		? new RoomPosition(destination.x, destination.y, destination.room)
	// 		: creep.Target.pos;
	// }
}
