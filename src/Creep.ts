import { CreepType } from "./CreepType";

declare global
{
	type ToCreepInterface<TCreepType extends AnyCreepType> =
		| (TCreepType extends /**/ HarvesterCreepType ? /**/ HarvesterCreep : never)
		| (TCreepType extends /*   */ RunnerCreepType ? /*   */ RunnerCreep : never)
		| (TCreepType extends /*  */ BuilderCreepType ? /*  */ BuilderCreep : never)
		| (TCreepType extends /* */ UpgraderCreepType ? /* */ UpgraderCreep : never)
		| (TCreepType extends /*    */ MinerCreepType ? /*    */ MinerCreep : never)
		| (TCreepType extends /*  */ ClaimerCreepType ? /*  */ ClaimerCreep : never)
		| (TCreepType extends /* */ AttackerCreepType ? /* */ AttackerCreep : never)
		| (TCreepType extends /*    */ EnemyCreepType ? /*    */ EnemyCreep : never);

	/**/ type HarvesterCreep = CreepOfType</**/ HarvesterCreepType, Source /*        */>;
	/*   */ type RunnerCreep = CreepOfType</*   */ RunnerCreepType, StructureController>; // Proxy for "room"
	/*  */ type BuilderCreep = CreepOfType</*  */ BuilderCreepType, StructureController>;
	/* */ type UpgraderCreep = CreepOfType</* */ UpgraderCreepType, StructureController>;
	/*    */ type MinerCreep = CreepOfType</*    */ MinerCreepType, Mineral /*       */>;
	/*  */ type ClaimerCreep = CreepOfType</*  */ ClaimerCreepType, StructureController>;
	/* */ type AttackerCreep = CreepOfType</* */ AttackerCreepType, never /* NotSure */>;
	/*    */ type EnemyCreep = CreepOfType</*    */ EnemyCreepType, never /*         */>;

	/*         */ type AnyCreep =
		| /*      */ AnyMyCreep
		| /*      */ EnemyCreep;

	/*       */ type AnyMyCreep =
		| /**/ AnyProducerCreep
		| /**/ AnyConsumerCreep
		| /*     */ RunnerCreep
		| /*    */ ClaimerCreep
		| /*   */ AttackerCreep;

	type AnyProducerCreep = HarvesterCreep | MinerCreep;
	type AnyConsumerCreep = BuilderCreep | UpgraderCreep;

	// If you change this, change "CreepType.AnyRoomTargettingCreepType" too
	type AnyRoomTargettingCreep = RunnerCreep;
	type AnyTargetRoomObject = Source | Mineral | StructureController;

	interface Creep
	{
		Is<TCreepType extends AnyCreepType>(creepType: TCreepType): this is ToCreepInterface<TCreepType>;
		IsAny<TCreepTypes extends AnyCreepType>(creepType: TCreepTypes): this is ToCreepInterface<TCreepTypes>;

		// "virtual" methods:
		GetCreepType(): AnyCreepType; /*      */ ct?: AnyCreepType;
		GetTarget(): AnyTargetRoomObject; /* */ tar?: AnyTargetRoomObject;
		GetTargetId(): Id<AnyTargetRoomObject>; tid?: Id<AnyTargetRoomObject>;
	}

	interface CreepOfType<
		TCreepType extends AnyCreepType,
		TTarget extends AnyTargetRoomObject> extends Creep
	{
		GetCreepType(): TCreepType;
		GetTarget(): TTarget;
		GetTargetId(): Id<TTarget>;
	}

	interface CreepMemory
	{
		readonly ct: AnyCreepType; // CreepType
		readonly tid: Id<AnyTargetRoomObject>; // Target.id
		readonly bd: number; // BirthDay
	}
}

Creep.prototype.Is = function <TCreepType extends AnyCreepType>(creepType: TCreepType): boolean
{
	return this.GetCreepType() === creepType;
};

Creep.prototype.IsAny = function <TCreepType extends AnyCreepType>(creepType: TCreepType): boolean
{
	return (this.GetCreepType() & creepType) !== 0;
};

// "virtual" methods:

Creep.prototype.GetCreepType = function(): AnyCreepType
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
