import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_typesHarvestersGiveEnergyTo = // In priority order from
	[
		Type.Extension,
		Type.Spawn,
		Type.Tower,
		Type.Link,
		Type.Container,
		Type.Storage,
	] as const;

const c_typesHarvestersTakeEnergyFrom = // In priority order from
	[
		Type.Tombstone,
		Type.Ruin,
	] as const;

const c_creepTypesHarvestersGiveEnergyTo = // In priority order from
	[
		CreepType.Builder,
		CreepType.Upgrader,
		CreepType.Runner,
		CreepType.Harvester,
	] as const;

declare global
{
	type ToCreepInterface<TCreepType extends number> =
		| (TCreepType extends /**/ HarvesterCreepType ? /**/ HarvesterCreep : never)
		| (TCreepType extends /*   */ RunnerCreepType ? /*   */ RunnerCreep : never)
		| (TCreepType extends /*  */ BuilderCreepType ? /*  */ BuilderCreep : never)
		| (TCreepType extends /* */ UpgraderCreepType ? /* */ UpgraderCreep : never)
		| (TCreepType extends /*    */ MinerCreepType ? /*    */ MinerCreep : never)
		| (TCreepType extends /*  */ ClaimerCreepType ? /*  */ ClaimerCreep : never)
		| (TCreepType extends /* */ AttackerCreepType ? /* */ AttackerCreep : never)
		| (TCreepType extends /*    */ EnemyCreepType ? /*    */ EnemyCreep : MyCreep);

	/*   */ type HarvesterCreep = CreepOfType</**/ HarvesterCreepType, Source /*        */, true>;
	/*      */ type RunnerCreep = CreepOfType</*   */ RunnerCreepType, StructureController, true>; // Proxy for "room"
	/*     */ type BuilderCreep = CreepOfType</*  */ BuilderCreepType, StructureController, true>;
	/*    */ type UpgraderCreep = CreepOfType</* */ UpgraderCreepType, StructureController, true>;
	/*       */ type MinerCreep = CreepOfType</*    */ MinerCreepType, Mineral /*       */, true>;
	/*     */ type ClaimerCreep = CreepOfType</*  */ ClaimerCreepType, StructureController, true>;
	/*    */ type AttackerCreep = CreepOfType</* */ AttackerCreepType, never /* NotSure */, true>;
	/*       */ type EnemyCreep = CreepOfType</*    */ EnemyCreepType, never /*         */, false>;
	/*          */ type MyCreep = IsMyCreep<true>;

	// /*         */ type Creep =
	// 	| /*      */ AnyMyCreep
	// 	| /*      */ EnemyCreep;
	//
	// /*       */ type AnyMyCreep =
	// 	| /**/ AnyProducerCreep
	// 	| /**/ AnyConsumerCreep
	// 	| /*     */ RunnerCreep
	// 	| /*    */ ClaimerCreep
	// 	| /*   */ AttackerCreep;

	type AnyProducerCreep = HarvesterCreep | MinerCreep;
	type AnyConsumerCreep = BuilderCreep | UpgraderCreep;

	// If you change this, change "CreepType.AnyRoomTargettingCreepType" too
	type AnyRoomTargettingCreep = RunnerCreep;
	type AnyTargetRoomObject = Source | Mineral | StructureController;

	interface Creep
	{
		Is<TCreepType extends number>(creepType: TCreepType): this is ToCreepInterface<TCreepType>;
		IsAny<TCreepTypes extends number>(creepType: TCreepTypes): this is ToCreepInterface<TCreepTypes>;

		// "virtual" methods:
		GetCreepType(): number; /*            */ ct?: number;
		GetTarget(): AnyTargetRoomObject; /* */ tar?: AnyTargetRoomObject;
		GetTargetId(): Id<AnyTargetRoomObject>; tid?: Id<AnyTargetRoomObject>;
	}

	interface IsMyCreep<TIsMine extends boolean> extends Creep
	{
		readonly my: TIsMine;
	}

	interface CreepOfType<
		TCreepType extends number,
		TTarget extends AnyTargetRoomObject,
		TIsMine extends boolean> extends IsMyCreep<TIsMine>
	{
		GetCreepType(): TCreepType;
		GetTarget(): TTarget;
		GetTargetId(): Id<TTarget>;
	}

	interface CreepMemory
	{
		readonly ct: number; // CreepType
		readonly tid: Id<AnyTargetRoomObject>; // Target.id
		readonly bd: number; // BirthDay

		// Automatically set by the game sometimes:
		readonly _move?:
		{
			readonly dest?:
			{
				readonly x: number;
				readonly y: number;
				readonly room: string;
			};
		};
	}
}

