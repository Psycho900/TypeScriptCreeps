import { } from "../Energy";
import { } from "../Objects";
import { Collection } from "../Collection";
import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_ticksToForecast = 200 as const;
const c_optimalWorkBodyPartsPerSource: 5 = 5 as const; // Harvesting a source produces 2 energy per "work" body part

const c_harvesterBodyFromWorkBodyPartCount: readonly (readonly ("move" | "carry" | "work")[])[] =
	[
		["move", "carry"], //                                         0
		["move", "carry", "work"], //                                 1
		["move", "carry", "work", "work"], //                         2
		["move", "carry", "work", "work", "work"], //                 3
		["move", "carry", "work", "work", "work", "work"], //         4
		["move", "carry", "work", "work", "work", "work", "work"], // 5
	] as const;

const c_harvesterCostFromWorkBodyPartCount: readonly number[] =
	[
		BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 0,
		BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 1,
		BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 2,
		BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 3,
		BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 4,
		BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work * 5,
	] as const;

const c_minimumRequiredRoomEnergyToSpawnUsefulCreep: number = c_harvesterCostFromWorkBodyPartCount[1];

declare global
{
	interface Memory
	{
		cc: number; // Creep Counter (increments every time we (attempt to?) spawn a new creep). Always < 100
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface Room extends EnergyGiver { }
}

export abstract /* static */ class SpawnBehavior
{
	public static Act(): void
	{
		const spawns: StructureSpawn[] | undefined = SpawnBehavior.GetMyUsableSpawns();
		if (spawns === undefined)
		{
			return;
		}

		const targetRooms: ControllableRoom[] | undefined = SpawnBehavior.GetTargetRooms();
		if (targetRooms === undefined)
		{
			return;
		}

		if (SpawnBehavior.TrySpawnHarvestersToSaturateSources(targetRooms, spawns) !== false
			&& spawns.length === 0)
		{
			return;
		}

		for (const targetRoom of targetRooms)
		{
			if (Find.MyObjects(targetRoom, Type.ConstructionSite).length === 0)
			{
				if (Find.Creeps(targetRoom, CreepType.Upgrader).length < 1 &&
					SpawnBehavior.TrySpawnUpgrader(targetRoom, spawns) !== false &&
					spawns.length === 0)
				{
					return;
				}
			}
			else
			{
				if (Find.Creeps(targetRoom, CreepType.Builder).length < 1 &&
					SpawnBehavior.TrySpawnBuilder(targetRoom, spawns) !== false &&
					spawns.length === 0)
				{
					return;
				}
			}

			if (Find.Creeps(targetRoom, CreepType.Runner).length < 1 &&
				SpawnBehavior.TrySpawnRunner(targetRoom, spawns) !== false &&
				spawns.length === 0)
			{
				return;
			}

			// SpawnBehavior.TrySpawnAttacker(targetRoom, spawns);
		}
	}

	private static GetMyUsableSpawns(): StructureSpawn[] | undefined
	{
		let spawns: StructureSpawn[] | undefined;

		for (const spawn of Find.MySpawns())
		{
			if (spawn.spawning === null &&
				spawn.room.energyAvailable >= c_minimumRequiredRoomEnergyToSpawnUsefulCreep)
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

	private static GetTargetRooms(): ControllableRoom[] | undefined
	{
		let targetRooms: ControllableRoom[] | undefined;

		for (const room of Find.VisibleRooms())
		{
			room.EnergyLeftToGive = room.energyAvailable;

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
		if (targetRooms.length === 0 || spawns.length === 0)
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
			for (const [sourceId, workPartCount] of workPartsPerSource)
			{
				if (workPartCount === maxWorkPartCount &&
					SpawnBehavior.TrySpawnHarvester(
						spawns,
						Game.getObjectById(sourceId)!,
						c_optimalWorkBodyPartsPerSource - maxWorkPartCount as 1 | 2 | 3 | 4 | 5) !== false)
				{
					return true;
				}
			}
		}

		return false;
	}

	private static WillCreepDieSoon(creep: Creep): boolean
	{
		const ticksToLive: number | undefined = creep.ticksToLive; // undefined means the creep is still spawning
		return ticksToLive !== undefined && (ticksToLive < c_ticksToForecast || 2 * creep.hits <= creep.hitsMax); // Creep being murdered?
	}

	// private static TrySpawnFirstHarvesters(room: ControllableRoom, spawns: StructureSpawn[]): boolean
	// {
	// 	if (spawns.length === 0)
	// 	{
	// 		return true; // We have done everything we can do this tick!
	// 	}
	//
	// 	const sources: readonly Source[] = Find.MyObjects(room, Type.Source);
	// 	const closestSource: Source | undefined = Find.Closest(room.controller.pos, sources);
	// 	if (closestSource === undefined)
	// 	{
	// 		return false;
	// 	}
	//
	// 	let anyHarvestersSpawned: boolean = SpawnBehavior.TrySpawnHarvester(spawns, closestSource, 5);
	//
	// 	if (spawns.length === 0)
	// 	{
	// 		return true; // We have done everything we can do this tick!
	// 	}
	//
	// 	for (const source of sources) // We want to do closestSource first to be optimal, and then skip it here
	// 	{
	// 		if (source.id === closestSource.id ||
	// 			SpawnBehavior.TrySpawnHarvester(spawns, source, 5) === false)
	// 		{
	// 			continue;
	// 		}
	//
	// 		if (spawns.length === 0)
	// 		{
	// 			return true; // We have done everything we can do this tick!
	// 		}
	//
	// 		anyHarvestersSpawned = true;
	// 	}
	//
	// 	return anyHarvestersSpawned;
	// }

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
		const roomMaxEnergy: number = room.energyCapacityAvailable;
		const workBodyPartsToSpawn: 1 | 2 | 3 | 5
			= roomMaxEnergy >= c_harvesterCostFromWorkBodyPartCount[5]
				? 5 //                                          Late game: Always spawn 5-"work" harvesters
				: roomMaxEnergy >= c_harvesterCostFromWorkBodyPartCount[3]
					? (maxWorkBodyPartCount === 2 ? 2 : 3) //    Mid game: Always spawn 3-"work" harvesters, unless we need exactly 2
					: (maxWorkBodyPartCount === 1 ? 1 : 2); // Early game: Always spawn 2-"work" harvesters, unless we need exactly 1

		return room.EnergyLeftToGive >= c_harvesterCostFromWorkBodyPartCount[workBodyPartsToSpawn] &&
			SpawnBehavior.TrySpawn(
				spawns,
				CreepType.Harvester,
				targetSource,
				c_harvesterBodyFromWorkBodyPartCount[workBodyPartsToSpawn]);
	}

	private static TrySpawnRunner(room: ControllableRoom, spawns: StructureSpawn[]): boolean
	{
		if (spawns.length === 0)
		{
			return true; // We have done everything we can do this tick!
		}

		let roomEnergyLeft: number = Math.min(1300, room.EnergyLeftToGive) - 3 * (BODYPART_COST.move + BODYPART_COST.carry);
		const bodyParts: BodyPartConstant[] = ["move", "carry", "move", "carry", "move", "carry"];

		if ((roomEnergyLeft -= BODYPART_COST.move + BODYPART_COST.work) >= 0)
		{
			bodyParts.push("move");
			bodyParts.push("work");

			while ((roomEnergyLeft -= 100) >= 0)
			{
				bodyParts.push("move");
				bodyParts.push("carry");
			}
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Runner, room.controller, bodyParts);
	}

	private static TrySpawnUpgrader(room: ControllableRoom, spawns: StructureSpawn[]): boolean
	{
		if (spawns.length === 0 || room.EnergyLeftToGive !== room.energyCapacityAvailable)
		{
			return true; // We have done everything we can do this tick!
		}

		let roomEnergyLeft: number = room.EnergyLeftToGive - (BODYPART_COST.move + BODYPART_COST.carry);
		const bodyParts: BodyPartConstant[] = ["move", "carry"];

		while ((roomEnergyLeft -= 100) >= 0)
		{
			bodyParts.push("work");
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Upgrader, room.controller, bodyParts);
	}

	private static TrySpawnBuilder(room: ControllableRoom, spawns: StructureSpawn[]): boolean
	{
		if (spawns.length === 0 || room.EnergyLeftToGive !== room.energyCapacityAvailable)
		{
			return true; // We have done everything we can do this tick!
		}

		let roomEnergyLeft: number = Math.min(1800, room.EnergyLeftToGive) - (BODYPART_COST.move + BODYPART_COST.carry + 5 * BODYPART_COST.work);
		const bodyParts: BodyPartConstant[] = ["move", "carry", "work", "work", "work", "work", "work"];

		while ((roomEnergyLeft -= 50) >= 0)
		{
			bodyParts.push("carry");
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Builder, room.controller, bodyParts);
	}

	// @ts-ignore: Expected to be unused when I'm not attacking
	private static TrySpawnAttacker(room: ControllableRoom, spawns: StructureSpawn[]): boolean
	{
		if (spawns.length === 0 || room.EnergyLeftToGive !== room.energyCapacityAvailable)
		{
			return true; // We have done everything we can do this tick!
		}

		let roomEnergyLeft: number = room.EnergyLeftToGive;
		const bodyParts: BodyPartConstant[] = [];

		while ((roomEnergyLeft -= BODYPART_COST.move + BODYPART_COST.attack) >= 0)
		{
			bodyParts.push("move");
			bodyParts.push("attack");
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Attacker, room.controller, bodyParts);
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
		const bodyPartsCost: number = SpawnBehavior.GetBodyPartsCost(bodyParts);
		let closestSpawn: StructureSpawn | undefined;
		let closestSpawnIndex: number = 0;
		let closestDistance: number = 1000000000;
		let testSpawn: StructureSpawn;
		let testDistance: number;
		let spawnIndex: number = -1;

		while (++spawnIndex < spawnCount)
		{
			if (bodyPartsCost <= (testSpawn = spawns[spawnIndex]).room.EnergyLeftToGive &&
				closestDistance > (testDistance = Find.Distance(targetPosition, testSpawn.pos)))
			{
				closestSpawn = testSpawn;
				closestSpawnIndex = spawnIndex;
				closestDistance = testDistance;
			}
		}

		if (closestSpawn === undefined ||
			(closestDistance > 25 && closestSpawn.id !== Find.Closest(targetPosition, Find.MySpawns())!.id))
		{
			return false; // Wait for a closer spawn to be available
		}

		const closestSpawnRoom: ControllableRoom = closestSpawn.room;
		const creepName: string = `${CreepType.ToString(creepType)[0]}${Find.VisibleRooms().indexOf(target.room || closestSpawnRoom) * 100 + (Memory.cc = (Memory.cc + 1 | 0) % 100)}`;

		// Take energy from the furthest away spawns and extensions first:
		const energyStructuresPriority: (StructureSpawn | StructureExtension)[] = Find.MyObjects(closestSpawnRoom, Type.SpawnsAndExtensions) as (StructureSpawn | StructureExtension)[];
		const controllerPosition: RoomPosition = closestSpawnRoom.controller.pos;
		energyStructuresPriority.sort((c1, c2) =>
		{
			return c1.Type !== c2.Type // Put all Spawns before all Extensions
				? c2.Type - c1.Type
				: Find.Distance(c2.pos, controllerPosition) - Find.Distance(c1.pos, controllerPosition);
		});

		if (Log.Succeeded(closestSpawn.spawnCreep(
			bodyParts,
			creepName,
			{
				memory:
				{
					ct: creepType,
					tid: target.id,
					bd: Game.time,
				},
				energyStructures: energyStructuresPriority,
				directions: [closestSpawn.pos.getDirectionTo(targetPosition)],
			}), closestSpawn, creepName) === false)
		{
			return false;
		}

		spawns.splice(closestSpawnIndex, 1); // Remove 1 element at index spawnIndex
		closestSpawnRoom.EnergyLeftToGive -= bodyPartsCost;

		spawnIndex = spawnCount - 1; // Because we already removed 1 element a couple lines earlier
		while (--spawnIndex >= 0)
		{
			if (spawns[spawnIndex].room.EnergyLeftToGive < c_minimumRequiredRoomEnergyToSpawnUsefulCreep)
			{
				spawns.splice(spawnIndex, 1); // Remove 1 element at index spawnIndex
			}
		}

		return true;
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
