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
		Type.Link,
		Type.Container,
		Type.Storage,
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
		Type.Spawn,
		Type.Tower,
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
		// Harvesters, Upgraders, and Builders
		{
			const nonRunnerCreeps: readonly AnyProducerOrConsumerCreep[] = Find.MySpawnedCreeps(CreepType.AllProducersOrConsumers);

			for (const creep of nonRunnerCreeps) // First, make sure everything prioritizes the things only they can do
			{
				switch (creep.CreepType)
				{
					// eslint-disable-next-line @typescript-eslint/no-unused-expressions
					case CreepType.Harvester: CreepBehavior.TryHarvest(creep) !== false || CreepBehavior.TryBuild(creep); continue;
					case CreepType.Upgrader: CreepBehavior.UpgradeController(creep); continue;
					case CreepType.Builder: CreepBehavior.TryBuild(creep); continue;
				}
			}

			let source: Source;

			for (const creep of nonRunnerCreeps) // Next, non-runners should give & take as many resources nearby as possible
			{
				switch (creep.CreepType)
				{
					case CreepType.Harvester:
						if (creep.EnergyLeftToGive !== 0)
						{
							CreepBehavior.GiveEnergyInRange(creep, (source = creep.Target).pos, source.energy !== 0 ? 2 : Math.max(2, source.ticksToRegeneration >> 1), c_typesHarvestersGiveEnergyTo, c_creepTypesHarvestersGiveEnergyTo);
						}
						else if (creep.EnergyLeftToTake !== 0) // Harvesters only pick up if they have a place to put it
						{
							CreepBehavior.TakeEnergyInRange(creep, (source = creep.Target).pos, source.energy !== 0 ? 2 : Math.max(2, source.ticksToRegeneration >> 1), c_typesHarvestersTakeEnergyFrom);
						}

						continue;

					case CreepType.Upgrader:
					case CreepType.Builder:
						if (creep.EnergyLeftToGive !== 0)
						{
							CreepBehavior.GiveEnergyInRange(creep, CreepBehavior.Destination(creep), 4, c_typesConsumersGiveEnergyTo, Collection.Empty());
						}

						if (creep.EnergyLeftToTake !== 0)
						{
							CreepBehavior.TakeEnergyInRange(creep, CreepBehavior.Destination(creep), 4, c_typesConsumersTakeEnergyFrom);
						}

						continue;
				}
			}
		}

		// Set Energy banks's EnergyLeftToGive or EnergyLeftToTake to 0 depending on how close it is to a controller or construction site
		for (const room of Find.VisibleRooms())
		{
			let constructionSites: readonly ConstructionSite[];

			for (const type of c_energyBanksThatGiveAndTakeEnergy)
			{
				for (const testEnergyBank of Find.MyObjects(room, type))
				{
					const testPosition: RoomPosition = testEnergyBank.pos;

					if ((room.controller !== undefined && Find.IsSameRoomAndWithinRange(testPosition, room.controller.pos, 4) !== false) ||
						((constructionSites ??= Find.MyObjects(room, Type.ConstructionSite)).length !== 0 &&
							Find.IsSameRoomAndWithinRange(testPosition, constructionSites[0].pos, 4) !== false))
					{
						testEnergyBank.EnergyLeftToGive = 0; // Do not take from energy banks near controllers or construction sites
					}
					else
					{
						testEnergyBank.EnergyLeftToTake = 0; // Do not give to energy banks (that are probably) near sources
					}
				}
			}
		}

		debugger;

		// Runners
		{
			const runners: readonly RunnerCreep[] = Find.MySpawnedCreeps(CreepType.Runner);

			for (const runner of runners) // Runners should only give/take nearby resources NOT handled by others
			{
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

		let closestObject: AnyEnergyTakingObject | Creep | undefined;
		let closestObjectDistance: number = 1000000000; // magnitudes larger than the entire map
		let testPosition: RoomPosition;
		let testDistance: number;
		let testEnergy: number;
		let energyGiven: number = 0;

		for (const testType of typesInPriorityOrder)
		{
			for (const testObject of Find.MyObjects(room, testType))
			{
				if (testObject.EnergyLeftToTake === 0 ||
					(testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance)
				{
					continue;
				}
				else if (testDistance <= 1)
				{
					if (energyGiven !== 0 // On the next tick, we're already within range of a 2nd object to give to
						|| (Log.Succeeded(creep.transfer(testObject, "energy", testEnergy = Math.min(creep.EnergyLeftToGive, testObject.EnergyLeftToTake)), creep, testObject) !== false
							&& (testObject.EnergyLeftToTake -= testEnergy, creep.EnergyLeftToGive -= testEnergy) === 0) // we're empty
						|| creep.CanMove === false) // We already transferred and can't move anywhere to give remaining energy away
					{
						return energyGiven;
					}

					energyGiven = testEnergy;
				}
				else if ((x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObject = testObject;
					closestObjectDistance = testDistance;
				}
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
			for (const testCreep of Find.Creeps(room, testCreepType))
			{
				if (testCreep.EnergyLeftToTake === 0 ||
					(testDistance = Find.Distance(creepPosition, testPosition = testCreep.pos)) >= closestObjectDistance ||
					testCreep.spawning ||
					testCreep.id === creep.id)
				{
					continue;
				}
				else if (testDistance <= 1)
				{
					if (energyGiven !== 0 // On the next tick, we're already within range of a 2nd object to give to
						|| (Log.Succeeded(creep.transfer(testCreep, "energy", testEnergy = Math.min(creep.EnergyLeftToGive, testCreep.EnergyLeftToTake)), creep, testCreep) !== false
							&& (testCreep.EnergyLeftToTake -= testEnergy, creep.EnergyLeftToGive -= testEnergy) === 0) // we're empty
						|| creep.CanMove === false) // We already transferred and can't move anywhere to give remaining energy away
					{
						return energyGiven;
					}

					energyGiven = testEnergy;
				}
				else if (creepType !== testCreepType // Moving to the same creep type results in lots of jiggling around
					&& (x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObject = testCreep;
					closestObjectDistance = testDistance;
				}
			}
		}

		if (closestObject !== undefined && creep.EnergyLeftToTake === 0) // Only move if we will be full
		{
			CreepBehavior.MoveTo(creep, closestObject);
		}

		return energyGiven;
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

		let closestObject: AnyEnergyGivingObject | Creep | Resource | undefined;
		let closestObjectDistance: number = 1000000000; // magnitudes larger than the entire map
		let testPosition: RoomPosition;
		let testDistance: number;
		let testEnergy: number;
		let energyPickedUp: number = 0;

		{
			let nearbyResources: number = 0;
			let nearbyResource: Resource | undefined;
			let nearbyResourceEnergy: number = 1000000000; // magnitudes larger than feasibly possible
			let closestResourceDistance: number = 1000000000; // magnitudes larger than the entire map

			for (const testResource of Find.MyObjects(room, Type.Resource)) // Always do Resources first, since they decay
			{
				if ((testEnergy = testResource.EnergyLeftToGive) === 0 ||
					(testDistance = Find.Distance(creepPosition, testPosition = testResource.pos)) >= closestResourceDistance)
				{
					continue;
				}
				else if (testDistance <= 1)
				{
					++nearbyResources;
					if (testEnergy < nearbyResourceEnergy) // Pick up from the smallest pile first
					{
						nearbyResource = testResource;
						nearbyResourceEnergy = testEnergy;
						closestResourceDistance = 2; // Make sure we only consider distance <= 1 going forward
					}
				}
				else if ((x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObject = testResource;
					closestObjectDistance = closestResourceDistance = testDistance;
				}
			}

			if (nearbyResources !== 0)
			{
				if (Log.Succeeded(creep.pickup(nearbyResource!), creep, nearbyResource) !== false &&
					(nearbyResource!.EnergyLeftToGive -= (energyPickedUp = Math.min(creep.EnergyLeftToTake, nearbyResourceEnergy)),
						creep.EnergyLeftToTake -= energyPickedUp) === 0)
				{
					return energyPickedUp;
				}

				if (nearbyResources !== 1) // nearbyResources >= 2
				{
					closestObject = void 0; // Don't move to the 2nd closest resource
					closestObjectDistance = 2; // If we are within range of a 2nd resource, then make sure we don't move below
				}
			}
		}

		let energyWithdrawn: number = 0;

		for (const testType of typesInPriorityOrder)
		{
			for (const testObject of Find.MyObjects(room, testType))
			{
				if (testObject.EnergyLeftToGive === 0 ||
					(testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance)
				{
					continue;
				}
				else if (testDistance <= 1)
				{
					if (energyWithdrawn !== 0 // On the next tick, we're already within range of a 2nd object to withdraw from
						|| (Log.Succeeded(creep.withdraw(testObject, "energy", testEnergy = Math.min(creep.EnergyLeftToTake, testObject.EnergyLeftToGive)), creep, testObject) !== false
							&& (testObject.EnergyLeftToGive -= testEnergy, creep.EnergyLeftToTake -= testEnergy) === 0)
						|| creep.CanMove === false // We already withdrew and can't move anywhere to withdraw more energy
						|| (closestObject === undefined && closestObjectDistance === 2)) // nearbyResources >= 2, so return to avoid moving
					{
						return energyWithdrawn + energyPickedUp;
					}

					energyWithdrawn = testEnergy;
				}
				else if ((x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObject = testObject;
					closestObjectDistance = testDistance;
				}
			}

			if (closestObject !== undefined) // Only daisy-chain from creeps that are closer to closestObjectToCreep than us
			{
				break;
			}
		}

		if (closestObject !== undefined && creep.EnergyLeftToGive === 0) // Only move if we will be empty
		{
			CreepBehavior.MoveTo(creep, closestObject);
		}

		return energyWithdrawn + energyPickedUp;
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

		if ((sourceEnergy !== 0 || Find.Distance(creep.pos, source.pos) >= source.ticksToRegeneration >> 1) &&
			CreepBehavior.TryBeInRange(creep, source, 1) !== false &&
			sourceEnergy !== 0 &&
			Log.Succeeded(creep.harvest(source), creep, source) !== false)
		{
			creep.EnergyLeftToTake -= Math.min(
				sourceEnergy,
				2 * creep.getActiveBodyparts("work"),
				creep.EnergyLeftToTake);

			return true;
		}

		return false;
	}

	// According to https://docs.screeps.com/simultaneous-actions.html this never counts as an action?
	private static UpgradeController(creep: UpgraderCreep | BuilderCreep): void
	{
		const controller: StructureController = creep.Target;

		if (controller.upgradeBlocked !== 0 &&
			CreepBehavior.TryBeInRange(creep, controller, 3) !== false &&
			creep.EnergyLeftToGive !== 0 &&
			Log.Succeeded(creep.upgradeController(controller), creep, controller) !== false)
		{
			creep.EnergyLeftToGive -= Math.min(
				creep.EnergyLeftToGive,
				creep.getActiveBodyparts("work"));
		}
	}

	private static TryBuild(creep: BuilderCreep | HarvesterCreep): boolean
	{
		const constructionSite: ConstructionSite | undefined = Find.MyObjects(creep.Target.room, Type.ConstructionSite)[0];
		if (constructionSite === undefined)
		{
			if (creep.CreepType !== CreepType.Harvester) // Harvesters shouldn't go that far away
			{
				CreepBehavior.UpgradeController(creep);
			}

			return false;
		}

		if (CreepBehavior.TryBeInRange(creep, constructionSite, 3) !== false &&
			creep.EnergyLeftToGive !== 0 &&
			Log.Succeeded(creep.build(constructionSite), creep, constructionSite) !== false)
		{
			creep.EnergyLeftToGive -= Math.min(
				constructionSite.progressTotal - constructionSite.progress,
				creep.EnergyLeftToGive,
				5 * creep.getActiveBodyparts("work"));

			return true;
		}

		return false;
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
								maxEnergyFlowPerTick = testScore;
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
						maxEnergyFlowPerTick = testScore;
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
								maxEnergyFlowPerTick = testScore;
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
						maxEnergyFlowPerTick = testScore;
					}
				}
			}
		}

		if (bestTarget !== undefined)
		{
			CreepBehavior.MoveTo(runner, bestTarget);
		}
	}

	private static MoveTo(creep: MyCreep, target: RoomObject): false
	{
		// if (creep.CanMove === true && (creep.name === "H9" || creep.name === "R1"))
		// {
		// 	debugger;
		// }

		return creep.CanMove === true
			&& Log.Succeeded(creep.moveTo(target), creep, target) !== false
			&& (creep.CanMove = false);
	}

	private static MoveTowards(creep: MyCreep, direction: DirectionConstant): false
	{
		// if (creep.CanMove === true && (creep.name === "H9" || creep.name === "R1"))
		// {
		// 	debugger;
		// }

		return creep.CanMove === true
			&& Log.Succeeded(creep.move(direction), creep) !== false
			&& (creep.CanMove = false);
	}

	private static Destination(creep: UpgraderCreep | BuilderCreep): RoomPosition
	{
		let destination: { readonly x: number; readonly y: number; readonly room: string; } | undefined;

		return creep.Destination ??= (destination = Memory.creeps[creep.name]?._move?.dest) !== undefined
			? new RoomPosition(destination.x, destination.y, destination.room)
			: creep.Target.pos;
	}
}
