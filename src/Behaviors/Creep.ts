import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

type AnyEnergyGivingObject = ToInterface<AnyEnergyGivingType>;
type AnyEnergyTakingObject = ToInterface<AnyEnergyTakingType>;

// Harvester arrays:
const c_typesHarvestersGiveEnergyTo = // In priority order
	[
		Type.Extension,
		Type.Spawn,
		Type.Tower,
		Type.Link,
		Type.Container,
		Type.Storage,
	] as const;

const c_typesHarvestersTakeEnergyFrom = // In priority order
	[
		Type.Tombstone,
		Type.Ruin,
	] as const;

const c_creepTypesHarvestersGiveEnergyTo = // In priority order
	[
		CreepType.Builder,
		CreepType.Upgrader,
		CreepType.Runner,
		CreepType.Harvester,
	] as const;

// Upgrader arrays:
const c_typesUpgradersGiveEnergyTo = // In priority order
	[
		Type.Extension,
		Type.Spawn,
		Type.Tower,
	] as const;

const c_typesUpgradersTakeEnergyFrom = // In priority order
	[
		Type.Tombstone,
		Type.Ruin,
		Type.Container,
		Type.Storage,
		Type.Link,
	] as const;

const c_creepTypesUpgradersGiveEnergyTo = // In priority order
	[
		CreepType.Builder,
		CreepType.Upgrader,
	] as const;

// Builder arrays:
const c_typesBuildersGiveEnergyTo /*  */ = c_typesUpgradersGiveEnergyTo;
const c_typesBuildersTakeEnergyFrom /**/ = c_typesUpgradersTakeEnergyFrom;
const c_creepTypesBuildersGiveEnergyTo = // In priority order
	[
		CreepType.Builder,
	] as const;

