/*    */ type HarvesterCreepType = 0b0000000000000000000000000000001;
/*       */ type RunnerCreepType = 0b0000000000000000000000000000010;
/*      */ type BuilderCreepType = 0b0000000000000000000000000000100;
/*     */ type UpgraderCreepType = 0b0000000000000000000000000001000;
/*        */ type MinerCreepType = 0b0000000000000000000000000010000;
/*      */ type ClaimerCreepType = 0b0000000000000000000000000100000;
/*     */ type AttackerCreepType = 0b0000000000000000000000001000000;
/*        */ type EnemyCreepType = 0b0000000000000000000000010000000;

export /*   */ type AnyCreepType =
	| /* */ AnyProducerCreepType
	| /* */ AnyConsumerCreepType
	| /*      */ RunnerCreepType
	| /*     */ ClaimerCreepType
	| /*    */ AttackerCreepType
	| /*       */ EnemyCreepType;

export type AnyProducerCreepType =
	| /*   */ HarvesterCreepType
	| /*       */ MinerCreepType;

export type AnyConsumerCreepType =
	| /*     */ BuilderCreepType
	| /*    */ UpgraderCreepType;

export type ToCreepInterface<TCreepType extends AnyCreepType> =
	| (TCreepType extends /**/ HarvesterCreepType ? /**/ HarvesterCreep : never)
	| (TCreepType extends /*   */ RunnerCreepType ? /*   */ RunnerCreep : never)
	| (TCreepType extends /*  */ BuilderCreepType ? /*  */ BuilderCreep : never)
	| (TCreepType extends /* */ UpgraderCreepType ? /* */ UpgraderCreep : never)
	| (TCreepType extends /*    */ MinerCreepType ? /*    */ MinerCreep : never)
	| (TCreepType extends /*  */ ClaimerCreepType ? /*  */ ClaimerCreep : never)
	| (TCreepType extends /* */ AttackerCreepType ? /* */ AttackerCreep : never)
	| (TCreepType extends /*    */ EnemyCreepType ? /*    */ EnemyCreep : never);

export abstract /* static */ class CreepType
{
	public static readonly Harvester: /**/ HarvesterCreepType = 0b0000000000000000000000000000001;
	public static readonly Runner: /*      */ RunnerCreepType = 0b0000000000000000000000000000010;
	public static readonly Builder: /*    */ BuilderCreepType = 0b0000000000000000000000000000100;
	public static readonly Upgrader: /*  */ UpgraderCreepType = 0b0000000000000000000000000001000;
	public static readonly Miner: /*        */ MinerCreepType = 0b0000000000000000000000000010000;
	public static readonly Claimer: /*    */ ClaimerCreepType = 0b0000000000000000000000000100000;
	public static readonly Attacker: /*  */ AttackerCreepType = 0b0000000000000000000000001000000;
	public static readonly Enemy: /*        */ EnemyCreepType = 0b0000000000000000000000010000000;

	public static readonly All: /*            */ AnyCreepType = 0b0000000000000000000000011111111 as AnyCreepType;
	public static readonly AllProducers: AnyProducerCreepType = 0b0000000000000000000000000010001 as AnyProducerCreepType;
	public static readonly AllConsumers: AnyConsumerCreepType = 0b0000000000000000000000000001100 as AnyConsumerCreepType;
}

declare global
{
	interface CreepMemory { t: AnyCreepType; }

	interface /*                       */ Creep { GetCreepType(): /*      */ AnyCreepType; t?: /*      */ AnyCreepType; }
	interface /**/ HarvesterCreep extends Creep { GetCreepType(): /**/ HarvesterCreepType; t?: /**/ HarvesterCreepType; }
	interface /*   */ RunnerCreep extends Creep { GetCreepType(): /*   */ RunnerCreepType; t?: /*   */ RunnerCreepType; }
	interface /*  */ BuilderCreep extends Creep { GetCreepType(): /*  */ BuilderCreepType; t?: /*  */ BuilderCreepType; }
	interface /* */ UpgraderCreep extends Creep { GetCreepType(): /* */ UpgraderCreepType; t?: /* */ UpgraderCreepType; }
	interface /*    */ MinerCreep extends Creep { GetCreepType(): /*    */ MinerCreepType; t?: /*    */ MinerCreepType; }
	interface /*  */ ClaimerCreep extends Creep { GetCreepType(): /*  */ ClaimerCreepType; t?: /*  */ ClaimerCreepType; }
	interface /* */ AttackerCreep extends Creep { GetCreepType(): /* */ AttackerCreepType; t?: /* */ AttackerCreepType; }
	interface /*    */ EnemyCreep extends Creep { GetCreepType(): /*    */ EnemyCreepType; t?: /*    */ EnemyCreepType; }

	interface Creep { IsAny<TCreepType extends AnyCreepType>(creepType: TCreepType): this is ToCreepInterface<TCreepType>; }

	type AnyProducerCreep = HarvesterCreep | MinerCreep;
	type AnyConsumerCreep = BuilderCreep | UpgraderCreep;
}

Creep.prototype.GetCreepType = function (): AnyCreepType
{
	return this.t ??= (Memory.creeps[this.name]?.t ?? CreepType.Enemy);
};

Creep.prototype.IsAny = function<TCreepType extends AnyCreepType>(creepType: TCreepType): boolean
{
	return (this.GetCreepType() & creepType) !== 0;
};
