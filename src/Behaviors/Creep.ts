import { Collection } from "../Collection";
import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_moveOptions =
	{
		reusePath: 15,
		visualizePathStyle:
		{
			stroke: "yellow",
			lineStyle: "dashed",
		},
	} as const;

// Max Sign Length is:     "00_345678_10_345678_20_345678_30_345678_40_345678_50_345678_60_345678_70_345678_80_345678_90_345678_"; // 100 chars
const c_signText: string = "Using TypeScript for Screeps is a game changer =)";

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

const c_creepTypesConsumersTakeEnergyFrom = // In priority order
	[
		CreepType.Harvester,
		CreepType.Runner,
		CreepType.Upgrader,
		CreepType.Builder,
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

type AnyEnergyGivingObject = ToInterface<AnyEnergyGivingType>;
type AnyEnergyTakingObject = ToInterface<AnyEnergyTakingType>;

export abstract /* static */ class CreepBehavior
{
	public static Act(this: void): void
	{
		for (const creep of Find.MySpawnedCreeps(CreepType.All)) // Get off room boundaries
		{
			const creepPosition: RoomPosition = creep.pos;
			if (creepPosition.x === 0 || creepPosition.x === 49 || creepPosition.y === 0 || creepPosition.y === 49)
			{
				CreepBehavior.MoveTowards(creep, creepPosition.getDirectionTo(Find.Center(creepPosition.roomName)));
			}
		}

		for (const creep of Find.MySpawnedCreeps(CreepType.All)) // First, make sure non-runners prioritizes the things only they can do
		{
			switch (creep.CreepType)
			{
				case CreepType.Harvester:
					{
						if (CreepBehavior.TryHarvest(creep, creep.Target) !== false)
						{
							continue;
						}

						const constructionSites: readonly ConstructionSite[] = Find.MyObjects(creep.Target.room, Type.ConstructionSite);

						if (constructionSites.length !== 0 && CreepBehavior.TryBuild(creep, Find.Closest(creep.pos, constructionSites)!) !== false)
						{
							continue;
						}

						CreepBehavior.TryRepair(creep);
						continue;
					}

				// @ts-expect-error: fall through below
				case CreepType.Builder:
					{
						const constructionSites: readonly ConstructionSite[] = Find.MyObjects(creep.Target.room, Type.ConstructionSite);
						if (constructionSites.length !== 0)
						{
							if (CreepBehavior.TryBuild(creep, constructionSites[0]) !== false || CreepBehavior.TryRepair(creep) !== false)
							{
								continue;
							}

							const source: Source | undefined = Find.Closest(creep.pos, Find.MyObjects(creep.room, Type.Source));

							if (source !== undefined
								&& Find.IsSameRoomAndWithinRange(constructionSites[0].pos, source.pos, 4) !== false
								&& CreepBehavior.TryHarvest(creep, source)) // Only harvest near the current construction site
							{
								continue;
							}

							continue;
						}
					}

				/* fall through */
				case CreepType.Upgrader: // eslint-disable-next-line @typescript-eslint/no-unused-expressions
					CreepBehavior.TryUpgradeController(creep) !== false || CreepBehavior.TryRepair(creep);
					continue;

				case CreepType.Claimer:
					CreepBehavior.TryClaim(creep);
					continue;

				case CreepType.Attacker:
					CreepBehavior.TryAttack(creep);
					continue;
			}
		}

		for (const creep of Find.MySpawnedCreeps(CreepType.All)) // Next, non-runners should give & take as many nearby resources as possible
		{
			switch (creep.CreepType)
			{
				case CreepType.Harvester:
					{
						const source: Source = creep.Target;
						const rangeFromSource: number = source.energy !== 0 ? 2 : Math.max(2, ((source.ticksToRegeneration >> 3) - 4) | 0);

						if (creep.EnergyLeftToGive !== 0 && creep.EnergyLeftToTake === 0)
						{
							CreepBehavior.GiveEnergyInRange(creep, source.pos, rangeFromSource, c_typesHarvestersGiveEnergyTo, c_creepTypesHarvestersGiveEnergyTo);
						}
						else if (creep.EnergyLeftToTake !== 0 && creep.EnergyLeftToGive <= 10)
						{
							CreepBehavior.TakeEnergyInRange(creep, source.pos, rangeFromSource, c_typesHarvestersTakeEnergyFrom, Collection.c_empty);
						}

						continue;
					}

				case CreepType.Upgrader:
				case CreepType.Builder:
					{
						const targetPosition: RoomPosition = (Find.MyObjects(creep.Target.room, Type.ConstructionSite)[0] || creep.Target).pos;

						if (creep.EnergyLeftToTake !== 0 && creep.EnergyLeftToGive <= 10)
						{
							CreepBehavior.TakeEnergyInRange(creep, targetPosition, 4, c_typesConsumersTakeEnergyFrom, c_creepTypesConsumersTakeEnergyFrom);
						}
						else if (creep.EnergyLeftToGive !== 0 && creep.EnergyLeftToTake <= 25)
						{
							CreepBehavior.GiveEnergyInRange(creep, targetPosition, 4, c_typesConsumersGiveEnergyTo, c_creepTypesConsumersGiveEnergyTo);
						}

						continue;
					}
			}
		}

		for (const room of Find.s_visibleRooms) // Prepare for runners by setting Energy banks's EnergyLeftToGive or EnergyLeftToTake to 0 depending on position
		{
			if (room.controller === undefined)
			{
				continue;
			}

			const constructionSites: readonly ConstructionSite[] = Find.MyObjects(room, Type.ConstructionSite);
			const controllerPosition: RoomPosition = room.controller.pos;

			if (constructionSites.length !== 0)
			{
				const constructionSitePosition: RoomPosition = constructionSites[0].pos;

				for (const type of c_energyBanksThatGiveAndTakeEnergy)
				{
					for (const testEnergyBank of Find.MyObjects(room, type))
					{
						const testPosition: RoomPosition = testEnergyBank.pos;

						if (Find.IsSameRoomAndWithinRange(testPosition, constructionSitePosition, 4) !== false)
						{
							testEnergyBank.EnergyLeftToGive = 0; // Do not take from energy banks near construction sites
							continue;
						}

						testEnergyBank.EnergyLeftToTake = 0; // Do not give to energy banks (that are probably) near sources

						if (Find.IsSameRoomAndWithinRange(testPosition, controllerPosition, 4) !== false)
						{
							testEnergyBank.EnergyLeftToGive = 0; // Do not take from energy banks near controllers
						}
					}
				}
			}
			else for (const type of c_energyBanksThatGiveAndTakeEnergy) // no constructionSites
			{
				for (const testEnergyBank of Find.MyObjects(room, type))
				{
					if (Find.IsSameRoomAndWithinRange(testEnergyBank.pos, controllerPosition, 4) !== false)
					{
						testEnergyBank.EnergyLeftToGive = 0; // Do not take from energy banks near controllers
						continue;
					}

					testEnergyBank.EnergyLeftToTake = 0; // Do not give to energy banks (that are probably) near sources
				}
			}
		}

		// Runners
		{
			const runners: readonly RunnerCreep[] = Find.MySpawnedCreeps(CreepType.Runner);

			for (const runner of runners) // Runners should only give/take nearby resources NOT handled by others
			{
				if (runner.getActiveBodyparts("work") !== 0)
				{
					CreepBehavior.TryRepair(runner);
				}

				const energyGiven: number = runner.EnergyLeftToGive === 0
					? 0
					: CreepBehavior.GiveEnergyInRange(
						runner,
						runner.pos,
						1,
						c_typesHarvestersGiveEnergyTo,
						c_creepTypesConsumersGiveEnergyTo);

				if (runner.EnergyLeftToTake !== 0)
				{
					runner.EnergyLeftToGive += CreepBehavior.TakeEnergyInRange(
						runner,
						runner.pos,
						1,
						c_typesConsumersTakeEnergyFrom,
						c_creepTypesConsumersTakeEnergyFrom);
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
		creepTypesInPriorityOrder: readonly AnyEnergyCreepType[]): number // Returns amount of energy given
	{
		let energyGiven: number = CreepBehavior.InternalGiveEnergyInRange(
			creep,
			targetPosition,
			targetRange,
			typesInPriorityOrder,
			creepTypesInPriorityOrder);

		if (creep.fatigue !== 0 && Find.IsSameRoomAndWithinRange(creep.pos, targetPosition, targetRange + 1) === false) // ||
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
		creepTypesInPriorityOrder: readonly AnyEnergyCreepType[]): number // Returns amount of energy given
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

				if (testDistance > 1)
				{
					if ((x = testPosition.x) >= minX && x <= maxX &&
						(y = testPosition.y) >= minY && y <= maxY)
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
					testDistance === 0) // || // 0 Distance means testObject == this creep
				// (creepType === testCreepType && ))
				{
					continue;
				}

				if (testDistance !== 1)
				{
					if (creepType !== testCreepType &&
						(x = testPosition.x) >= minX && x <= maxX &&
						(y = testPosition.y) >= minY && y <= maxY)
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

			if (Find.IsSameRoomAndWithinRange(targetPosition, closestObjectPosition, targetRange - 1) !== false)
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
		typesInPriorityOrder: readonly AnyEnergyGivingType[],
		creepTypesInPriorityOrder: readonly AnyEnergyCreepType[]): number // Returns amount of energy taken
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
		let minX: number = x - targetRange;
		let maxX: number = x + targetRange;
		let minY: number = y - targetRange;
		let maxY: number = y + targetRange;

		let energyToPickUp: number = 0;
		let closestObject: AnyEnergyGivingObject | Resource | Creep | undefined;
		let closestObjectDistance: number = Find.Distance(creepPosition, targetPosition) + targetRange + 1;

		let testPosition: RoomPosition;
		let testDistance: number;
		let testEnergy: number;
		let testObject: AnyEnergyGivingObject | Resource | Creep;
		let testObjects: readonly (AnyEnergyGivingObject | Resource)[] = Find.MyObjects(room, Type.Resource);
		let testObjectIndex: number = testObjects.length;

		while (testObjectIndex-- !== 0)
		{
			if ((testEnergy = (testObject = testObjects[testObjectIndex]).EnergyLeftToGive) === 0 ||
				((testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance))
			{
				continue;
			}

			if (testDistance > 1)
			{
				if ((x = testPosition.x) >= minX && x <= maxX &&
					(y = testPosition.y) >= minY && y <= maxY)
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

				if (testDistance > 1)
				{
					if ((x = testPosition.x) >= minX && x <= maxX &&
						(y = testPosition.y) >= minY && y <= maxY)
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

			if (closestObject !== undefined) // Only daisy-chain it from creeps that are closer to closestObjectToCreep than us
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
				if ((testEnergy = (testObject = testCreeps[testCreepIndex]).EnergyLeftToGive) === 0 ||
					testObject.spawning !== false ||
					((testDistance = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectDistance) ||
					testDistance === 0) // 0 Distance means testObject == this creep
				{
					continue;
				}

				if (testDistance !== 1)
				{
					if (creepType !== testCreepType &&
						(x = testPosition.x) >= minX && x <= maxX &&
						(y = testPosition.y) >= minY && y <= maxY)
					{
						closestObject = testObject; // Moving to the same creep type results in lots of wasteful jiggling around
						closestObjectDistance = testDistance;
					}

					continue;
				}

				return energyToWithdraw + energyToPickUp;
			}

			if (closestObject !== undefined && closestObject.Type === Type.Creep)
			{
				break;
			}
		}

		if (closestObject !== undefined && /* creep.EnergyLeftToGive === 0 && */ creep.CanMove === true) // Only move if we will be empty?
		{
			const closestObjectPosition: RoomPosition = closestObject.pos;

			if (Find.IsSameRoomAndWithinRange(targetPosition, closestObjectPosition, targetRange - 1 - (Game.time & 1)) !== false)
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
				if (creep.EnergyLeftToGive !== 0 && Log.Succeeded(creep.drop(resourceType), creep))
				{
					creep.EnergyLeftToGive = 0;
				}

				continue;
			}

			if (RESOURCES_ALL.includes(resourceType))
			{
				Log.Succeeded(creep.drop(resourceType), creep, resourceType);
			}
		}
	}

	private static TryHarvest(creep: HarvesterCreep | UpgraderCreep | BuilderCreep, source: Source): boolean
	{
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

		if (CreepBehavior.TrySign(creep, controller) !== false)
		{
			return false;
		}

		if (controller.my !== true ||
			controller.upgradeBlocked === 0 ||
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
		let lowestHitPoints: number = 750000;

		for (const structure of Find.MyObjects(creep.room, Type.AllStructures))
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

	private static TryClaim(creep: ClaimerCreep): boolean
	{
		return CreepBehavior.TryClaimRoom(creep, "W32S28")
			|| CreepBehavior.TryClaimRoom(creep, "W32S29")
			|| CreepBehavior.TryClaimRoom(creep, "W31S29");
	}

	private static TryClaimRoom(creep: ClaimerCreep, targetRoomName: string): boolean
	{
		const targetRoom: Room | undefined = Game.rooms[targetRoomName];
		const targetController: StructureController | undefined = targetRoom && targetRoom.controller;
		if (targetController === undefined)
		{
			CreepBehavior.MoveTo(creep, Find.Center(targetRoomName)); // Move towards non-visible room
			return true;
		}

		if (CreepBehavior.TrySign(creep, targetController) !== false)
		{
			return true;
		}

		if (targetController.my !== false)
		{
			return false; // We already signed it. Claim the next controller in the list
		}

		if (Find.IsSameRoomAndWithinRange(creep.pos, targetController.pos, 1) === false)
		{
			CreepBehavior.MoveTo(creep, targetController.pos);
			return true;
		}

		if (targetController.level !== 0)
		{
			Log.Succeeded(creep.attackController(targetController), creep, targetController);
			return true;
		}

		// On successfully claiming, start moving to the next controller in the list immediately
		return Log.Succeeded(creep.claimController(targetController), creep, targetController) === false;
	}

	private static TrySign(creep: ClaimerCreep | UpgraderCreep | BuilderCreep, controller: StructureController | undefined): boolean
	{
		if (controller === undefined || (controller.sign !== undefined && controller.sign.text === c_signText))
		{
			return false; // We already signed it. Claim the next controller in the list
		}

		if (CreepBehavior.TryBeInRange(creep, controller, 1) === false)
		{
			return true;
		}

		// On successfully signing, move on to the next action in the list immediately
		Log.Succeeded(creep.signController(controller, c_signText), creep, controller);
		return false;
	}

	private static TryAttack(creep: AttackerCreep): boolean
	{
		return CreepBehavior.TryAttackRoom(creep, creep.Target.room.name);
		// || CreepBehavior.TryAttackObject(creep, "W29S24", "6133295eed49e2824e09e179");
	}

	private static TryAttackRoom(creep: AttackerCreep, targetRoomName: string): boolean
	{
		if (creep.pos.roomName !== targetRoomName)
		{
			CreepBehavior.MoveTo(creep, Find.Center(targetRoomName));
			return true;
		}

		let enemyCreeps: readonly EnemyCreep[];
		if ((enemyCreeps = Find.Creeps(creep.room, CreepType.Enemy)).length === 0)
		{
			return false;
		}

		enemyCreeps = CreepBehavior.GetEnemiesToAttack(enemyCreeps);
		const enemyCreep: EnemyCreep = Find.Closest(creep.pos, enemyCreeps)!;

		if (Find.IsSameRoomAndWithinRange(creep.pos, enemyCreep.pos, 1) === false)
		{
			CreepBehavior.MoveTo(creep, enemyCreep.pos);
			return true;
		}

		Log.Succeeded(creep.attack(enemyCreep), creep, enemyCreep);
		return true;
	}

	private static GetEnemiesToAttack(enemyCreeps: readonly EnemyCreep[]): readonly EnemyCreep[]
	{
		if (enemyCreeps.length <= 1)
		{
			return enemyCreeps;
		}

		let bestEnemyCreeps: EnemyCreep[] | undefined;

		for (const enemyCreep of enemyCreeps)
		{
			if (enemyCreep.getActiveBodyparts("heal") !== 0)
			{
				(bestEnemyCreeps ||= []).push(enemyCreep);
			}
		}

		if (bestEnemyCreeps !== undefined)
		{
			return bestEnemyCreeps;
		}

		for (const enemyCreep of enemyCreeps)
		{
			if (enemyCreep.getActiveBodyparts("attack") !== 0)
			{
				(bestEnemyCreeps ||= []).push(enemyCreep);
			}
		}

		if (bestEnemyCreeps !== undefined)
		{
			return bestEnemyCreeps;
		}

		for (const enemyCreep of enemyCreeps)
		{
			if (enemyCreep.getActiveBodyparts("ranged_attack") !== 0)
			{
				(bestEnemyCreeps ||= []).push(enemyCreep);
			}
		}

		return bestEnemyCreeps || enemyCreeps;
	}

	// private static TryAttackObject(creep: AttackerCreep, targetRoomName: string, targetId: string): boolean
	// {
	// 	const target: EnemyCreep | PowerCreep | Structure | null = Game.getObjectById(targetId as Id<EnemyCreep | PowerCreep | Structure>);
	// 	if (target === null)
	// 	{
	// 		for (const room of Find.s_visibleRooms)
	// 		{
	// 			if (room.name === targetRoomName)
	// 			{
	// 				return false; // We already killed it. Attack the next thing in the list
	// 			}
	// 		}
	// 		CreepBehavior.MoveTo(creep, Find.Center(targetRoomName)); // Move towards non-visible room
	// 	}
	// 	else if (Find.IsSameRoomAndWithinRange(creep.pos, target.pos, 1) === false)
	// 	{
	// 		CreepBehavior.MoveTo(creep, target.pos);
	// 	}
	// 	else
	// 	{
	// 		Log.Succeeded(creep.attack(target), creep, target);
	// 	}
	// 	return true;
	// }

	private static TryBeInRange(
		creep: AnyProducerOrConsumerCreep | ClaimerCreep,
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
			|| creep.ticksToLive! <= 50 // If the creep is about to die, don't waste the runners' time
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
		let maxEnergyFlowPerTick: number = 1; // Don't bother moving until we can average at least 1 energy transfered per tick
		let runnerEnergyDifference = 0;

		let testEnergy: number;
		let testScore: number;

		const runnerPosition: RoomPosition = runner.pos;
		let calculateTaking: boolean = runner.EnergyLeftToTake >= runner.EnergyLeftToGive;

		for (let energyDirectionsCalculated: number = 2;
			energyDirectionsCalculated-- !== 0;
			calculateTaking = calculateTaking === false)
		{
			if (calculateTaking !== false) // Calculate Runner taking energy
			{
				const runnerEnergyLeftToTake: number = runner.EnergyLeftToTake;
				if (runnerEnergyLeftToTake <= maxEnergyFlowPerTick) // Only calculate if best case scenario is better (all energy / 1 tick)
				{
					continue;
				}

				for (const room of Find.s_visibleRooms)
				{
					for (const type of c_typesRunnersTakeEnergyFrom)
					{
						if ((type & Type.DecayingEnegrySource) === 0
							&& bestTarget !== undefined
							&& (bestTarget.Type & Type.DecayingEnegrySource) !== 0
							&& bestTarget.pos.roomName === runnerPosition.roomName)
						{
							break; // Get those decaying resources in our room!
						}

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

				const runnerTargetRoom: Room = runner.Target.room;

				for (const type of c_typesHarvestersGiveEnergyTo)
				{
					for (const testObject of Find.MyObjects(runnerTargetRoom, type))
					{
						if ((testEnergy = testObject.EnergyLeftToTake) > maxEnergyFlowPerTick &&
							(testScore = Math.min(testEnergy, runnerEnergyLeftToGive) / Math.max(1, Find.Distance(runnerPosition, testObject.pos) - 1)) > maxEnergyFlowPerTick)
						{
							bestTarget = testObject;
							runnerEnergyDifference = -(maxEnergyFlowPerTick = testScore);
						}
					}

					if (bestTarget !== undefined && bestTarget.Type === Type.Extension)
					{
						break; // Fill those extensions!
					}
				}

				for (const testObject of Find.Creeps(runnerTargetRoom, CreepType.AllConsumers))
				{
					if (testObject.spawning === false &&
						(testEnergy = testObject.EnergyLeftToTake) > maxEnergyFlowPerTick &&
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
			&& Log.Succeeded(creep.moveTo(target, c_moveOptions), creep, target) !== false
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