export abstract /* static */ class CreepBehavior
{
	public static Act(): void
	{
		for (const creep of Find.MySpawnedCreeps()) // Produce or Consume Resources
		{
			switch (creep.CreepType)
			{
				case CreepType.Harvester:
					CreepBehavior.HarvestOrMove(creep as HarvesterCreep);
					continue;

				case CreepType.Upgrader:
					CreepBehavior.UpgradeOrMove(creep as UpgraderCreep);
					continue;

				case CreepType.Builder:
					CreepBehavior.BuildOrMove(creep as BuilderCreep);
					continue;
			}
		}

		for (const creep of Find.MySpawnedCreeps()) // Take or Give Resources
		{
			switch (creep.CreepType)
			{
				case CreepType.Harvester:
					if (creep.EnergyLeftToTake !== 0)
					{
						CreepBehavior.TakeEnergyInRange(creep, creep.Target.pos, 2, c_typesHarvestersTakeEnergyFrom);
					}

					continue;

				case CreepType.Upgrader:
					if (creep.EnergyLeftToGive !== 0)
					{
						CreepBehavior.GiveEnergyInRange(creep, creep.Target.pos, 4, c_typesUpgradersGiveEnergyTo, c_creepTypesUpgradersGiveEnergyTo);
					}

					continue;

				case CreepType.Builder:
					if (creep.EnergyLeftToGive !== 0)
					{
						CreepBehavior.GiveEnergyInRange(creep, creep.Target.pos, 4, c_typesBuildersGiveEnergyTo, c_creepTypesBuildersGiveEnergyTo);
					}

					continue;
			}
		}

		for (const creep of Find.MySpawnedCreeps()) // Give or Take Resources
		{
			switch (creep.CreepType)
			{
				case CreepType.Harvester:
					if (creep.EnergyLeftToGive !== 0)
					{
						CreepBehavior.GiveEnergyInRange(creep, creep.Target.pos, 2, c_typesHarvestersGiveEnergyTo, c_creepTypesHarvestersGiveEnergyTo);
					}

					continue;

				case CreepType.Upgrader:
					if (creep.EnergyLeftToTake !== 0)
					{
						CreepBehavior.TakeEnergyInRange(creep, creep.Target.pos, 4, c_typesUpgradersTakeEnergyFrom);
					}

					continue;

				case CreepType.Builder:
					if (creep.EnergyLeftToTake !== 0)
					{
						CreepBehavior.TakeEnergyInRange(creep, creep.Target.pos, 4, c_typesBuildersTakeEnergyFrom);
					}

					continue;
			}
		}
	}

	private static GiveEnergyInRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[],
		creepTypesInPriorityOrder: readonly number[]): void
	{
		CreepBehavior.InternalGiveEnergyInRange(
			creep,
			targetPosition,
			targetRange,
			typesInPriorityOrder,
			creepTypesInPriorityOrder);

		if (creep.fatigue !== 0 && Find.IsSameRoomAndWithinRange(creep, targetPosition, targetRange) === false)
		{
			CreepBehavior.DropAll(creep);
		}
	}

	private static InternalGiveEnergyInRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[],
		creepTypesInPriorityOrder: readonly number[]): void
	{
		const room: Room = creep.room;
		const creepPosition: RoomPosition = creep.pos;

		let x: number;
		let y: number;

		if (room.name === targetPosition.roomName)
		{
			x = targetPosition.x;
			y = targetPosition.y;
		}
		else // When going to a different room, then only give without moving, so we don't move away from our target room
		{
			targetRange = 1;
			x = creepPosition.x;
			y = creepPosition.y;
		}

		let minX: number = x - targetRange;
		let maxX: number = x + targetRange;
		let minY: number = y - targetRange;
		let maxY: number = y + targetRange;

		let closestObjectToCreep: AnyEnergyTakingObject | Creep | null = null;
		let closestObjectToCreepDistance: number = 1000000; // magnitudes larger than the entire map
		let testPosition: RoomPosition;
		let testDistanceToCreep: number;

		for (const type of typesInPriorityOrder)
		{
			for (const testObject of Find.MyObjects(room, type))
			{
				if (testObject.EnergyLeftToTake === 0 ||
					(testDistanceToCreep = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectToCreepDistance)
				{
					continue;
				}
				else if (testDistanceToCreep <= 1)
				{
					return CreepBehavior.TransferEnergyTo(creep, testObject);
				}
				else if ((x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObjectToCreep = testObject;
					closestObjectToCreepDistance = testDistanceToCreep;
				}
			}

			if (closestObjectToCreep !== null) // Only daisy-chain it to creeps that are closer to closestObjectToCreep than us
			{
				const closestObjectToCreepDistanceMinus1 = closestObjectToCreepDistance - 1;

				if ((x = creepPosition.x) < (y = (testPosition = closestObjectToCreep.pos).x)) // [sic] (pretend "y" is "x2")
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

		// See if we can daisy-chain our energy closer to our target to avoid moving
		for (const creepType of creepTypesInPriorityOrder)
		{
			for (const testObject of Find.CreepsOfTypes(room, creepType))
			{
				if (testObject.EnergyLeftToTake === 0 ||
					(testDistanceToCreep = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectToCreepDistance ||
					testObject.spawning ||
					testObject.id === creep.id)
				{
					continue;
				}
				else if (testDistanceToCreep <= 1)
				{
					return CreepBehavior.TransferEnergyTo(creep, testObject);
				}
				else if ((x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObjectToCreep = testObject;
					closestObjectToCreepDistance = testDistanceToCreep;
				}
			}
		}

		if (closestObjectToCreep !== null && creep.EnergyLeftToTake === 0) // Only move if we will be full
		{
			CreepBehavior.Move(creep, closestObjectToCreep);
		}
	}

	private static TransferEnergyTo(creep: MyCreep, target: AnyEnergyTakingObject | Creep): void
	{
		const energyToTransfer: number = Math.min(creep.EnergyLeftToGive, target.EnergyLeftToTake);
		if (energyToTransfer !== 0 && Log.Succeeded(creep.transfer(target, "energy", energyToTransfer), creep, target) !== false)
		{
			creep.EnergyLeftToGive -= energyToTransfer;
			target.EnergyLeftToTake -= energyToTransfer;
		}
	}

	private static TakeEnergyInRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyGivingType[]): void
	{
		if (Find.IsSameRoomAndWithinRange(creep, targetPosition, targetRange) === false)
		{
			return; // too far away from destination
		}

		const room: Room = creep.room;
		const creepPosition: RoomPosition = creep.pos;
		let x: number;
		let y: number;

		if (room.name === targetPosition.roomName)
		{
			x = targetPosition.x;
			y = targetPosition.y;
		}
		else // When going to a different room, then only take without moving, so we don't move away from our target room
		{
			targetRange = 1;
			x = creepPosition.x;
			y = creepPosition.y;
		}

		const minX: number = x - targetRange;
		const maxX: number = x + targetRange;
		const minY: number = y - targetRange;
		const maxY: number = y + targetRange;

		let closestObjectToCreep: AnyEnergyGivingObject | Creep | Resource | null = null;
		let closestObjectToCreepDistance: number = 1000000; // magnitudes larger than the entire map
		let testPosition: RoomPosition;
		let testDistanceToCreep: number;

		for (const testResource of Find.MyObjects(room, Type.Resource)) // Always do Resources first, since they decay
		{
			if (testResource.EnergyLeftToGive === 0 ||
				(testDistanceToCreep = Find.Distance(creepPosition, testPosition = testResource.pos)) >= closestObjectToCreepDistance)
			{
				continue;
			}
			else if (testDistanceToCreep <= 1)
			{
				const energyToPickup: number = Math.min(creep.EnergyLeftToTake, testResource.EnergyLeftToGive);
				if (energyToPickup !== 0 && Log.Succeeded(creep.pickup(testResource), creep, testResource) !== false)
				{
					testResource.EnergyLeftToGive -= energyToPickup;
					if ((creep.EnergyLeftToTake -= energyToPickup) === 0)
					{
						return;
					}
				}

				break; // Each creep can only pickup once per tick
			}
			else if ((x = testPosition.x) >= minX && x <= maxX
				&& (y = testPosition.y) >= minY && y <= maxY)
			{
				closestObjectToCreep = testResource;
				closestObjectToCreepDistance = testDistanceToCreep;
			}
		}

		for (const type of typesInPriorityOrder)
		{
			for (const testObject of Find.MyObjects(room, type))
			{
				if (testObject.EnergyLeftToGive === 0 ||
					(testDistanceToCreep = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectToCreepDistance)
				{
					continue;
				}
				else if (testDistanceToCreep <= 1)
				{
					const energyToWithdraw: number = Math.min(creep.EnergyLeftToTake, testObject.EnergyLeftToGive);
					if (energyToWithdraw !== 0 && Log.Succeeded(creep.withdraw(testObject, "energy", energyToWithdraw), creep, testObject) !== false)
					{
						creep.EnergyLeftToTake -= energyToWithdraw;
						testObject.EnergyLeftToGive -= energyToWithdraw;
					}

					return;
				}
				else if ((x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObjectToCreep = testObject;
					closestObjectToCreepDistance = testDistanceToCreep;
				}
			}

			if (closestObjectToCreep !== null) // Only daisy-chain it to creeps that are closer to closestObjectToCreep than us
			{
				// const closestObjectToCreepDistanceMinus1 = closestObjectToCreepDistance - 1;
				//
				// if ((x = creepPosition.x) < (y = (testPosition = closestObjectToCreep.pos).x)) // [sic] (pretend "y" is "x2")
				// {
				// 	minX = Math.max(minX, y - closestObjectToCreepDistanceMinus1); // [sic] (pretend "y" is "x2")
				// 	maxX = Math.min(maxX, x + closestObjectToCreepDistanceMinus1);
				// }
				// else
				// {
				// 	minX = Math.max(minX, x - closestObjectToCreepDistanceMinus1);
				// 	maxX = Math.min(maxX, y + closestObjectToCreepDistanceMinus1); // [sic] (pretend "y" is "x2")
				// }
				//
				// if ((y = creepPosition.y) < (x = testPosition.y)) // [sic] (pretend "x" is "y2")
				// {
				// 	minY = Math.max(minY, x - closestObjectToCreepDistanceMinus1); // [sic] (pretend "x" is "y2")
				// 	maxY = Math.min(maxY, y + closestObjectToCreepDistanceMinus1);
				// }
				// else
				// {
				// 	minY = Math.max(minY, y - closestObjectToCreepDistanceMinus1);
				// 	maxY = Math.min(maxY, x + closestObjectToCreepDistanceMinus1); // [sic] (pretend "x" is "y2")
				// }

				break;
			}
		}

		// IF YOU ADD THIS BACK IN, THEN ADD BACK IN THE COMMENTED CODE ABOVE TOO!!
		// // See if we can daisy-chain our energy closer to our target to avoid moving
		// for (const creepType of creepTypesInPriorityOrder)
		// {
		// 	for (const testObject of Find.CreepsOfTypes(room, creepType))
		// 	{
		// 		if ((testEnergy = testObject.store.energy) === 0
		// 			|| testObject.spawning
		// 			|| (testDistanceToCreep = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectToCreepDistance
		// 			|| testObject.id === creep.id)
		// 		{
		// 			continue;
		// 		}
		// 		else if (testDistanceToCreep <= 1)
		// 		{
		// 			if (Log.Succeeded(testObject.transfer(creep, "energy", testEnergy = Math.min(
		// 				testEnergy >> (testObject.IsAny(CreepType.AllConsumers) ? 1 : 0), // Not sure how much here
		// 				creepEnergyCapacity - expectedEnergyNextTick)), creep, testObject))
		// 			{
		// 				return expectedEnergyNextTick + testEnergy;
		// 			}
		// 		}
		// 		else if ((x = testPosition.x) >= minX && x <= maxX
		// 			&& (y = testPosition.y) >= minY && y <= maxY)
		// 		{
		// 			closestObjectToCreep = testObject;
		// 			closestObjectToCreepDistance = testDistanceToCreep;
		// 		}
		// 	}
		// }

		if (closestObjectToCreep !== null && creep.EnergyLeftToGive === 0) // Only move if we will be empty
		{
			CreepBehavior.Move(creep, closestObjectToCreep);
		}
	}

	private static DropAll(creep: MyCreep): void
	{
		for (const resourceType in creep.store)
		{
			if (Log.Succeeded(creep.drop(resourceType as ResourceConstant), creep) && resourceType === "energy")
			{
				creep.EnergyLeftToGive = 0;
			}
		}
	}

	private static HarvestOrMove(creep: HarvesterCreep): void
	{
		const source: Source = creep.Target;

		if (CreepBehavior.TryBeInRange(creep, source, 1) !== false &&
			source.energy !== 0 &&
			Log.Succeeded(creep.harvest(source), creep, source) !== false)
		{
			creep.EnergyLeftToTake -= Math.min(
				source.energy,
				2 * creep.getActiveBodyparts("work"),
				creep.EnergyLeftToTake);
		}
	}

	private static UpgradeOrMove(creep: UpgraderCreep | BuilderCreep): void
	{
		const controller: StructureController = creep.Target;

		if (CreepBehavior.TryBeInRange(creep, controller, 3) !== false &&
			creep.EnergyLeftToGive !== 0 &&
			controller.upgradeBlocked !== 0 &&
			Log.Succeeded(creep.upgradeController(controller), creep, controller) !== false)
		{
			creep.EnergyLeftToGive -= Math.min(
				creep.EnergyLeftToGive,
				creep.getActiveBodyparts("work"));
		}
	}

	private static BuildOrMove(creep: BuilderCreep): void
	{
		const constructionSite: ConstructionSite | undefined = Find.MyObjects(creep.Target.room, Type.ConstructionSite)[0];
		if (constructionSite === undefined)
		{
			return CreepBehavior.UpgradeOrMove(creep);
		}
		else if (CreepBehavior.TryBeInRange(creep, constructionSite, 3) !== false &&
			creep.EnergyLeftToGive !== 0 &&
			Log.Succeeded(creep.build(constructionSite), creep, constructionSite) !== false)
		{
			creep.EnergyLeftToGive -= Math.min(
				creep.EnergyLeftToGive,
				5 * creep.getActiveBodyparts("work"));
		}
	}

	private static TryBeInRange(creep: MyCreep, target: RoomObject, range: number): boolean
	{
		return Find.IsSameRoomAndWithinRange(creep, target.pos, range) !== false // Anything after this point always returns false
			|| CreepBehavior.Move(creep, target);
	}

	private static Move(creep: MyCreep, target: RoomObject): false
	{
		return creep.CanMove === true
			&& Log.Succeeded(creep.moveTo(target), creep, target) !== false
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

Creep.prototype.Is = function(creepType: number): boolean
{
	return this.CreepType === creepType;
};

Creep.prototype.IsAny = function(creepType: number): boolean
{
	return (this.CreepType & creepType) !== 0;
};
