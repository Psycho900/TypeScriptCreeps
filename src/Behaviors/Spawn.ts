import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_ticksToForecast: number = 100;

export abstract /* static */ class SpawnBehavior
{
	public static TryAct(): boolean
	{
		let spawnsReadyToSpawn: StructureSpawn[] = SpawnBehavior.GetSpawnsWithFullEnergy();
		if (spawnsReadyToSpawn.length === 0)
		{
			return false;
		}

		const targetRooms: Room[] = SpawnBehavior.GetTargetRooms();
		for (const room of targetRooms)
		{
			if (Find.CreepsOfTypes(room, CreepType.Harvester).length === 0 && SpawnBehavior.TrySpawnFirstHarvester(room, spawnsReadyToSpawn))
			{
				return true;
			}
		}

		spawnsReadyToSpawn = SpawnBehavior.FilterOutSpawnsWithLowRoomEnergy(spawnsReadyToSpawn);
		if (spawnsReadyToSpawn.length === 0)
		{
			return false;
		}

		for (const room of targetRooms)
		{
			if (Find.CreepsOfTypes(room, CreepType.Runner).length === 0 && SpawnBehavior.TrySpawnFirstRunner(room, spawnsReadyToSpawn))
			{
				return true;
			}
		}

		const forecastedEnergyHarvestedPerSource: Map<Id<Source>, number> = new Map<Id<Source>, number>();
		const forecastedEnergyConsumedPerRoom: Map<Id<StructureController>, number> = new Map<Id<StructureController>, number>();

		for (const room of targetRooms)
		{
			SpawnBehavior.CollectDataForRoom(room, forecastedEnergyHarvestedPerSource, forecastedEnergyConsumedPerRoom);
		}

		throw new Error("TODO_KevSchil: Implement this");
	}

	private static GetSpawnsWithFullEnergy(): StructureSpawn[]
	{
		const spawnsReadyToSpawn: StructureSpawn[] = [];

		for (const spawn of Find.MySpawns())
		{
			// Wait for 300+ energy, since harvester with 2 WORK's is 2x productive as harvesters with 1
			if (spawn.spawning === null && spawn.store.getFreeCapacity() === 0)
			{
				spawnsReadyToSpawn.push(spawn);
			}
		}

		return spawnsReadyToSpawn;
	}

	private static FilterOutSpawnsWithLowRoomEnergy(spawnsReadyToSpawn: StructureSpawn[]): StructureSpawn[]
	{
		const spawnsWithHighEnoughRoomEnergy: StructureSpawn[] = [];

		for (const spawn of spawnsReadyToSpawn)
		{
			const room: Room = spawn.room;

			// Wait for 300+ energy, since harvester with 2 WORK's is 2x productive as harvesters with 1
			if (room.energyAvailable >= room.energyCapacityAvailable
				|| SpawnBehavior.AreAllNearbyExtensionsFull(room))
			{
				spawnsWithHighEnoughRoomEnergy.push(spawn);
			}
		}

		return spawnsWithHighEnoughRoomEnergy;
	}

	private static AreAllNearbyExtensionsFull(room: Room): boolean
	{
		for (const harvesterCreep of Find.CreepsOfTypes(room, CreepType.Harvester))
		{
			const targetSource: Source = harvesterCreep.GetTarget();

			for (const spawnOrExtension of Find.MyTypesInRange(targetSource, Type.SpawnsAndExtensions, 4))
			{
				if (spawnOrExtension.store.getFreeCapacity(RESOURCE_ENERGY) !== 0)
				{
					return false;
				}
			}
		}

		return true;
	}

	private static GetTargetRooms(): Room[]
	{
		const targetRooms: Room[] = [];

		for (const room of Find.MyRooms())
		{
			if (Find.MyTypes(room, Type.Spawn).length !== 0 || Find.CreepsOfTypes(room, CreepType.Enemy).length === 0)
			{
				targetRooms.push(room); // Do not send creeps into not-my-rooms containing enemies
			}
		}

		return targetRooms;
	}

	private static CollectDataForRoom(
		room: Room,
		forecastedEnergyHarvestedPerSource: Map<Id<Source>, number>,
		forecastedEnergyConsumedPerRoom: Map<Id<StructureController>, number>,
	): void
	{
		for (const creep of Find.CreepsOfTypes(room, CreepType.AllMine))
		{
			SpawnBehavior.CollectDataForMyCreep(room, creep, forecastedEnergyHarvestedPerSource, forecastedEnergyConsumedPerRoom);
		}

		for (const source of Find.MyTypes(room, Type.Source)) // Ensure forecastedEnergyHarvestedPerSource contains all sources
		{
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			forecastedEnergyHarvestedPerSource.get(source.id) ?? forecastedEnergyHarvestedPerSource.set(source.id, 0);
		}
	}

	private static CollectDataForMyCreep(
		room: Room,
		creep: AnyCreep,
		forecastedEnergyHarvestedPerSource: Map<Id<Source>, number>,
		forecastedEnergyConsumedPerRoom: Map<Id<StructureController>, number>,
	): void
	{
		if (2 * creep.hits <= creep.hitsMax)
		{
			return; // This creep is being murdered. Assume it will die, and we should replace it now.
		}

		const ticksToLive: number | undefined = creep.ticksToLive; // undefined means the creep is still spawning
		const ticksToForecast: number = ticksToLive! < c_ticksToForecast ? ticksToLive! : c_ticksToForecast; // comparing undefined with anything returns false

		switch (creep.GetCreepType())
		{
			case CreepType.Harvester: //   Harvesting a source produces 2 energy per WORK body part
				{
					SpawnBehavior.IncreaseValueOfKeyBy(
						forecastedEnergyHarvestedPerSource,
						(creep as HarvesterCreep).GetTargetId(),
						ticksToForecast * 2 * creep.getActiveBodyparts(WORK));

					return;
				}

			// case CreepType.Runner:
			// 	{
			// 		return;
			// 	}

			case CreepType.Builder: //    Building a structure consumes 5 energy per WORK body part
			case CreepType.Upgrader: // Upgrading a controller consumes 1 energy per WORK body part
				{
					if (Find.MyTypes(room, Type.ConstructionSite).length !== 0) // Building new structures:
					{
						SpawnBehavior.IncreaseValueOfKeyBy(
							forecastedEnergyConsumedPerRoom,
							(creep as BuilderCreep | UpgraderCreep).GetTargetId(), // Guessing Builders are bottlenecked by CARRY's at this ratio:
							ticksToForecast * Math.min(5 * creep.getActiveBodyparts(WORK), 2 * creep.getActiveBodyparts(CARRY)));
					}
					else // Upgrading controller:
					{
						SpawnBehavior.IncreaseValueOfKeyBy(
							forecastedEnergyConsumedPerRoom,
							(creep as BuilderCreep | UpgraderCreep).GetTargetId(),
							ticksToForecast * creep.getActiveBodyparts(WORK));
					}

					return;
				}

			default:
				Log.Error(`Unhandled CreepType '${creep.GetCreepType()}' in SpawnBehavior.Act()!`, ERR_INVALID_ARGS, creep);
				return;
		}
	}

	private static IncreaseValueOfKeyBy<TKey>(map: Map<TKey, number>, key: TKey, valueIncrement: number): void
	{
		map.set(key, (map.get(key) ?? 0) + valueIncrement);
	}

	private static TrySpawnFirstHarvester(room: Room, spawnsReadyToSpawn: StructureSpawn[]): boolean
	{
		const closestSpawnAndSource: [StructureSpawn, Source] | null = Find.ClosestPair(
			spawnsReadyToSpawn,
			Find.MyTypes(room, Type.Source));

		return closestSpawnAndSource === null
			? Log.Error("How is 'closestSpawnAndSource' null?", OK)
			: SpawnBehavior.TrySpawn(closestSpawnAndSource[0], CreepType.Harvester, closestSpawnAndSource[1]);
	}

	private static TrySpawnFirstRunner(room: Room, spawnsReadyToSpawn: StructureSpawn[]): boolean
	{
		return room.controller != null && // Hallways without controllers don't need runners
			SpawnBehavior.TrySpawn(
				Find.Closest(Find.Center(room), spawnsReadyToSpawn)!,
				CreepType.Runner,
				room.controller);
	}

	private static TrySpawn<
		TCreepType extends AnyCreepType,
		TRoomObject extends AnyRoomObject>(
			spawn: StructureSpawn,
			creepType: TCreepType,
			target: TRoomObject): boolean
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
