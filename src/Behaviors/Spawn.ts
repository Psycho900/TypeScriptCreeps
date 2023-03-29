import { Collection } from "../Collection";
import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Type } from "../Type";

const c_ticksToForecast: 100 = 100 as const;
const c_optimalWorkBodyPartsPerSource: 5 = 5 as const; // Harvesting a source produces 2 energy per WORK body part

const c_harvesterBodyFromWorkBodyPartCount =
	[
		/* 0 */null!, // Don't allow harvesters with 0 WORK body parts
		/* 1 */[MOVE, CARRY, WORK],
		/* 2 */[MOVE, CARRY, WORK, WORK],
		/* 3 */[MOVE, CARRY, WORK, WORK, WORK],
		/* 4 */null!, // Don't allow harvesters with 4 WORK body parts
		/* 5 */[MOVE, CARRY, WORK, WORK, WORK, WORK, WORK],
	] as const;

const c_harvesterCostFromWorkBodyPartCount =
	[
		/* 0 */null, // Don't allow harvesters with 0 WORK body parts
		/* 1 */BODYPART_COST[MOVE] + BODYPART_COST[CARRY] + BODYPART_COST[WORK],
		/* 2 */BODYPART_COST[MOVE] + BODYPART_COST[CARRY] + BODYPART_COST[WORK] * 2,
		/* 3 */BODYPART_COST[MOVE] + BODYPART_COST[CARRY] + BODYPART_COST[WORK] * 3,
		/* 4 */null, // Don't allow harvesters with 4 WORK body parts
		/* 5 */BODYPART_COST[MOVE] + BODYPART_COST[CARRY] + BODYPART_COST[WORK] * 5,
	] as const;

