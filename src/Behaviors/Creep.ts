import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";

// const c_foo = 5 as const;

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
		| (TCreepType extends /*    */ EnemyCreepType ? /*    */ EnemyCreep : never);

	/*   */ type HarvesterCreep = CreepOfType</**/ HarvesterCreepType, Source /*        */>;
	/*      */ type RunnerCreep = CreepOfType</*   */ RunnerCreepType, StructureController>; // Proxy for "room"
	/*     */ type BuilderCreep = CreepOfType</*  */ BuilderCreepType, StructureController>;
	/*    */ type UpgraderCreep = CreepOfType</* */ UpgraderCreepType, StructureController>;
	/*       */ type MinerCreep = CreepOfType</*    */ MinerCreepType, Mineral /*       */>;
	/*     */ type ClaimerCreep = CreepOfType</*  */ ClaimerCreepType, StructureController>;
	/*    */ type AttackerCreep = CreepOfType</* */ AttackerCreepType, never /* NotSure */>;
	/*       */ type EnemyCreep = CreepOfType</*    */ EnemyCreepType, never /*         */>;

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

	interface CreepOfType<
		TCreepType extends number,
		TTarget extends AnyTargetRoomObject> extends Creep
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
		const destination: RoomPosition | null = CreepBehavior.Destination(creep);

		if (destination === null || Find.Distance(creep.pos, destination) <= 1)
		{
			CreepBehavior.TakeEnergyWithoutMoving(creep);
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

		if (destination === null || Find.Distance(creep.pos, destination) <= 3)
		{
			CreepBehavior.TakeEnergyWithoutMoving(creep);
		}

		throw new Error("TODO_KevSchil: Implement this for " + creep.ToString());
	}

	private static TakeEnergyWithoutMoving(creep: Creep): void
	{
		throw new Error("TODO_KevSchil: Implement this for " + creep.ToString());
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
