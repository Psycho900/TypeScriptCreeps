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

// Upgrader arrays:
const c_typesUpgradersTakeEnergyFrom = // In priority order
	[
		Type.Tombstone,
		Type.Ruin,
		Type.Container,
		Type.Storage,
		Type.Link,
	] as const;

const c_typesUpgradersGiveEnergyTo = // In priority order
	[
		Type.Extension,
		Type.Spawn,
		Type.Tower,
	] as const;

const c_creepTypesUpgradersGiveEnergyTo = // In priority order
	[
		CreepType.Builder,
		CreepType.Upgrader,
	] as const;

// Builder arrays:
const c_typesBuildersTakeEnergyFrom /**/ = c_typesUpgradersTakeEnergyFrom;
const c_typesBuildersGiveEnergyTo /*  */ = c_typesUpgradersGiveEnergyTo;
const c_creepTypesBuildersGiveEnergyTo = // In priority order
	[
		CreepType.Builder,
	] as const;

// Runner arrays:
const c_typesRunnersAlwaysTakeEnergyFrom /*   */ = c_typesHarvestersTakeEnergyFrom;
const c_typesRunnersAlwaysGiveEnergyTo /*     */ = c_typesUpgradersGiveEnergyTo;
const c_creepTypesRunnersAlwaysGiveEnergyTo /**/ = c_creepTypesBuildersGiveEnergyTo;

