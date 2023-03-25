import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_ticksToForecast: number = 100;

export abstract /* static */ class SpawnBehavior
{
	public static Act(): void
	{
		if (SpawnBehavior.AreAllBusy())
		{
			return;
		}

		const forecastedEnergyHarvestedPerSource: Map<Id<Source>, number> = new Map<Id<Source>, number>();

		for (const room of Find.Rooms())
		{
			SpawnBehavior.CollectDataForRoom(room, forecastedEnergyHarvestedPerSource);
		}

		throw new Error("TODO_KevSchil: Implement this");
	}

	private static AreAllBusy(): boolean
	{
		for (const spawn of Find.Spawns())
		{
			// Wait for 300+ energy, since harvester with 2 WORK's is 2x productive as harvesters with 1
			if (spawn.spawning === null && spawn.room.energyAvailable >= 300)
			{
				return false;
			}
		}

		return true;
	}

	private static CollectDataForRoom(
		room: Room,
		forecastedEnergyHarvestedPerSource: Map<Id<Source>, number>,
	): void
	{
		for (const creep of Find.CreepsOfTypes(room, CreepType.AllMine))
		{
			SpawnBehavior.CollectDataForMyCreep(
				room,
				creep,
				forecastedEnergyHarvestedPerSource);
		}

		for (const source of Find.Types(room, Type.Source))
		{
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			forecastedEnergyHarvestedPerSource.get(source.id) ?? forecastedEnergyHarvestedPerSource.set(source.id, 0);
		}
	}

	private static CollectDataForMyCreep(
		room: Room,
		creep: AnyCreep,
		forecastedEnergyHarvestedPerSource: Map<Id<Source>, number>,
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
			case CreepType.Harvester:
				{
					const targetId: Id<Source> = (creep as HarvesterCreep).GetTargetId();
					forecastedEnergyHarvestedPerSource.set(
						targetId,
						(forecastedEnergyHarvestedPerSource.get(targetId) ?? 0) + ticksToForecast * 2 * creep.getActiveBodyparts(WORK));
					return; //                              2 energy harvested per WORK body part ^
				}

			// case CreepType.Runner:
			// 	{
			// 		return;
			// 	}

			case CreepType.Builder:
			case CreepType.Upgrader:
				{
					if (Find.Types(room, Type.ConstructionSite).length !== 0) // Enough to build stuff?
					{

					}
					else // Enough to upgrade?
					{

					}

					return;
				}

			default:
				Log.Error(`Unhandled CreepType '${creep.GetCreepType()}' in SpawnBehavior.Act()!`, ERR_INVALID_ARGS, creep);
				return;
		}
	}
}
