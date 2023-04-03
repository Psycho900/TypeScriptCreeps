import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_harvesterTypesToGiveEnergyTo = [Type.Extension] as const;
const c_harvesterTypesToTakeEnergyFrom = [Type.Resource] as const;

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
					CreepBehavior.HarvesterAct(creep as HarvesterCreep);
					continue;

				case CreepType.Runner:
					CreepBehavior.RunnerAct(creep as RunnerCreep);
					continue;

				case CreepType.Builder:
				case CreepType.Upgrader:
					CreepBehavior.BuilderOrUpgraderAct(creep as BuilderCreep | UpgraderCreep);
					continue;

				default:
					Log.Error("Unimplemented Creep Type!", OK, creep);
					continue;
			}
		}
	}

	private static HarvesterAct(creep: HarvesterCreep): void
	{
		const expectedEnergyNextTick: number = 

		const destination: RoomPosition | null = CreepBehavior.Destination(creep);

		if (destination === null || Find.IsSameRoomAndWithinRange(creep, destination, 1))
		{
			CreepBehavior.TryTakeEnergyInRange(creep, 1);
		}

		throw new Error("TODO_KevSchil: Implement this for " + creep.ToString());
	}

	private static RunnerAct(creep: RunnerCreep): void
	{
		throw new Error("TODO_KevSchil: Implement this for " + creep.ToString());
	}

	private static BuilderOrUpgraderAct(creep: BuilderCreep | UpgraderCreep): void
	{
		const destination: RoomPosition | null = CreepBehavior.Destination(creep);

		if (destination === null || Find.IsSameRoomAndWithinRange(creep, destination, 3))
		{
			CreepBehavior.TryTakeEnergyInRange(creep, 1);
		}

		throw new Error("TODO_KevSchil: Implement this for " + creep.ToString());
	}

	private static ExpectedEnergyAfterGivingWithinRange(
		creep: MyCreep,
		targetPosition: RoomPosition,
		targetRange: number,
		typesInPriorityOrder: readonly AnyEnergyTakingType[]): number
	{
		const expectedEnergy: number = creep.store.energy;
		if (expectedEnergy === 0)
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

		let closestObjectToCreep: ToInterface<AnyEnergyTakingType> | null = null;
		let closestObjectToCreepDistance: number = 1000000; // magnitudes larger than the entire map
		let testPosition: RoomPosition;
		let testDistanceToCreep: number;
		let testFreeCapacity: number;

		for (const type of typesInPriorityOrder)
		{
			for (const testObject of Find.MyObjects(room, type))
			{
				if ((x = (testPosition = testObject.pos).x) < minX || x > maxX ||
					(y = testPosition.y) < minY || y > maxY ||
					(testFreeCapacity = testObject.store.getFreeCapacity("energy")) === 0 ||
					(testDistanceToCreep = Find.Distance(creepPosition, testPosition)) >= closestObjectToCreepDistance ||
					(Type.IsCreep(testObject) && (testObject.spawning || testObject.id === creep.id)))
				{
					continue;
				}
				else if (testDistanceToCreep > 1)
				{
					closestObjectToCreep = testObject;
					closestObjectToCreepDistance = testDistanceToCreep;
				}
				else if (Log.Succeeded(creep.transfer(testObject, "energy"), creep, testObject))
				{
					return Math.max(0, expectedEnergy - testFreeCapacity);
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
		for (const testCreep of Find.CreepsOfTypes(room, CreepType.AllMine))
		{
			if ((x = (testPosition = testCreep.pos).x) < minX || x > maxX ||
				(y = testPosition.y) < minY || y > maxY ||
				(testFreeCapacity = testCreep.store.getFreeCapacity("energy")) === 0 ||
				(testDistanceToCreep = Find.Distance(creepPosition, testPosition)) >= closestObjectToCreepDistance ||
				testCreep.spawning ||
				testCreep.id === creep.id)
			{
				continue;
			}
			else if (testDistanceToCreep > 1)
			{
				closestObjectToCreep = testCreep;
				closestObjectToCreepDistance = testDistanceToCreep;
			}
			else if (Log.Succeeded(creep.transfer(testCreep, "energy"), creep, testCreep))
			{
				return Math.max(0, expectedEnergy - testFreeCapacity);
			}
		}

		return Log.Succeeded(creep.moveTo(testObject), creep, testObject)
			? 
				: ;
	}

	private static Destination(creep: HarvesterCreep | BuilderCreep | UpgraderCreep): RoomPosition | null
	{
		let destination: { readonly x: number; readonly y: number; readonly room: string; } | undefined;

		return (destination = Memory.creeps[creep.name]?._move?.dest) != null
			? new RoomPosition(destination.x, destination.y, destination.room)
			: null;
	}
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
