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
	/*  */ type BuilderCreep = CreepOfType</*  */ BuilderCreepType, StructureController | ConstructionSite>;
	/* */ type UpgraderCreep = CreepOfType</* */ UpgraderCreepType, StructureController | ConstructionSite>;
	/*    */ type MinerCreep = CreepOfType</*    */ MinerCreepType, Mineral /*       */>;
	/*  */ type ClaimerCreep = CreepOfType</*  */ ClaimerCreepType, StructureController>;
	/* */ type AttackerCreep = CreepOfType</* */ AttackerCreepType, never /* NotSure */>;
	/*    */ type EnemyCreep = CreepOfType</*    */ EnemyCreepType, never /*         */>;

	// If you change this, change "CreepType.AnyRoomTargettingCreepType" too
	type AnyRoomTargettingCreep = RunnerCreep;

	type AnyProducerCreep = HarvesterCreep | MinerCreep;
	type AnyConsumerCreep = BuilderCreep | UpgraderCreep;

	/*         */ type AnyCreep =
		| /**/ AnyProducerCreep
		| /**/ AnyConsumerCreep
		| /*     */ RunnerCreep
		| /*    */ ClaimerCreep
		| /*   */ AttackerCreep
		| /*      */ EnemyCreep;

	interface Creep
	{
		Is<TCreepType extends AnyCreepType>(creepType: TCreepType): this is ToCreepInterface<TCreepType>;
		IsAny<TCreepTypes extends AnyCreepType>(creepType: TCreepTypes): this is ToCreepInterface<TCreepTypes>;

		// "virtual" methods:
		GetCreepType(): AnyCreepType; /**/ ct?: AnyCreepType;
		GetTarget(): AnyRoomObject; /* */ tar?: AnyRoomObject;
		GetTargetId(): Id<AnyRoomObject>; tid?: Id<AnyRoomObject>;
	}

	interface CreepOfType<
		TCreepType extends AnyCreepType,
		TTarget extends AnyRoomObject> extends Creep
	{
		GetCreepType(): TCreepType;
		GetTarget(): TTarget;
		GetTargetId(): Id<TTarget>;
	}

	interface CreepMemory
	{
		ct: AnyCreepType; // CreepType
		tid: Id<AnyRoomObject>; // Target.id
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

Creep.prototype.GetCreepType = function (): AnyCreepType
{
	return this.ct ??= (Memory.creeps[this.name]?.ct ?? CreepType.Enemy);
};

Creep.prototype.GetTarget = function (): AnyRoomObject
{
	return this.tar ??= Game.getObjectById(this.GetTargetId())!; // Just call this on creeps with a target
};

Creep.prototype.GetTargetId = function (): Id<AnyRoomObject>
{
	return this.tid ??= Memory.creeps[this.name]!.tid; // Just call this on creeps with a target
};
