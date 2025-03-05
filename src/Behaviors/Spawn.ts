import { } from "../Energy";
import { } from "../Objects";
import { CreepType, CreepTypes } from "../CreepType";
import { Type, Types } from "../Type";
import { Find } from "../Find";
import { Log } from "../Log";

const c_ticksToForecast = 100 as const;
const c_maxSpawnDistanceFromTarget = 75 as const;

const c_harvesterBodyWithWorkCount =
	[
		null, // ["carry", "move"], //                                0
		["work", "carry", "move"], //                                 1
		["work", "work", "carry", "move"], //                         2
		["work", "work", "work", "carry", "move"], //                 3
		null, // ["work", "work", "work", "work", "carry", "move"],   4
		["work", "work", "work", "work", "work", "carry", "move"], // 5
	] as const;

const c_optimalRunnerBody =
	[
		"carry", "move", //  1 carry
		"carry", "move", //  2 carry's
		"carry", "move", //  3 carry's
		"carry", "move", //  4 carry's
		"carry", "move", //  5 carry's
		"carry", "move", //  6 carry's
		"carry", "move", //  7 carry's
		"carry", "move", //  8 carry's
		"carry", "move", //  9 carry's
		"carry", "move", // 10 carry's
		"carry", "move", // 11 carry's
		"carry", "move", // 12 carry's
		"carry", "move", // 13 carry's
		"carry", "move", // 14 carry's
		"work", "move",
	] as const;

const c_optimalUpgraderBodyInRoomWith1Source =
	[
		"move",
		"work", "work", "work", "work", "work", // 5 work's
		"work", //                                 6 work's
		"carry",
	] as const;

const c_optimalUpgraderBodyInRoomWith2Sources =
	[
		"move",
		"work", "work", "work", "work", "work", //  5 work's
		"work", "work", "work", "work", "work", // 10 work's
		"work", "work", "work", "work", "work", // 15 work's
		"carry",
	] as const;

const c_optimalBuilderBody =
	[
		"carry", "carry", "carry", "carry", "carry", //  5 carry's
		"carry", "carry", "carry", "carry", "carry", // 10 carry's
		"carry", "carry", "carry", "carry", "carry", // 15 carry's
		"work", "carry", // 1 work                      16 carry's
		"work", "carry", // 2 work's                    17 carry's
		"work", "carry", // 3 work's                    18 carry's
		"work", "carry", // 4 work's                    19 carry's
		"work", "carry", // 5 work's                    20 carry's
		"move",
	] as const;

const c_optimalAttackerBody =
	[
		"attack", "move", //  1 attack
		"attack", "move", //  2 attack's
		"attack", "move", //  3 attack's
		"attack", "move", //  4 attack's
		"attack", "move", //  5 attack's
		"attack", "move", //  6 attack's
		"attack", "move", //  7 attack's
		"attack", "move", //  8 attack's
		"attack", "move", //  9 attack's
		"attack", "move", // 10 attack's
		"attack", "move", // 11 attack's
		"attack", "move", // 12 attack's
	] as const;

declare global
{
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface Room extends EnergyGiver { }
}