export abstract /* static */ class CreepBehavior
{
	public static Act(): void
	{
		// const scratchSpaceArray = []; // re-usable temporary array used for anything and everything

		for (const creep of Find.MyCreeps())
		{
			if (creep.spawning !== false)
			{
				continue;
			}

			switch (creep.GetCreepType())
			{
				case CreepType.Harvester:
					CreepBehavior.DoHarvesterActions(creep as HarvesterCreep);
					continue;

				case CreepType.Runner:
					CreepBehavior.DoRunnerActions(creep as RunnerCreep);
					continue;

				case CreepType.Builder:
					CreepBehavior.DoBuilderActions(creep as BuilderCreep);
					continue;

				case CreepType.Upgrader:
					CreepBehavior.DoUpgraderActions(creep as UpgraderCreep);
					continue;

				default:
					Log.Error("Unimplemented Creep Type!", OK, creep);
					continue;
			}
		}
	}

	private static DoHarvesterActions(creep: HarvesterCreep): void
	{
		const targetPosition: RoomPosition = creep.GetTarget().pos;

		let expectedEnergyNextTick: number = CreepBehavior.ExpectedEnergyAfterGivingEnergyWithinRange(
			creep,
			targetPosition,
			2,
			c_typesHarvestersGiveEnergyTo,
			c_creepTypesHarvestersGiveEnergyTo);

		const isWithinRangeOfTarget: boolean = Find.IsSameRoomAndWithinRange(creep, targetPosition, 2);

		if (isWithinRangeOfTarget === false && creep.fatigue !== 0)
		{
			expectedEnergyNextTick = CreepBehavior.ExpectedEnergyAfterDroppingAll(creep, expectedEnergyNextTick);
		}

		expectedEnergyNextTick = CreepBehavior.ExpectedEnergyAfterHarvestingOrMoving(creep, expectedEnergyNextTick);

		if (isWithinRangeOfTarget !== false)
		{
			CreepBehavior.ExpectedEnergyAfterTakingEnergyWithinRange(
				creep,
				targetPosition,
				2,
				c_typesHarvestersTakeEnergyFrom,
				// c_creepTypesHarvestersTakeEnergyFrom,
				expectedEnergyNextTick);
		}
	}

	private static DoRunnerActions(creep: RunnerCreep): void
	{
		throw new Error("TODO_KevSchil: Implement this for " + creep.ToString());
	}

	private static DoBuilderActions(creep: BuilderCreep): void
	{
	}

	private static DoUpgraderActions(creep: UpgraderCreep): void
	{
	}

	private static ExpectedEnergyAfterGivingEnergyWithinRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[],
		creepTypesInPriorityOrder: readonly number[]): number
	{
		const expectedEnergyNextTick: number = creep.store.energy;
		if (expectedEnergyNextTick === 0)
		{
			return 0; // No energy to give!
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

		let closestObjectToCreep: ToInterface<AnyEnergyTakingType> | Creep | null = null;
		let closestObjectToCreepDistance: number = 1000000; // magnitudes larger than the entire map
		let testPosition: RoomPosition;
		let testDistanceToCreep: number;
		let testFreeCapacity: number;

		for (const type of typesInPriorityOrder)
		{
			for (const testObject of Find.MyObjects(room, type))
			{
				if ((testFreeCapacity = testObject.store.getFreeCapacity("energy")) === 0
					|| (testDistanceToCreep = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectToCreepDistance)
				{
					continue;
				}
				else if (testDistanceToCreep <= 1)
				{
					if (Log.Succeeded(creep.transfer(testObject, "energy"), creep, testObject))
					{
						return Math.max(0, expectedEnergyNextTick - testFreeCapacity);
					}
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
				if ((testFreeCapacity = testObject.store.getFreeCapacity("energy")) === 0
					|| (testDistanceToCreep = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectToCreepDistance
					|| testObject.spawning
					|| testObject.id === creep.id)
				{
					continue;
				}
				else if (testDistanceToCreep <= 1)
				{
					if (Log.Succeeded(creep.transfer(testObject, "energy"), creep, testObject))
					{
						return Math.max(0, expectedEnergyNextTick - testFreeCapacity);
					}
				}
				else if ((x = testPosition.x) >= minX && x <= maxX
					&& (y = testPosition.y) >= minY && y <= maxY)
				{
					closestObjectToCreep = testObject;
					closestObjectToCreepDistance = testDistanceToCreep;
				}
			}
		}

		if (closestObjectToCreep !== null)
		{
			Log.Succeeded(creep.moveTo(closestObjectToCreep), creep, closestObjectToCreep);
		}

		return expectedEnergyNextTick;
	}

	private static ExpectedEnergyAfterTakingEnergyWithinRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyGivingType[],
		// creepTypesInPriorityOrder: readonly number[],
		expectedEnergyNextTick: number): number
	{
		const creepEnergyCapacity: number = creep.store.getCapacity("energy");

		if (expectedEnergyNextTick === creepEnergyCapacity)
		{
			return creepEnergyCapacity; // No room for energy to take!
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

		let closestObjectToCreep: ToInterface<AnyEnergyGivingType> | Creep | Resource | null = null;
		let closestObjectToCreepDistance: number = 1000000; // magnitudes larger than the entire map
		let testPosition: RoomPosition;
		let testDistanceToCreep: number;
		let testEnergy: number;

		for (const testResource of Find.MyObjects(room, Type.Resource)) // Always do Resources first, since they decay
		{
			if (testResource.resourceType !== "energy" ||
				(testDistanceToCreep = Find.Distance(creepPosition, testPosition = testResource.pos)) >= closestObjectToCreepDistance)
			{
				continue;
			}
			else if (testDistanceToCreep <= 1)
			{
				if (Log.Succeeded(creep.pickup(testResource), creep, testResource))
				{
					if ((expectedEnergyNextTick += testResource.amount) >= creepEnergyCapacity)
					{
						return creepEnergyCapacity;
					}

					break; // Each creep can only pickup once per tick
				}
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
				if ((testEnergy = testObject.store.energy) === 0
					|| (testDistanceToCreep = Find.Distance(creepPosition, testPosition = testObject.pos)) >= closestObjectToCreepDistance)
				{
					continue;
				}
				else if (testDistanceToCreep <= 1)
				{
					if (Log.Succeeded(creep.withdraw(
						testObject,
						"energy",
						testEnergy = Math.min(testEnergy, creepEnergyCapacity - expectedEnergyNextTick)), creep, testObject))
					{
						return expectedEnergyNextTick + testEnergy;
					}
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

		if (closestObjectToCreep !== null)
		{
			Log.Succeeded(creep.moveTo(closestObjectToCreep), creep, closestObjectToCreep);
		}

		return expectedEnergyNextTick;
	}

	private static ExpectedEnergyAfterDroppingAll(creep: MyCreep, expectedEnergyNextTick: number): number
	{
		for (const resourceType in creep.store)
		{
			if (creep.drop(resourceType as ResourceConstant) === OK
				&& resourceType === "energy")
			{
				expectedEnergyNextTick = 0;
			}
		}

		return expectedEnergyNextTick;
	}


	private static ExpectedEnergyAfterHarvestingOrMoving(creep: HarvesterCreep, expectedEnergyNextTick: number): number
	{
		const source: Source = creep.GetTarget();

		if (Find.IsSameRoomAndWithinRange(creep, source.pos, 1) === false)
		{
			Log.Succeeded(creep.moveTo(source), creep, source);
		}
		else if (Log.Succeeded(creep.harvest(source), creep, source) !== false)
		{
			return Math.min(
				creep.store.getCapacity("energy"),
				expectedEnergyNextTick + 2 * creep.getActiveBodyparts("work"));
		}

		return expectedEnergyNextTick;
	}

	// private static Destination(creep: HarvesterCreep | BuilderCreep | UpgraderCreep): RoomPosition | null
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
	return this.GetCreepType() === creepType;
};

Creep.prototype.IsAny = function(creepType: number): boolean
{
	return (this.GetCreepType() & creepType) !== 0;
};

// "virtual" methods:

Creep.prototype.GetCreepType = function(): number
{
	return this.ct ??= (Memory.creeps[this.name].ct ?? CreepType.Enemy);
};

Creep.prototype.GetTarget = function(): AnyTargetRoomObject
{
	return this.tar ??= Game.getObjectById(this.GetTargetId())!;
};

Creep.prototype.GetTargetId = function(): Id<AnyTargetRoomObject>
{
	return this.tid ??= Memory.creeps[this.name].tid;
};
