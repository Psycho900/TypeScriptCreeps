declare global
{
	/*    */ type HarvesterCreepType = 0b0000000000000000000000000000001;
	/*       */ type RunnerCreepType = 0b0000000000000000000000000000010;
	/*      */ type BuilderCreepType = 0b0000000000000000000000000000100;
	/*     */ type UpgraderCreepType = 0b0000000000000000000000000001000;
	/*        */ type MinerCreepType = 0b0000000000000000000000000010000;
	/*      */ type ClaimerCreepType = 0b0000000000000000000000000100000;
	/*     */ type AttackerCreepType = 0b0000000000000000000000001000000;
	/*        */ type EnemyCreepType = 0b0000000000000000000000010000000;

	/*          */ type AnyCreepType =
		| /* */ AnyProducerCreepType
		| /* */ AnyConsumerCreepType
		| /*      */ RunnerCreepType
		| /*     */ ClaimerCreepType
		| /*    */ AttackerCreepType
		| /*       */ EnemyCreepType;

	/*  */ type AnyProducerCreepType =
		| /*   */ HarvesterCreepType
		| /*       */ MinerCreepType;

	/*  */ type AnyConsumerCreepType =
		| /*     */ BuilderCreepType
		| /*    */ UpgraderCreepType;

	type ToCreepInterface<TCreepType extends AnyCreepType> =
		| (TCreepType extends /**/ HarvesterCreepType ? /**/ HarvesterCreep : never)
		| (TCreepType extends /*   */ RunnerCreepType ? /*   */ RunnerCreep : never)
		| (TCreepType extends /*  */ BuilderCreepType ? /*  */ BuilderCreep : never)
		| (TCreepType extends /* */ UpgraderCreepType ? /* */ UpgraderCreep : never)
		| (TCreepType extends /*    */ MinerCreepType ? /*    */ MinerCreep : never)
		| (TCreepType extends /*  */ ClaimerCreepType ? /*  */ ClaimerCreep : never)
		| (TCreepType extends /* */ AttackerCreepType ? /* */ AttackerCreep : never)
		| (TCreepType extends /*    */ EnemyCreepType ? /*    */ EnemyCreep : never);
}

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
