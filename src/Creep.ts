import { CreepType } from "./CreepType";

declare global
{
	interface ICreep<TCreepType /* , TTarget */>
	{
		GetCreepType(): TCreepType;
		ct?: TCreepType;

		// GetTarget(): TTarget;
		// t?: TTarget;
		//
		// GetTargetId(): Id<TTarget>;
		// tid?: Id<TTarget>;
	}

	interface Creep // extends ICreep<AnyCreepType, AnyRoomObject>
	{
		// GetCreepType(): TCreepType;
		// ct?: TCreepType;

		Is</*   */ TCreepType extends AnyCreepType>(creepType: TCreepType): this is ToCreepInterface<TCreepType>;
		IsAny</**/ TCreepTypes extends AnyCreepType>(creepType: TCreepTypes): this is ToCreepInterface<TCreepTypes>;
	}

	// /**/ type HarvesterCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</**/ HarvesterCreepType /*, Source */>;
	// /*   */ type RunnerCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</*   */ RunnerCreepType /*, never */>;
	// /*  */ type BuilderCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</*  */ BuilderCreepType /*, ConstructionSite */>;
	// /* */ type UpgraderCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</* */ UpgraderCreepType /*, StructureController */>;
	// /*    */ type MinerCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</*    */ MinerCreepType /*, Mineral */>;
	// /*  */ type ClaimerCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</*  */ ClaimerCreepType /*, StructureController */>;
	// /* */ type AttackerCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</* */ AttackerCreepType /*, never */>;
	// /*    */ type EnemyCreep = Exclude<Creep, ICreep<AnyCreepType, AnyRoomObject>> | ICreep</*    */ EnemyCreepType /*, never */>;

	interface /*                       */ Creep { GetCreepType(): /*      */ AnyCreepType; ct?: /*      */ AnyCreepType; }
	interface /**/ HarvesterCreep extends Creep { GetCreepType(): /**/ HarvesterCreepType; ct?: /**/ HarvesterCreepType; }
	interface /*   */ RunnerCreep extends Creep { GetCreepType(): /*   */ RunnerCreepType; ct?: /*   */ RunnerCreepType; }
	interface /*  */ BuilderCreep extends Creep { GetCreepType(): /*  */ BuilderCreepType; ct?: /*  */ BuilderCreepType; }
	interface /* */ UpgraderCreep extends Creep { GetCreepType(): /* */ UpgraderCreepType; ct?: /* */ UpgraderCreepType; }
	interface /*    */ MinerCreep extends Creep { GetCreepType(): /*    */ MinerCreepType; ct?: /*    */ MinerCreepType; }
	interface /*  */ ClaimerCreep extends Creep { GetCreepType(): /*  */ ClaimerCreepType; ct?: /*  */ ClaimerCreepType; }
	interface /* */ AttackerCreep extends Creep { GetCreepType(): /* */ AttackerCreepType; ct?: /* */ AttackerCreepType; }
	interface /*    */ EnemyCreep extends Creep { GetCreepType(): /*    */ EnemyCreepType; ct?: /*    */ EnemyCreepType; }

	type AnyProducerCreep = HarvesterCreep | MinerCreep;
	type AnyConsumerCreep = BuilderCreep | UpgraderCreep;

	/*         */ type AnyCreep =
		| /**/ AnyProducerCreep
		| /**/ AnyConsumerCreep
		| /*     */ RunnerCreep
		| /*    */ ClaimerCreep
		| /*   */ AttackerCreep
		| /*      */ EnemyCreep;

	interface CreepMemory
	{
		ct: AnyCreepType; // CreepType
		tid: Id<RoomObject>; // Target.id
	}
}

Creep.prototype.GetCreepType = function (): AnyCreepType
{
	return this.ct ??= (Memory.creeps[this.name]?.ct ?? CreepType.Enemy);
};

Creep.prototype.Is = function <TCreepType extends AnyCreepType>(creepType: TCreepType): boolean
{
	return this.GetCreepType() === creepType;
};

Creep.prototype.IsAny = function <TCreepType extends AnyCreepType>(creepType: TCreepType): boolean
{
	return (this.GetCreepType() & creepType) !== 0;
};

