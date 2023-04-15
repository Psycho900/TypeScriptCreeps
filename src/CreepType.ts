import { } from "./Energy";

declare global // CreepType-specifics
{
	/*      */ type HarvesterCreepType = 0b0000000000000000000000000000001;
	/*         */ type RunnerCreepType = 0b0000000000000000000000000000010;
	/*       */ type UpgraderCreepType = 0b0000000000000000000000000000100;
	/*        */ type BuilderCreepType = 0b0000000000000000000000000001000;
	// /*          */ type MinerCreepType = 0b0000000000000000000000000010000;
	// /*        */ type ClaimerCreepType = 0b0000000000000000000000000100000;
	// /*       */ type AttackerCreepType = 0b0000000000000000000000001000000;
	/*          */ type EnemyCreepType = 0b0000000000000000000000010000000;

	// /*         */ type AnyCreepType =
	// 	| /*      */ AnyMyCreepType
	// 	| /*      */ EnemyCreepType;
	//
	// /*       */ type AnyMyCreepType =
	// 	| /**/ AnyProducerCreepType
	// 	| /**/ AnyConsumerCreepType
	// 	| /*     */ RunnerCreepType
	// 	| /*    */ ClaimerCreepType
	// 	| /*   */ AttackerCreepType;

	// /*    */ type AnyProducerCreepType =
		// | /*     */ HarvesterCreepType
		// | /*         */ MinerCreepType;

	/*    */ type AnyConsumerCreepType =
		| /*      */ UpgraderCreepType
		| /*       */ BuilderCreepType;

	/**/ type AnyEnergyTakingCreepType =
		| /*     */ HarvesterCreepType
		| /*        */ RunnerCreepType
		| /*      */ UpgraderCreepType
		| /*       */ BuilderCreepType;

	// If you change this, change "Creep.AnyRoomTargettingCreep" too
	type AnyRoomTargettingCreepType = RunnerCreepType;
}

declare global // Creep-specifics
{
	type ToCreepInterface<TCreepType extends number> =
		| (TCreepType extends /**/ HarvesterCreepType ? /**/ HarvesterCreep : never)
		| (TCreepType extends /*   */ RunnerCreepType ? /*   */ RunnerCreep : never)
		| (TCreepType extends /* */ UpgraderCreepType ? /* */ UpgraderCreep : never)
		| (TCreepType extends /*  */ BuilderCreepType ? /*  */ BuilderCreep : never)
		// | (TCreepType extends /*    */ MinerCreepType ? /*    */ MinerCreep : never)
		// | (TCreepType extends /*  */ ClaimerCreepType ? /*  */ ClaimerCreep : never)
		// | (TCreepType extends /* */ AttackerCreepType ? /* */ AttackerCreep : never)
		| (TCreepType extends /*    */ EnemyCreepType ? /*    */ EnemyCreep : never);

	/*   */ type HarvesterCreep = CreepOfType</**/ HarvesterCreepType, Source /*        */, true>;
	/*      */ type RunnerCreep = CreepOfType</*   */ RunnerCreepType, StructureController, true>; // Proxy for "room"
	/*    */ type UpgraderCreep = CreepOfType</* */ UpgraderCreepType, StructureController, true>;
	/*     */ type BuilderCreep = CreepOfType</*  */ BuilderCreepType, StructureController, true>;
	// /*    */ type MinerCreep = CreepOfType</*    */ MinerCreepType, Mineral /*       */, true>;
	// /*  */ type ClaimerCreep = CreepOfType</*  */ ClaimerCreepType, StructureController, true>;
	// /* */ type AttackerCreep = CreepOfType</* */ AttackerCreepType, never /* NotSure */, true>;
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

	// type AnyProducerCreep = HarvesterCreep | MinerCreep;
	type AnyConsumerCreep = UpgraderCreep | BuilderCreep;

	// If you change this, change "CreepType.AnyRoomTargettingCreepType" too
	type AnyRoomTargettingCreep = RunnerCreep;
	type AnyTargetRoomObject = Source | Mineral | StructureController;

	interface Creep extends EnergyGiver, EnergyTaker
	{
		// Is<TCreepType extends number>(creepType: TCreepType): this is ToCreepInterface<TCreepType>;
		IsAny<TCreepTypes extends number>(creepType: TCreepTypes): this is ToCreepInterface<TCreepTypes>;

		CreepType: number;
		Target: AnyTargetRoomObject;
	}

	interface IsMyCreep<TIsMine extends boolean> extends Creep
	{
		readonly my: TIsMine;

		// Has any sort of creep.move*(...) method already been called this tick?
		CanMove: TIsMine extends true ? boolean : never;

		// Have any of these been called this tick? : https://docs.screeps.com/simultaneous-actions.html
		// CanDoAction: TIsMine extends true ? boolean : never;
	}

	interface CreepOfType<
		TCreepType extends number,
		TTarget extends AnyTargetRoomObject,
		TIsMine extends boolean> extends IsMyCreep<TIsMine>
	{
		readonly CreepType: TCreepType;
		readonly Target: TTarget;
	}

	interface CreepMemory
	{
		readonly ct: number; // CreepType
		readonly tid: Id<AnyTargetRoomObject>; // Target.id
		readonly bd: number; // BirthDay

		// // Automatically set by the game (usually?) :
		// readonly _move?:
		// {
		// 	readonly dest?:
		// 	{
		// 		readonly x: number;
		// 		readonly y: number;
		// 		readonly room: string;
		// 	};
		// };
	}
}