export abstract /* static */ class SpawnBehavior
{
	public static TryAct(): boolean
	{
		let spawns: readonly StructureSpawn[];
		if ((spawns = SpawnBehavior.GetSpawnsWithMinimumRequiredRoomEnergy()).length === 0)
		{
			return false;
		}

		const targetRooms: readonly Room[] = SpawnBehavior.GetTargetRooms();

		if (Collection.Count(targetRooms, (room: Room): boolean =>
			/**/ Find.CreepsOfTypes(room, CreepType.Harvester).length === 0 ? SpawnBehavior.TrySpawnFirstHarvester(room, spawns)
				: (Find.CreepsOfTypes(room, CreepType.Runner).length === 0 && SpawnBehavior.TrySpawnFirstRunner(room, spawns))) !== 0)
		{
			return true;
		}

		return SpawnBehavior.TrySpawnHarvestersToSaturateSources(targetRooms, spawns);

		// const forecastedEnergyConsumedPerRoom: Map<Id<StructureController>, number> = new Map<Id<StructureController>, number>();
		//
		// for (const room of targetRooms)
		// {
		// 	SpawnBehavior.CollectDataForRoom(room, forecastedEnergyHarvestedPerSource, forecastedEnergyConsumedPerRoom);
		// }
		//
		// throw new Error("TODO_KevSchil: Implement this");
	}

	private static GetSpawnsWithMinimumRequiredRoomEnergy(): readonly StructureSpawn[]
	{
		const spawns: StructureSpawn[] = [];

		for (const spawn of Find.MySpawns())
		{
			if (spawn.spawning === null && spawn.room.energyAvailable >= c_harvesterCostFromWorkBodyPartCount[1])
			{
				spawns.push(spawn);
			}
		}

		return spawns;
	}

	// private static GetSpawnsWithMoreRoomEnergy(spawns: readonly StructureSpawn[]): readonly StructureSpawn[]
	// {
	// 	const spawnsWithMoreRoomEnergy: readonly StructureSpawn[] = [];
	//
	// 	for (const spawn of spawns)
	// 	{
	// 		const room: Room = spawn.room;
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
	// private static GetSpawnsWithFullRoomEnergy(spawns: readonly StructureSpawn[]): readonly StructureSpawn[]
	// {
	// 	const spawnsWithFullRoomEnergy: readonly StructureSpawn[] = [];
	//
	// 	for (const spawn of spawns)
	// 	{
	// 		const room: Room = spawn.room;
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
	// private static AreAllExtensionsNearHarvestersFull(room: Room): boolean
	// {
	// 	for (const harvesterCreep of Find.CreepsOfTypes(room, CreepType.Harvester))
	// 	{
	// 		const targetSource: Source = harvesterCreep.GetTarget();
	//
	// 		for (const spawnOrExtension of Find.MyTypesInRange(targetSource, Type.SpawnsAndExtensions, 4))
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

	private static GetTargetRooms(): readonly Room[]
	{
		const targetRooms: Room[] = [];

		for (const room of Find.VisibleRooms())
		{
			if (Find.MyTypes(room, Type.Spawn).length !== 0 || Find.CreepsOfTypes(room, CreepType.Enemy).length === 0)
			{
				targetRooms.push(room); // Do not send creeps into not-my-rooms containing enemies
			}
		}

		return targetRooms;
	}

	private static TrySpawnHarvestersToSaturateSources(targetRooms: readonly Room[], spawns: readonly StructureSpawn[]): boolean
	{
		const workPartsPerSource: Map<Id<Source>, number> = new Map<Id<Source>, number>();

		for (const room of targetRooms)
		{
			for (const creep of Find.CreepsOfTypes(room, CreepType.Harvester))
			{
				if (!SpawnBehavior.WillCreepDieSoon(creep))
				{
					Collection.IncreaseValueOfKeyBy(
						workPartsPerSource,
						creep.GetTargetId(),
						creep.getActiveBodyparts(WORK));
				}
			}

			for (const source of Find.MyTypes(room, Type.Source)) // Ensure workPartsPerSource contains all sources
			{
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				workPartsPerSource.get(source.id) ?? workPartsPerSource.set(source.id, 0);
			}
		}

		for (let maxWorkPartCount: 0 | 1 | 2 | 3 | 4 = 0; maxWorkPartCount < c_optimalWorkBodyPartsPerSource; ++maxWorkPartCount)
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
	// 	room: Room,
	// 	creep: AnyCreep,
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
	// 	switch (creep.GetCreepType())
	// 	{
	// 		case CreepType.Harvester: //   Harvesting a source produces 2 energy per WORK body part
	// 			{
	// 				SpawnBehavior.IncreaseValueOfKeyBy(
	// 					forecastedEnergyHarvestedPerSource,
	// 					(creep as HarvesterCreep).GetTargetId(),
	// 					ticksToForecast * 2 * creep.getActiveBodyparts(WORK));
	//
	// 				return;
	// 			}
	//
	// 		// case CreepType.Runner:
	// 		// 	{
	// 		// 		return;
	// 		// 	}
	//
	// 		case CreepType.Builder: //    Building a structure consumes 5 energy per WORK body part
	// 		case CreepType.Upgrader: // Upgrading a controller consumes 1 energy per WORK body part
	// 			{
	// 				if (Find.MyTypes(room, Type.ConstructionSite).length !== 0) // Building new structures:
	// 				{
	// 					SpawnBehavior.IncreaseValueOfKeyBy(
	// 						forecastedEnergyConsumedPerRoom,
	// 						(creep as BuilderCreep | UpgraderCreep).GetTargetId(), // Guessing Builders are bottlenecked by CARRY's at this ratio:
	// 						ticksToForecast * Math.min(5 * creep.getActiveBodyparts(WORK), 2 * creep.getActiveBodyparts(CARRY)));
	// 				}
	// 				else // Upgrading controller:
	// 				{
	// 					SpawnBehavior.IncreaseValueOfKeyBy(
	// 						forecastedEnergyConsumedPerRoom,
	// 						(creep as BuilderCreep | UpgraderCreep).GetTargetId(),
	// 						ticksToForecast * creep.getActiveBodyparts(WORK));
	// 				}
	//
	// 				return;
	// 			}
	//
	// 		default:
	// 			Log.Error(`Unhandled CreepType '${creep.GetCreepType()}' in SpawnBehavior.Act()!`, ERR_INVALID_ARGS, creep);
	// 			return;
	// 	}
	// }

	private static WillCreepDieSoon(creep: AnyCreep): boolean
	{
		const ticksToLive: number | undefined = creep.ticksToLive; // undefined means the creep is still spawning
		return ticksToLive != null && (ticksToLive < c_ticksToForecast || 2 * creep.hits <= creep.hitsMax); // Creep being murdered?
	}

	private static TrySpawnFirstHarvester(room: Room, spawns: readonly StructureSpawn[]): boolean
	{
		const closestSpawnAndSource: readonly [StructureSpawn, Source] | null
			= Find.ClosestPair(spawns, Find.MyTypes(room, Type.Source));

		return closestSpawnAndSource !== null
			&& SpawnBehavior.TrySpawnHarvester([closestSpawnAndSource[0]], closestSpawnAndSource[1], c_optimalWorkBodyPartsPerSource);
	}

	private static TrySpawnHarvester(spawns: readonly StructureSpawn[], targetSource: Source, maxWorkBodyPartCount: 1 | 2 | 3 | 4 | 5): boolean
	{
		const closestSpawn: StructureSpawn = Find.Closest(targetSource.pos, spawns)!;
		const room: Room = closestSpawn.room;

		const workBodyPartsToSpawn: 1 | 2 | 3 | 5
			= room.energyCapacityAvailable >= c_harvesterCostFromWorkBodyPartCount[5]
			? 5 //                                          Late game: Always spawn 5-WORK harvesters
			: room.energyCapacityAvailable >= c_harvesterCostFromWorkBodyPartCount[3]
				? (maxWorkBodyPartCount === 2 ? 2 : 3) //    Mid game: Always spawn 3-WORK harvesters, unless we need exactly 2
				: (maxWorkBodyPartCount === 1 ? 1 : 2); // Early game: Always spawn 2-WORK harvesters, unless we need exactly 1

		return room.energyAvailable >= c_harvesterCostFromWorkBodyPartCount[workBodyPartsToSpawn] &&
			SpawnBehavior.TrySpawn(
				closestSpawn,
				CreepType.Harvester,
				targetSource,
				c_harvesterBodyFromWorkBodyPartCount[workBodyPartsToSpawn]);
	}

	private static TrySpawnFirstRunner(room: Room, spawns: readonly StructureSpawn[]): boolean
	{
		return room.controller != null && // Hallways without controllers don't need runners
			SpawnBehavior.TrySpawn(
				Find.Closest(Find.Center(room), spawns)!,
				CreepType.Runner,
				room.controller);
	}

	private static TrySpawn<
		TCreepType extends AnyCreepType,
		TRoomObject extends AnyRoomObject>(
			spawn: StructureSpawn,
			creepType: TCreepType,
			target: TRoomObject,
			bodyParts?: readonly BodyPartConstant[]): boolean
	{
		const targetPosition: RoomPosition = CreepType.Contains(creepType, CreepType.AllRoomTargettingCreeps)
			? Find.Center(target.room ?? spawn.room)
			: target.pos;

		if (Find.Distance(targetPosition, spawn.pos) > 25
			&& Find.Closest(targetPosition, Find.MySpawns())!.id !== spawn.id)
		{
			return false; // Only spawn creeps from the spawn closest (or close enough) to the target
		}

		throw new Error("TODO_KevSchil: Implement this");
	}
}