export abstract /* static */ class SpawnBehavior
{
	public static Act(): void
	{
		let spawns: StructureSpawn[] | undefined;

		for (const spawn of Find.s_mySpawns) // Get all my usable spawns
		{
			if (spawn.spawning !== null ||
				spawn.room.energyAvailable < 300 ||
				spawn.room.controller.my === false ||
				spawn.isActive() === false)
			{
				continue;
			}

			if (spawns === undefined)
			{
				spawns = [spawn];
			}
			else
			{
				spawns.push(spawn);
			}
		}

		if (spawns === undefined)
		{
			return;
		}

		let targetRooms: ControllableRoom[] | undefined;

		for (const room of Find.s_visibleRooms) // Get all target rooms
		{
			room.EnergyLeftToGive = room.energyAvailable;

			const controller: StructureController | undefined = room.controller;
			if (controller === undefined || (controller.my !== true /* && Find.Creeps(room, CreepType.Enemy).length !== 0 */))
			{
				continue;
			}

			if (targetRooms === undefined) // Do not send creeps into not-my-rooms containing enemies
			{
				targetRooms = [room as ControllableRoom];
			}
			else
			{
				targetRooms.push(room as ControllableRoom);
			}
		}

		if (targetRooms === undefined)
		{
			return;
		}

		const workPartCounts: Map<Id<AnyTargetRoomObject>, number> = new Map<Id<AnyTargetRoomObject>, number>();
		const carryPartCounts: Map<Id<AnyTargetRoomObject>, number> = new Map<Id<AnyTargetRoomObject>, number>();
		const runnerCarryPartCounts: Map<Id<StructureController>, number> = new Map<Id<StructureController>, number>();

		for (const creep of Find.s_mySpawningAndSpawnedCreeps) // Collect how many body parts are working towards each target
		{
			const ticksToLive: number | undefined = creep.ticksToLive; // undefined means the creep is still spawning
			if (ticksToLive !== undefined && (ticksToLive < c_ticksToForecast || 2 * creep.hits <= creep.hitsMax)) // Creep being murdered?
			{
				continue; // Creep is probably dying soon
			}

			switch (creep.CreepType)
			{
				case CreepType.Runner:
					{
						const targetId: Id<StructureController> = creep.Target.id;
						runnerCarryPartCounts.set(targetId, (runnerCarryPartCounts.get(targetId) || 0) + creep.getActiveBodyparts("carry"));
						continue;
					}

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
			if (spawns.length === 0)
			{
				return;
			}

			if (SpawnBehavior.TrySpawnHarvesterInRoom(spawns, targetRoom, workPartCounts) !== false)
			{
				continue;
			}

			const targetControllerId: Id<StructureController> = targetRoom.controller.id;

			if (runnerCarryPartCounts.has(targetControllerId) === false) // Make sure each room has at least 1 runner
			{
				SpawnBehavior.TrySpawnRunner(spawns, targetRoom);
				continue;
			}

			if (Find.MyObjects(targetRoom, Type.ConstructionSite).length === 0)
			{
				if ((Game.time & 0xFF) === 0)
				{
					SpawnBehavior.TrySpawnUpgrader(spawns, targetRoom);
				}
			}
			else if ((workPartCounts.get(targetControllerId) || 0) < 4
				 || (carryPartCounts.get(targetControllerId) || 0) < 5)
			{
				SpawnBehavior.TrySpawnBuilder(spawns, targetRoom);
			}

			for (let maxWorkCount: 1 | 2 | 3 | 4 = 1;
				maxWorkCount !== 5 && SpawnBehavior.TrySpawnHarvesterInRoom(spawns, targetRoom, workPartCounts, maxWorkCount as 1 | 2 | 3 | 4) === false;
				++maxWorkCount) // saturate sources with harvesters
				;

			if (spawns.length === 0)
			{
				return;
			}

			// if (runnerCarryPartCount < 12) // Make sure each room has at least 2 runner
			// {
			// 	SpawnBehavior.TrySpawnRunner(spawns, targetRoom);
			// }
			//
			// if (spawns.length === 0)
			// {
			// 	return;
			// }

			if (SpawnBehavior.ShouldSpawnAttacker(targetRoom) !== false)
			{
				SpawnBehavior.TrySpawnAttacker(spawns, targetRoom);
				continue;
			}
		}

		if (spawns.length === 0)
		{
			return;
		}

		// SpawnBehavior.TrySpawnClaimer(spawns);
	}

	private static TrySpawnHarvesterInRoom(
		spawns: StructureSpawn[],
		targetRoom: ControllableRoom,
		workPartCounts: Map<Id<AnyTargetRoomObject>, number>,
		maxWorkCount?: 1 | 2 | 3 | 4): boolean
	{
		for (const source of Find.MyObjects(targetRoom, Type.Source))
		{
			if (workPartCounts.get(source.id) === maxWorkCount)
			{
				SpawnBehavior.TrySpawnHarvester(spawns, source, 5 - (maxWorkCount || 0) as 1 | 2 | 3 | 4 | 5);
				return true;
			}
		}

		return false;
	}

	private static TrySpawnHarvester(
		spawns: StructureSpawn[],
		targetSource: Source,
		maxWorkCount: 1 | 2 | 3 | 4 | 5): boolean
	{
		return SpawnBehavior.TrySpawn(spawns, CreepType.Harvester, targetSource, c_harvesterBodyWithWorkCount[5])
			|| SpawnBehavior.TrySpawn(spawns, CreepType.Harvester, targetSource, c_harvesterBodyWithWorkCount[maxWorkCount === 2 ? 2 : 3])
			|| SpawnBehavior.TrySpawn(spawns, CreepType.Harvester, targetSource, c_harvesterBodyWithWorkCount[maxWorkCount === 1 ? 1 : 2]);
	}

	private static TrySpawnRunner(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (SpawnBehavior.TrySpawn(spawns, CreepType.Runner, targetRoom.controller, c_optimalRunnerBody) !== false)
		{
			return true; // We have done everything we can do this tick!
		}

		let targetRoomEnergyToSpend: number = targetRoom.EnergyLeftToGive - 3 * (BODYPART_COST.move + BODYPART_COST.carry);
		const bodyParts: BodyPartConstant[] = [];

		if ((targetRoomEnergyToSpend -= BODYPART_COST.move + BODYPART_COST.work) >= 0)
		{
			bodyParts.push("work", "move");

			while ((targetRoomEnergyToSpend -= 100) >= 0)
			{
				bodyParts.push("carry", "move");
			}
		}

		bodyParts.push("carry", "move", "carry", "move", "carry", "move");
		return SpawnBehavior.TrySpawn(spawns, CreepType.Runner, targetRoom.controller, bodyParts);
	}

	private static TrySpawnUpgrader(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (Find.Creeps(targetRoom, CreepType.Enemy).length !== 0)
		{
			return false;
		}

		const storage: StructureStorage | undefined = Find.MyObjects(targetRoom, Type.Storage)[0];
		if (storage !== undefined &&
			Find.IsSameRoomAndWithinRange(storage.pos, targetRoom.controller.pos, 4) !== false)
		{
			let projectedEnergy: number = storage.store.energy; // The logic before CreepBehavior.Run messed up storage.EnergyToGive earlier in this tick
			if (projectedEnergy < 75000)
			{
				return false;
			}

			const controllerId: Id<StructureController> = targetRoom.controller.id;

			for (const testCreep of Find.s_mySpawningAndSpawnedCreeps)
			{
				if (testCreep.IsAny(CreepTypes.AllConsumers) !== false &&
					testCreep.Target.id === controllerId &&
					(projectedEnergy -= (testCreep.ticksToLive || 1500) * testCreep.getActiveBodyparts("work")) < 75000)
				{
					return false;
				}
			}
		}
		else if ((Game.time & 0x1FF) !== 0) // No storage near the controller
		{
			return false;
		}
		else
		{
			const targetPosition: RoomPosition = targetRoom.controller.pos;
			for (const testContainer of Find.MyObjects(targetRoom, Type.Container))
			{
				if (Find.IsSameRoomAndWithinRange(testContainer.pos, targetPosition, 4) !== false
					&& testContainer.EnergyLeftToTake >= 200)
				{
					return false;
				}
			}

			for (const testLink of Find.MyObjects(targetRoom, Type.Link))
			{
				if (Find.IsSameRoomAndWithinRange(testLink.pos, targetPosition, 4) !== false
					&& testLink.EnergyLeftToTake >= 200)
				{
					return false;
				}
			}

			// Confirmed, build the ideal upgrader when there is no storage near the controller
			if (SpawnBehavior.TrySpawn(
				spawns,
				CreepType.Upgrader,
				targetRoom.controller,
				Find.MyObjects(targetRoom, Type.Source).length <= 1 ? c_optimalUpgraderBodyInRoomWith1Source : c_optimalUpgraderBodyInRoomWith2Sources) !== false
				|| targetRoom.EnergyLeftToGive <= targetRoom.energyCapacityAvailable - 50)
			{
				return true; // We have done everything we can do this tick!
			}
		}

		let targetRoomEnergyToSpend: number = targetRoom.EnergyLeftToGive - (BODYPART_COST.move + BODYPART_COST.carry + 2 * BODYPART_COST.work);
		const bodyParts: BodyPartConstant[] = ["move", "work", "work"];

		while ((targetRoomEnergyToSpend -= 100) >= 0 && bodyParts.length < 46)
		{
			bodyParts.push("work");
		}

		bodyParts.push("carry");
		return SpawnBehavior.TrySpawn(spawns, CreepType.Upgrader, targetRoom.controller, bodyParts);
	}

	private static TrySpawnBuilder(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (SpawnBehavior.TrySpawn(spawns, CreepType.Builder, targetRoom.controller, c_optimalBuilderBody) !== false
			|| targetRoom.EnergyLeftToGive <= targetRoom.energyCapacityAvailable - 50)
		{
			return true; // We have done everything we can do this tick!
		}

		let targetRoomEnergyToSpend: number = targetRoom.EnergyLeftToGive - (BODYPART_COST.move + 3 * BODYPART_COST.carry + BODYPART_COST.work);
		const bodyParts: BodyPartConstant[] = [];

		while ((targetRoomEnergyToSpend -= 50) >= 0)
		{
			bodyParts.push("carry");

			if (targetRoomEnergyToSpend >= 100 && bodyParts.length < 8)
			{
				targetRoomEnergyToSpend -= 100;
				bodyParts.push("work");
			}
		}

		bodyParts.push("carry", "carry", "work", "carry", "move");
		return SpawnBehavior.TrySpawn(spawns, CreepType.Builder, targetRoom.controller, bodyParts);
	}

	// @ts-expect-error: Expected to be unused when I'm not claiming
	private static TrySpawnClaimer(spawns: StructureSpawn[]): boolean
	{
		for (const creep of Find.s_mySpawningAndSpawnedCreeps)
		{
			if (creep.CreepType === CreepType.Claimer)
			{
				return false;
			}
		}

		return spawns.length !== 0 &&
			SpawnBehavior.TrySpawn(spawns, CreepType.Claimer, spawns[0].room.controller, ["move", "move", "claim"]);
	}

	private static ShouldSpawnAttacker(targetRoom: ControllableRoom): boolean
	{
		const enemyCreeps: readonly EnemyCreep[] = Find.Creeps(targetRoom, CreepType.Enemy);

		if (enemyCreeps.length === 0 || Find.Creeps(targetRoom, CreepType.Attacker).length !== 0)
		{
			return false;
		}

		for (const enemyCreep of enemyCreeps)
		{
			if (enemyCreep.owner.username === "Invader" && Find.MyObjects(targetRoom, Type.Tower).length !== 0) // Towers are sufficient
			{
				continue;
			}

			if (enemyCreep.getActiveBodyparts("attack") !== 0 || enemyCreep.getActiveBodyparts("ranged_attack") !== 0)
			{
				return true;
			}
		}

		return false;
	}

	private static TrySpawnAttacker(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (SpawnBehavior.TrySpawn(spawns, CreepType.Attacker, targetRoom.controller, c_optimalAttackerBody) !== false)
		{
			return true; // We have done everything we can do this tick!
		}

		let targetRoomEnergyToSpend: number = targetRoom.EnergyLeftToGive - 4 * (BODYPART_COST.move + BODYPART_COST.attack);
		if (targetRoomEnergyToSpend < 0)
		{
			return false;
		}

		const bodyParts: BodyPartConstant[] = ["attack", "move", "attack", "move", "attack", "move", "attack", "move"];

		while ((targetRoomEnergyToSpend -= BODYPART_COST.attack + BODYPART_COST.move) >= 0)
		{
			bodyParts.push("attack", "move");
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
		let closestDistance: number = 575; // Make sure the creep spends more than half its life doing its job
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
			(closestDistance > c_maxSpawnDistanceFromTarget && closestSpawn.id !== Find.Closest(targetPosition, Find.s_mySpawns)!.id))
		{
			return false; // Wait for a closer spawn to be available
		}

		const closestSpawnRoom: ControllableRoom = closestSpawn.room;
		let creepName: string = SpawnBehavior.GenerateCreepName(creepType, targetPosition);

		// Take energy from the furthest away spawns and extensions first:
		const energyStructuresPriority = Find.MyObjects(closestSpawnRoom, Types.SpawnsAndExtensions) as (StructureSpawn | StructureExtension)[];
		const controllerPosition: RoomPosition = closestSpawnRoom.controller.pos;
		energyStructuresPriority.sort((spawnOrExtension1, spawnOrExtension2) =>
		{
			return spawnOrExtension1.Type !== spawnOrExtension2.Type // Put all Spawns before all Extensions
				? spawnOrExtension2.Type - spawnOrExtension1.Type
				: Find.Distance(spawnOrExtension2.pos, controllerPosition) - Find.Distance(spawnOrExtension1.pos, controllerPosition);
		});

		if (targetPosition.roomName !== closestSpawnRoom.name)
		{
			creepName += "_" + closestSpawnRoom.name[2] + closestSpawnRoom.name[5];
		}

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

		// Log.Info(`Spawning ${creepName}`, OK, closestSpawn, target);

		spawns.splice(closestSpawnIndex, 1); // Remove 1 element at index spawnIndex
		closestSpawnRoom.EnergyLeftToGive -= bodyPartsCost;

		spawnIndex = spawnCount - 1; // Because we already removed 1 element a couple lines earlier
		while (--spawnIndex >= 0)
		{
			if (spawns[spawnIndex].room.EnergyLeftToGive < 300)
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

	private static GenerateCreepName(creepType: number, targetPosition: RoomPosition): string
	{
		const creepNamePrefix: string = CreepTypes.ToString(creepType)[0];
		const creepNameSuffix: string = targetPosition.roomName[2] + targetPosition.roomName[5];

		let i: number = Game.time;
		const max: number = i + 27;
		while (++i !== max)
		{
			const creepName: string = creepNamePrefix + String.fromCharCode(0x61 + (i % 26)) + creepNameSuffix; // 'a'
			if (Game.creeps[creepName] === undefined)
			{
				Game.creeps[creepName] = null!;
				return creepName;
			}
		}

		return creepNamePrefix + "_" + i.toString();
	}
}