export abstract /* static */ class CreepType
{
	public static readonly Harvester: /**/ HarvesterCreepType = 0b0000000000000000000000000000001 as const;
	public static readonly Runner: /*      */ RunnerCreepType = 0b0000000000000000000000000000010 as const;
	public static readonly Upgrader: /*  */ UpgraderCreepType = 0b0000000000000000000000000000100 as const;
	public static readonly Builder: /*    */ BuilderCreepType = 0b0000000000000000000000000001000 as const;
	// public static readonly Miner: /*      */ MinerCreepType = 0b0000000000000000000000000010000 as const;
	// public static readonly Claimer: /*  */ ClaimerCreepType = 0b0000000000000000000000000100000 as const;
	// public static readonly Attacker: /**/ AttackerCreepType = 0b0000000000000000000000001000000 as const;
	public static readonly Enemy: /*        */ EnemyCreepType = 0b0000000000000000000000010000000 as const;

	public static readonly All /*                          */ = 0b0000000000000000000000011111111 as HarvesterCreepType;
	// public static readonly AllMine /*                   */ = 0b0000000000000000000000001111111 as const;
	// public static readonly AllProducers: AnyProducerCreepType = 0b0000000000000000000000000010001 as AnyProducerCreepType;
	public static readonly AllConsumers: AnyConsumerCreepType = 0b0000000000000000000000000001100 as AnyConsumerCreepType;

	public static readonly AllHarvestersOrUpgradersOrBuilders = 0b0000000000000000000000000001101 as HarvesterCreepType | UpgraderCreepType | BuilderCreepType;
	// public static readonly AllRoomTargettingCreeps /*   */ = 0b0000000000000000000000000000010 as const;

	// public static Contains<
	// 	TCreepTypes1 extends number,
	// 	TCreepTypes2 extends number>(
	// 		creepTypes1: TCreepTypes1,
	// 		creepTypes2: TCreepTypes2): creepTypes1 is (TCreepTypes1 & TCreepTypes2)
	// {
	// 	return (creepTypes1 & creepTypes2) !== 0;
	// }

	public static EnsureInitializedForBeginningOfTick(creeps: Creep[]): Creep[]
	{
		for (const creep of creeps)
		{
			const store: StoreDefinition = creep.store;
			creep.EnergyLeftToGive = store.energy;
			creep.EnergyLeftToTake = store.getFreeCapacity("energy");

			if (creep.my === false)
			{
				creep.CreepType = CreepType.Enemy;
				continue;
			}

			(creep as MyCreep).CanMove = creep.fatigue === 0;
			// (creep as MyCreep).CanDoAction = true;

			if (creep.CreepType === undefined)
			{
				const creepMemory: CreepMemory = Memory.creeps[creep.name];
				creep.CreepType = creepMemory.ct;
				creep.Target = Game.getObjectById(creepMemory.tid)!;
			}
		}

		return creeps;
	}

	public static ToString(creepType: number): string
	{
		switch (creepType)
		{
			case CreepType.Harvester /**/: return "Harvester";
			case CreepType.Runner /*   */: return "Runner";
			case CreepType.Upgrader /* */: return "Upgrader";
			case CreepType.Builder /*  */: return "Builder";
			// case CreepType.Miner /*    */: return "Miner";
			// case CreepType.Claimer /*  */: return "Claimer";
			// case CreepType.Attacker /* */: return "Attacker";
			case CreepType.Enemy /*    */: return "Enemy";
			default /*                 */: return `0b${creepType?.toString(2) ?? 'NULLish'}`;
		}
	}
}

// Creep.prototype.Is = function(creepType: number): boolean
// {
// 	return this.CreepType === creepType;
// };

Creep.prototype.IsAny = function(creepType: number): boolean
{
	return (this.CreepType & creepType) !== 0;
};
