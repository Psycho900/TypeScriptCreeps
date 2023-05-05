import { } from "../Energy";
import { } from "../Objects";
import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_ticksToForecast = 200 as const;

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

const c_minimumRequiredRoomEnergyToSpawnUsefulCreep: 300 = 300 as const;

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
		let spawns: StructureSpawn[] | undefined;

		for (const spawn of Find.MySpawns()) // Get all my usable spawns
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

		if (spawns === undefined)
		{
			return;
		}

		let targetRooms: ControllableRoom[] | undefined;

		for (const room of Find.VisibleRooms()) // Get all target rooms
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

		if (targetRooms === undefined)
		{
			return;
		}

		const workPartCounts: Map<Id<AnyTargetRoomObject>, number> = new Map<Id<AnyTargetRoomObject>, number>();
		const carryPartCounts: Map<Id<AnyTargetRoomObject>, number> = new Map<Id<AnyTargetRoomObject>, number>();
		const runnerCarryPartCounts: Map<Id<StructureController>, number> = new Map<Id<StructureController>, number>();

		for (const creep of Find.MySpawningAndSpawnedCreeps()) // Collect how many body parts are working towards each target
		{
			const ticksToLive: number | undefined = creep.ticksToLive; // undefined means the creep is still spawning
			if (ticksToLive !== undefined && (ticksToLive < c_ticksToForecast || 2 * creep.hits <= creep.hitsMax)) // Creep being murdered?
			{
				continue; // Creep is probably dying soon
			}

			switch (creep.CreepType)
			{
				case CreepType.Runner:
					runnerCarryPartCounts.set(creep.Target.id, (runnerCarryPartCounts.get(creep.Target.id) || 0) + creep.getActiveBodyparts("carry"));
					continue;

				case CreepType.Harvester:
				case CreepType.Upgrader:
				case CreepType.Builder:
					{
						const targetId: Id<AnyTargetRoomObject> = creep.Target.id;
						workPartCounts.set(targetId, (workPartCounts.get(targetId) || 0) + creep.getActiveBodyparts("work"));
						carryPartCounts.set(targetId, (carryPartCounts.get(targetId) || 0) + creep.getActiveBodyparts("carry"));
						continue;
					}
			}
		}

		for (const targetRoom of targetRooms) // Make sure each source has at least 1 harvester on it
		{
			for (const source of Find.MyObjects(targetRoom, Type.Source))
			{
				if (workPartCounts.has(source.id) === false)
				{
					SpawnBehavior.TrySpawnHarvester(spawns, source, 5);
					return;
				}
			}

			const targetControllerId: Id<StructureController> = targetRoom.controller.id;

			if (runnerCarryPartCounts.has(targetControllerId) === false) // Make sure each room has at least 1 runner
			{
				SpawnBehavior.TrySpawnRunner(spawns, targetRoom);
			}
			else if (Find.MyObjects(targetRoom, Type.ConstructionSite).length === 0)
			{
				if ((workPartCounts.get(targetControllerId) || 0) < 16 &&
					(carryPartCounts.get(targetControllerId) || 0) < 5)
				{
					SpawnBehavior.TrySpawnUpgrader(spawns, targetRoom);
				}
			}
			else if ((workPartCounts.get(targetControllerId) || 0) < 4
				|| (carryPartCounts.get(targetControllerId) || 0) < 5)
			{
				SpawnBehavior.TrySpawnBuilder(spawns, targetRoom);
			}

			if (spawns.length === 0)
			{
				return;
			}

			// for (let maxWorkPartCount: 1 | 2 | 3 = 1; maxWorkPartCount !== 4; ++maxWorkPartCount) // saturate sources with harvesters
			// {
			// 	for (const source of Find.MyObjects(targetRoom, Type.Source))
			// 	{
			// 		if (workPartCounts.get(source.id)! === maxWorkPartCount)
			// 		{
			// 			SpawnBehavior.TrySpawnHarvester(spawns, source, 5 - maxWorkPartCount as 2 | 3 | 4);
			// 			return;
			// 		}
			// 	}
			// }

			// SpawnBehavior.TrySpawnClaimer(targetRoom, spawns);
			// SpawnBehavior.TrySpawnAttacker(targetRoom, spawns);
		}
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

	private static TrySpawnRunner(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		let targetRoomEnergyToSpend: number = Math.min(targetRoom.energyCapacityAvailable, 1300);
		if (targetRoom.EnergyLeftToGive < targetRoomEnergyToSpend)
		{
			return true; // We have done everything we can do this tick!
		}

		targetRoomEnergyToSpend -= 3 * (BODYPART_COST.move + BODYPART_COST.carry);
		const bodyParts: BodyPartConstant[] = ["move", "carry", "move", "carry", "move", "carry"];

		if ((targetRoomEnergyToSpend -= BODYPART_COST.move + BODYPART_COST.work) >= 0)
		{
			bodyParts.push("move");
			bodyParts.push("work");

			while ((targetRoomEnergyToSpend -= 100) >= 0)
			{
				bodyParts.push("move");
				bodyParts.push("carry");
			}
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Runner, targetRoom.controller, bodyParts);
	}

	private static TrySpawnUpgrader(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		let targetRoomEnergyToSpend: number = Math.min(targetRoom.energyCapacityAvailable, 1800);
		if (targetRoom.EnergyLeftToGive < targetRoomEnergyToSpend)
		{
			return true; // We have done everything we can do this tick!
		}

		targetRoomEnergyToSpend -= BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work;
		const bodyParts: BodyPartConstant[] = ["move", "carry", "work"];

		while ((targetRoomEnergyToSpend -= 100) >= 0)
		{
			bodyParts.push("work");
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Upgrader, targetRoom.controller, bodyParts);
	}

	private static TrySpawnBuilder(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		let targetRoomEnergyToSpend: number = Math.min(targetRoom.energyCapacityAvailable, 1800);
		if (targetRoom.EnergyLeftToGive < targetRoomEnergyToSpend)
		{
			return true; // We have done everything we can do this tick!
		}

		targetRoomEnergyToSpend -= BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work;
		const bodyParts: BodyPartConstant[] = ["move", "carry", "work"];

		while ((targetRoomEnergyToSpend -= 50) >= 0)
		{
			bodyParts.push("carry");

			if (bodyParts.length <= 10 && targetRoomEnergyToSpend >= 100)
			{
				targetRoomEnergyToSpend -= 100;
				bodyParts.push("work");
			}
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Builder, targetRoom.controller, bodyParts);
	}

	// @ts-ignore: Expected to be unused when I'm not claiming
	private static TrySpawnClaimer(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (targetRoom.EnergyLeftToGive !== targetRoom.energyCapacityAvailable)
		{
			return true; // We have done everything we can do this tick!
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Claimer, targetRoom.controller, ["move", "claim"]);
	}

	// @ts-ignore: Expected to be unused when I'm not attacking
	private static TrySpawnAttacker(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		let targetRoomEnergyToSpend: number = Math.min(targetRoom.energyCapacityAvailable, 2000);
		if (targetRoom.EnergyLeftToGive < targetRoomEnergyToSpend)
		{
			return true; // We have done everything we can do this tick!
		}

		targetRoomEnergyToSpend -= BODYPART_COST.move + BODYPART_COST.attack;
		const bodyParts: BodyPartConstant[] = ["move", "attack"];

		while ((targetRoomEnergyToSpend -= BODYPART_COST.move + BODYPART_COST.attack) >= 0)
		{
			bodyParts.push("move");
			bodyParts.push("attack");
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Attacker, targetRoom.controller, bodyParts);
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
			(closestDistance > 50 && closestSpawn.id !== Find.Closest(targetPosition, Find.MySpawns())!.id))
		{
			return false; // Wait for a closer spawn to be available
		}

		const closestSpawnRoom: ControllableRoom = closestSpawn.room;
		const creepName: string = `${CreepType.ToString(creepType)[0]}${Find.VisibleRooms().indexOf(target.room || closestSpawnRoom) * 100 + (Memory.cc = (Memory.cc + 1 | 0) % 100)}`;

		// Take energy from the furthest away spawns and extensions first:
		const energyStructuresPriority: (StructureSpawn | StructureExtension)[] = Find.MyObjects(closestSpawnRoom, Type.SpawnsAndExtensions) as (StructureSpawn | StructureExtension)[];
		const controllerPosition: RoomPosition = closestSpawnRoom.controller.pos;
		energyStructuresPriority.sort((spawnOrExtension1, spawnOrExtension2) =>
		{
			return spawnOrExtension1.Type !== spawnOrExtension2.Type // Put all Spawns before all Extensions
				? spawnOrExtension2.Type - spawnOrExtension1.Type
				: Find.Distance(spawnOrExtension2.pos, controllerPosition) - Find.Distance(spawnOrExtension1.pos, controllerPosition);
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
				// directions: [closestSpawn.pos.getDirectionTo(targetPosition)],
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