export abstract /* static */ class CreepBehavior
{
	public static Act(): void
	{
		for (const creep of Find.MySpawnedCreeps(CreepType.AllHarvestersOrUpgradersOrBuilders)) // First, make sure everything prioritizes the things only they can do
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

		for (const creep of Find.MySpawnedCreeps(CreepType.AllHarvestersOrUpgradersOrBuilders)) // Next, non-runners should give as many resources nearby as possible
		{
			if (creep.EnergyLeftToGive === 0)
			{
				continue;
			}

			switch (creep.CreepType)
			{
				case CreepType.Harvester:
					CreepBehavior.GiveEnergyInRange(creep, (source = creep.Target).pos, source.energy !== 0 ? 2 : Math.max(2, source.ticksToRegeneration >> 1), c_typesHarvestersGiveEnergyTo, c_creepTypesHarvestersGiveEnergyTo);
					continue;

				case CreepType.Upgrader:
					CreepBehavior.GiveEnergyInRange(creep, creep.Target.pos, 4, c_typesUpgradersGiveEnergyTo, c_creepTypesUpgradersGiveEnergyTo);
					continue;

				case CreepType.Builder:
					CreepBehavior.GiveEnergyInRange(creep, creep.Target.pos, 4, c_typesBuildersGiveEnergyTo, c_creepTypesBuildersGiveEnergyTo);
					continue;
			}
		}

		for (const creep of Find.MySpawnedCreeps(CreepType.AllHarvestersOrUpgradersOrBuilders)) // Next, non-runners should take as many nearby resources as possible
		{
			if (creep.EnergyLeftToTake === 0)
			{
				continue;
			}

			switch (creep.CreepType)
			{
				case CreepType.Harvester:
					if (creep.EnergyLeftToGive === 0) // Harvesters only pick up if they have a place to put it
					{
						CreepBehavior.TakeEnergyInRange(creep, (source = creep.Target).pos, source.energy !== 0 ? 2 : Math.max(2, source.ticksToRegeneration >> 1), c_typesHarvestersTakeEnergyFrom);
					}

					continue;

				case CreepType.Upgrader:
					CreepBehavior.TakeEnergyInRange(creep, creep.Target.pos, 4, c_typesUpgradersTakeEnergyFrom);
					continue;

				case CreepType.Builder:
					CreepBehavior.TakeEnergyInRange(creep, creep.Target.pos, 4, c_typesBuildersTakeEnergyFrom);
					continue;
			}
		}

		for (const creep of Find.MySpawnedCreeps(CreepType.Runner)) // Runners should only give/take nearby resources NOT handled by others
		{
			if (creep.EnergyLeftToGive !== 0)
			{
				CreepBehavior.GiveEnergyInRange(creep, creep.pos, 1, c_typesRunnersAlwaysGiveEnergyTo, c_creepTypesRunnersAlwaysGiveEnergyTo);
			}

			if (creep.EnergyLeftToTake !== 0)
			{
				CreepBehavior.TakeEnergyInRange(creep, creep.pos, 1, c_typesRunnersAlwaysTakeEnergyFrom);
			}
		}
	}

	private static GiveEnergyInRange(
		creep: HarvesterCreep | RunnerCreep | UpgraderCreep | BuilderCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[],
		creepTypesInPriorityOrder: readonly AnyEnergyTakingCreepType[]): void
	{
		CreepBehavior.InternalGiveEnergyInRange(
			creep,
			targetPosition,
			targetRange,
			typesInPriorityOrder,
			creepTypesInPriorityOrder);

		if ((creep.fatigue !== 0 && Find.IsSameRoomAndWithinRange(creep.pos, targetPosition, targetRange + 1) === false) ||
			(creep.CreepType === CreepType.Harvester && CreepBehavior.IsKingOfTheHill(creep) !== false))
		{
			CreepBehavior.DropAll(creep);
		}
	}

	private static InternalGiveEnergyInRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[],
		creepTypesInPriorityOrder: readonly AnyEnergyTakingCreepType[]): void
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
		let hasGivenEnergy: boolean = false;

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
					if (hasGivenEnergy !== false // On the next tick, we're already within range of a 2nd object to give to
						|| (Log.Succeeded(creep.transfer(testObject, "energy", testEnergy = Math.min(creep.EnergyLeftToGive, testObject.EnergyLeftToTake)), creep, testObject) !== false
							&& (testObject.EnergyLeftToTake -= testEnergy, creep.EnergyLeftToGive -= testEnergy) === 0) // we're empty
						|| creep.CanMove === false) // We already transferred and can't move anywhere to give remaining energy away
					{
						return;
					}

					hasGivenEnergy = true;
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
					if (hasGivenEnergy !== false // On the next tick, we're already within range of a 2nd object to give to
						|| (Log.Succeeded(creep.transfer(testCreep, "energy", testEnergy = Math.min(creep.EnergyLeftToGive, testCreep.EnergyLeftToTake)), creep, testCreep) !== false
							&& (testCreep.EnergyLeftToTake -= testEnergy, creep.EnergyLeftToGive -= testEnergy) === 0) // we're empty
						|| creep.CanMove === false) // We already transferred and can't move anywhere to give remaining energy away
					{
						return;
					}

					hasGivenEnergy = true;
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
	}

	private static TakeEnergyInRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyGivingType[]): void
	{
		const creepPosition: RoomPosition = creep.pos;

		if (Find.IsSameRoomAndWithinRange(creepPosition, targetPosition, targetRange) === false)
		{
			return; // too far away from destination
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
					if (++nearbyResources, testEnergy < nearbyResourceEnergy) // Pick up from the smallest pile first
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
					(nearbyResource!.EnergyLeftToGive -= (testEnergy = Math.min(creep.EnergyLeftToTake, nearbyResourceEnergy)),
						creep.EnergyLeftToTake -= testEnergy) === 0)
				{
					return;
				}

				if (nearbyResources !== 1) // nearbyResources >= 2
				{
					closestObject = void 0; // Don't move to the 2nd closest resource
					closestObjectDistance = 2; // If we are within range of a 2nd resource, then make sure we don't move below
				}
			}
		}

		let hasWithdrawnEnergy: boolean = false;

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
					if (hasWithdrawnEnergy !== false // On the next tick, we're already within range of a 2nd object to withdraw from
						|| (Log.Succeeded(creep.withdraw(testObject, "energy", testEnergy = Math.min(creep.EnergyLeftToTake, testObject.EnergyLeftToGive)), creep, testObject) !== false
							&& (testObject.EnergyLeftToGive -= testEnergy, creep.EnergyLeftToTake -= testEnergy) === 0)
						|| creep.CanMove === false // We already withdrew and can't move anywhere to withdraw more energy
						|| (closestObject === undefined && closestObjectDistance === 2)) // nearbyResources >= 2, so return to avoid moving
					{
						return;
					}

					hasWithdrawnEnergy = true;
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
	}

	// Return true iff full and standing on the hill of resources containing
	// the most energy of all nearby resources (to coalesce resource piles).
	private static IsKingOfTheHill(creep: HarvesterCreep): boolean
	{
		if (creep.EnergyLeftToTake !== 0)
		{
			return false;
		}

		// const source: Source = creep.Target;
		const sourcePosition: RoomPosition = creep.Target.pos;
		let highestEnergyResource: Resource | undefined;
		let highestEnergyResourceEnergy: number = 0;

		for (const resource of Find.MyObjects(creep.room, Type.Resource))
		{
			if (resource.EnergyLeftToGive > highestEnergyResourceEnergy &&
				Find.IsSameRoomAndWithinRange(sourcePosition, resource.pos, 1) !== false)
			{
				highestEnergyResource = resource;
				highestEnergyResourceEnergy = resource.EnergyLeftToGive;
			}
		}

		return highestEnergyResource !== undefined
			&& highestEnergyResource.pos.isEqualTo(creep.pos);
	}

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
		creep: HarvesterCreep | UpgraderCreep | BuilderCreep,
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
			|| (runner = Find.Closest(creepPosition, Find.MySpawnedCreeps(CreepType.Runner))) === undefined
			|| runner.CanMove === false)
		{
			// Cached move paths here can cause "MoveTo" to make the creep go backwards down narrow hallways
			// return CreepBehavior.MoveTowards(creep, creepPosition.getDirectionTo(target));
			return CreepBehavior.MoveTo(creep, target); // Or does it? (It may have been a different bug)
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

	private static MoveTo(creep: MyCreep, target: RoomObject): false
	{
		// if (creep.CanMove === true && (creep.name === "R38" || creep.name === "H21"))
		// {
		// 	debugger;
		// }

		return creep.CanMove === true
			&& Log.Succeeded(creep.moveTo(target), creep, target) !== false
			&& (creep.CanMove = false);
	}

	private static MoveTowards(creep: MyCreep, direction: DirectionConstant): false
	{
		// if (creep.CanMove === true && (creep.name === "R38" || creep.name === "H21"))
		// {
		// 	debugger;
		// }

		return creep.CanMove === true
			&& Log.Succeeded(creep.move(direction), creep) !== false
			&& (creep.CanMove = false);
	}

	// private static Destination(creep: HarvesterCreep | UpgraderCreep | BuilderCreep): RoomPosition | null
	// {
	// 	let destination: { readonly x: number; readonly y: number; readonly room: string; } | undefined;
	//
	// 	return (destination = Memory.creeps[creep.name]?._move?.dest) != null
	// 		? new RoomPosition(destination.x, destination.y, destination.room)
	// 		: null;
	// }
}
