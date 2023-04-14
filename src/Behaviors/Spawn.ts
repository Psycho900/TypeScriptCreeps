import { } from "../Objects";
import { Collection } from "../Collection";
import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_ticksToForecast: 100 = 100 as const;
const c_optimalWorkBodyPartsPerSource: 5 = 5 as const; // Harvesting a source produces 2 energy per "work" body part

const c_harvesterBodyFromWorkBodyPartCount: readonly (readonly ("move" | "carry" | "work")[])[] =
	[
		/* 0 */["move", "carry"],
		/* 1 */["move", "carry", "work"],
		/* 2 */["move", "carry", "work", "work"],
		/* 3 */["move", "carry", "work", "work", "work"],
		/* 4 */["move", "carry", "work", "work", "work", "work"],
		/* 5 */["move", "carry", "work", "work", "work", "work", "work"],
	];

const c_harvesterCostFromWorkBodyPartCount: readonly number[] =
	[
		/* 0 */BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 0,
		/* 1 */BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 1,
		/* 2 */BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 2,
		/* 3 */BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 3,
		/* 4 */BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 4,
		/* 5 */BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 5,
	];

export abstract /* static */ class SpawnBehavior
{
	// public static EnsureInitializedForBeginningOfTick(spawns: readonly StructureSpawn[]): readonly StructureSpawn[]
	// {
	// 	return spawns;
	// }

	public static Act(): void
	{
		const spawns: StructureSpawn[] | undefined = SpawnBehavior.GetMyUsableSpawns();
		let targetRooms: readonly ControllableRoom[] | undefined;

		if (spawns === undefined ||
			(targetRooms = SpawnBehavior.GetTargetRooms()) === undefined ||
			Collection.Count(targetRooms, (room: ControllableRoom): boolean =>
				Find.Creeps(room, CreepType.Harvester).length === 0 ? SpawnBehavior.TrySpawnFirstHarvester(room, spawns)
					: (Find.Creeps(room, CreepType.Runner).length === 0 && SpawnBehavior.TrySpawnFirstRunner(room, spawns))) !== 0)
		{
			return;
		}

		SpawnBehavior.TrySpawnHarvestersToSaturateSources(targetRooms, spawns);

		// const forecastedEnergyConsumedPerRoom: Map<Id<StructureController>, number> = new Map<Id<StructureController>, number>();
		//
		// for (const room of targetRooms)
		// {
		// 	SpawnBehavior.CollectDataForRoom(room, forecastedEnergyHarvestedPerSource, forecastedEnergyConsumedPerRoom);
		// }
		//
		// throw new Error("TODO_KevSchil: Implement this");
	}

	private static GetMyUsableSpawns(): StructureSpawn[] | undefined
	{
		let spawns: StructureSpawn[] | undefined;

		for (const spawn of Find.MySpawns())
		{
			if (spawn.spawning === null &&
				spawn.room.energyAvailable >= c_harvesterCostFromWorkBodyPartCount[1])
			{
				if (spawns === undefined)
				{
					spawns = [spawn];
				}
				else
				{
					spawns.push(spawn);
				}
			}
		}

		return spawns;
	}

	// private static GetSpawnsWithMoreRoomEnergy(spawns: StructureSpawn[]): StructureSpawn[]
	// {
	// 	const spawnsWithMoreRoomEnergy: StructureSpawn[] = [];
	//
	// 	for (const spawn of spawns)
	// 	{
	// 		const room: ControllableRoom = spawn.room;
	//
	// 		if (room.energyAvailable >= room.energyCapacityAvailable
	// 			|| SpawnBehavior.AreAllExtensionsNearHarvestersFull(room))
	// 		{
	// 			spawnsWithMoreRoomEnergy.push(spawn);
	// 		}
	// 	}
	//
	// 	return spawnsWithMoreRoomEnergy;
	// }
	//
	// private static GetSpawnsWithFullRoomEnergy(spawns: StructureSpawn[]): StructureSpawn[]
	// {
	// 	const spawnsWithFullRoomEnergy: StructureSpawn[] = [];
	//
	// 	for (const spawn of spawns)
	// 	{
	// 		const room: ControllableRoom = spawn.room;
	//
	// 		if (room.energyAvailable >= room.energyCapacityAvailable)
	// 		{
	// 			spawnsWithFullRoomEnergy.push(spawn);
	// 		}
	// 	}
	//
	// 	return spawnsWithFullRoomEnergy;
	// }
	//
	// private static AreAllExtensionsNearHarvestersFull(room: ControllableRoom): boolean
	// {
	// 	for (const harvesterCreep of Find.CreepsOfTypes(room, CreepType.Harvester))
	// 	{
	// 		const targetSource: Source = harvesterCreep.Target;
	//
	// 		for (const spawnOrExtension of Find.MyObjectsInRange(targetSource, Type.SpawnsAndExtensions, 4))
	// 		{
	// 			if (spawnOrExtension.store.getFreeCapacity(RESOURCE_ENERGY) !== 0)
	// 			{
	// 				return false;
	// 			}
	// 		}
	// 	}
	//
	// 	return true;
	// }

	private static GetTargetRooms(): readonly ControllableRoom[] | undefined
	{
		let targetRooms: ControllableRoom[] | undefined;

		for (const room of Find.VisibleRooms())
		{
			if (room.controller !== undefined && // Hallways (etc.) have no controller
				(Find.MyObjects(room, Type.Spawn).length !== 0 || Find.Creeps(room, CreepType.Enemy).length === 0))
			{
				if (targetRooms === undefined) // Do not send creeps into not-my-rooms containing enemies
				{
					targetRooms = [room as ControllableRoom];
				}
				else
				{
					targetRooms.push(room as ControllableRoom);
				}
			}
		}

		return targetRooms;
	}

	private static TrySpawnHarvestersToSaturateSources(targetRooms: readonly ControllableRoom[], spawns: StructureSpawn[]): boolean
	{
		if (spawns.length === 0)
		{
			return true; // We have done everything we can do this tick!
		}

		const workPartsPerSource: Map<Id<Source>, number> = new Map<Id<Source>, number>();

		for (const room of targetRooms)
		{
			for (const creep of Find.Creeps(room, CreepType.Harvester))
			{
				if (SpawnBehavior.WillCreepDieSoon(creep) === false)
				{
					Collection.IncreaseValueOfKeyBy(
						workPartsPerSource,
						creep.Target.id,
						creep.getActiveBodyparts("work"));
				}
			}

			for (const source of Find.MyObjects(room, Type.Source)) // Ensure workPartsPerSource contains all sources
			{
				if (workPartsPerSource.has(source.id) === false)
				{
					workPartsPerSource.set(source.id, 0);
				}
			}
		}

		for (let maxWorkPartCount: 0 | 1 | 2 | 3 | 4 = 0; maxWorkPartCount !== c_optimalWorkBodyPartsPerSource; ++maxWorkPartCount)
		{
			if (Collection.CountKeysWithValue(
				workPartsPerSource,
				maxWorkPartCount,
				(sourceId: Id<Source>): boolean => SpawnBehavior.TrySpawnHarvester(
					spawns,
					Game.getObjectById(sourceId)!,
					c_optimalWorkBodyPartsPerSource - maxWorkPartCount as 1 | 2 | 3 | 4 | 5)) !== 0)
			{
				return true;
			}
		}

		return false;
	}

	// private static CollectDataForMyCreep(
	// 	room: ControllableRoom,
	// 	creep: Creep,
	// 	forecastedEnergyHarvestedPerSource: Map<Id<Source>, number>,
	// 	forecastedEnergyConsumedPerRoom: Map<Id<StructureController>, number>,
	// ): void
	// {
	// 	if (SpawnBehavior.WillCreepDieSoon(creep))
	// 	{
	// 		return;
	// 	}
	//
	// 	const ticksToLive: number | undefined = creep.ticksToLive; // undefined means the creep is still spawning
	// 	const ticksToForecast: number = ticksToLive! < c_ticksToForecast ? ticksToLive! : c_ticksToForecast; // comparing undefined with anything returns false
	//
	// 	switch (creep.CreepType)
	// 	{
	// 		case CreepType.Harvester: //   Harvesting a source produces 2 energy per "work" body part
	// 			{
	// 				SpawnBehavior.IncreaseValueOfKeyBy(
	// 					forecastedEnergyHarvestedPerSource,
	// 					(creep as HarvesterCreep).Target.id,
	// 					ticksToForecast * 2 * creep.getActiveBodyparts("work"));
	//
	// 				return;
	// 			}
	//
	// 		// case CreepType.Runner:
	// 		// 	{
	// 		// 		return;
	// 		// 	}
	//
	// 		case CreepType.Upgrader: // Upgrading a controller consumes 1 energy per "work" body part
	// 		case CreepType.Builder: //    Building a structure consumes 5 energy per "work" body part
	// 			{
	// 				if (Find.MyObjects(room, Type.ConstructionSite).length === 0) // Upgrading controller:
	// 				{
	// 					SpawnBehavior.IncreaseValueOfKeyBy(
	// 						forecastedEnergyConsumedPerRoom,
	// 						(creep as UpgraderCreep | BuilderCreep).Target.id,
	// 						ticksToForecast * creep.getActiveBodyparts("work"));
	// 				}
	// 				else // Building new structures:
	// 				{
	// 					SpawnBehavior.IncreaseValueOfKeyBy(
	// 						forecastedEnergyConsumedPerRoom,
	// 						(creep as UpgraderCreep | BuilderCreep).Target.id, // Guessing Builders are bottlenecked by "carry"'s at this ratio:
	// 						ticksToForecast * Math.min(5 * creep.getActiveBodyparts("work"), 2 * creep.getActiveBodyparts("carry")));
	// 				}
	//
	// 				return;
	// 			}
	//
	// 		default:
	// 			Log.Error(`Unhandled CreepType '${creep.CreepType}' in SpawnBehavior.Act()!`, ERR_INVALID_ARGS, creep);
	// 			return;
	// 	}
	// }

	private static WillCreepDieSoon(creep: Creep): boolean
	{
		const ticksToLive: number | undefined = creep.ticksToLive; // undefined means the creep is still spawning
		return ticksToLive !== undefined && (ticksToLive < c_ticksToForecast || 2 * creep.hits <= creep.hitsMax); // Creep being murdered?
	}

	private static TrySpawnFirstHarvester(room: ControllableRoom, spawns: StructureSpawn[]): boolean
	{
		if (spawns.length === 0)
		{
			return true; // We have done everything we can do this tick!
		}

		const sources: readonly Source[] = Find.MyObjects(room, Type.Source);
		if (sources.length === 0)
		{
			return false;
		}

		const energyAvailable: number = room.energyAvailable;
		const workBodyPartCount: 1 | 2 | 3 | 4 | 5 = Collection.LastIndexOf(
			c_harvesterCostFromWorkBodyPartCount,
			(element: number) => energyAvailable >= element) as 1 | 2 | 3 | 4 | 5;

		return SpawnBehavior.TrySpawn(
			spawns,
			CreepType.Harvester,
			sources[Game.time % sources.length],
			c_harvesterBodyFromWorkBodyPartCount[workBodyPartCount]);
	}

	private static TrySpawnHarvester(
		spawns: StructureSpawn[],
		targetSource: Source,
		maxWorkBodyPartCount: 1 | 2 | 3 | 4 | 5): boolean
	{
		if (spawns.length === 0)
		{
			return true; // We have done everything we can do this tick!
		}

		const room: Room | undefined = Find.Closest(targetSource.pos, spawns)!.room;
		const workBodyPartsToSpawn: 1 | 2 | 3 | 5
			= room.energyCapacityAvailable >= c_harvesterCostFromWorkBodyPartCount[5]
				? 5 //                                          Late game: Always spawn 5-"work" harvesters
				: room.energyCapacityAvailable >= c_harvesterCostFromWorkBodyPartCount[3]
					? (maxWorkBodyPartCount === 2 ? 2 : 3) //    Mid game: Always spawn 3-"work" harvesters, unless we need exactly 2
					: (maxWorkBodyPartCount === 1 ? 1 : 2); // Early game: Always spawn 2-"work" harvesters, unless we need exactly 1

		return room.energyAvailable >= c_harvesterCostFromWorkBodyPartCount[workBodyPartsToSpawn] &&
			SpawnBehavior.TrySpawn(
				spawns,
				CreepType.Harvester,
				targetSource,
				c_harvesterBodyFromWorkBodyPartCount[workBodyPartsToSpawn]);
	}

	private static TrySpawnFirstRunner(room: ControllableRoom, spawns: StructureSpawn[]): boolean
	{
		if (spawns.length === 0)
		{
			return true; // We have done everything we can do this tick!
		}

		return SpawnBehavior.TrySpawn(
			spawns,
			CreepType.Runner,
			room.controller,
			["move", "carry", "move", "carry", "move", "carry"]); // TODO_KevSchil: Need smarter logic
	}

	private static TrySpawn<
		TCreepType extends number,
		TRoomObject extends AnyTargetRoomObject>(
			spawns: StructureSpawn[],
			creepType: TCreepType,
			target: TRoomObject,
			bodyParts: readonly BodyPartConstant[]): boolean
	{
		const spawnCount: number = spawns.length;
		if (spawnCount === 0)
		{
			return true; // We have done everything we can do this tick!
		}

		const targetPosition: RoomPosition = target.pos;
		let closestSpawn: StructureSpawn;

		for (let spawnIndex: number = 0; spawnIndex < spawnCount; ++spawnIndex)
		{
			const spawn: StructureSpawn = spawns[spawnIndex];

			if (SpawnBehavior.GetBodyPartsCost(bodyParts) > spawn.room.energyAvailable ||
				(spawn.id !== (closestSpawn ??= Find.Closest(targetPosition, Find.MySpawns())!).id
					&& Find.Distance(targetPosition, spawn.pos) > 25))
			{
				continue;
			}

			const creepName: string = `${CreepType.ToString(creepType)[0]}${Find.VisibleRooms().indexOf(target.room ?? spawn.room) * 100 + (Game.time % 99)}`;

			if (Log.Succeeded(spawn.spawnCreep(
				bodyParts,
				creepName,
				{
					memory:
					{
						ct: creepType,
						tid: target.id,
						bd: Game.time,
					},
					// energyStructures?: Array<StructureSpawn | StructureExtension>: // TODO_KevSchil: List all spawns, then all extensions closest to creeps/sources
				}), spawn, creepName))
			{
				spawns.splice(spawnIndex, 1); // Remove 1 element at index spawnIndex
				return true;
			}
		}

		return false;
	}

	private static GetBodyPartsCost(bodyParts: readonly BodyPartConstant[]): number
	{
		let totalBodyCost: number = 0;

		for (const bodyPartType of bodyParts)
		{
			totalBodyCost += BODYPART_COST[bodyPartType];
		}

		return totalBodyCost;
	}
}
