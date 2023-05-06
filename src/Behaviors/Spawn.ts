import { } from "../Energy";
import { } from "../Objects";
import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

const c_ticksToForecast = 100 as const;

const c_harvesterBodyWithWorkCount =
	[
		null, // ["carry", "move"], //                                         0
		["work", "carry", "move"], //                                 1
		["work", "work", "carry", "move"], //                         2
		["work", "work", "work", "carry", "move"], //                 3
		null, // ["work", "work", "work", "work", "carry", "move"], //         4
		["work", "work", "work", "work", "work", "carry", "move"], // 5
	] as const;

const c_optimalRunnerBody =
	[
		"work", "move",
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
	] as const;

const c_optimalBuilderBody =
	[
		"carry", "carry", "carry", "carry", "carry", //  5 carry's
		"carry", "carry", "carry", "carry", "carry", // 10 carry's
		"carry", "carry", "carry", "carry", "carry", // 15 carry's
		"carry", "carry", "carry", "carry", "carry", // 20 carry's
		"carry", "carry", "carry", "carry", "carry", // 25 carry's
		"work", "work", "work", "work", "work", //  5 work's
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
		"attack", "move", // 13 attack's
		"attack", "move", // 14 attack's
		"attack", "move", // 15 attack's
	] as const;

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
				spawn.room.energyAvailable >= 300)
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
			if (SpawnBehavior.TrySpawnHarvesterInRoom(spawns, targetRoom, workPartCounts) !== false)
			{
				continue;
			}

			const targetControllerId: Id<StructureController> = targetRoom.controller.id;

			if (runnerCarryPartCounts.has(targetControllerId) === false) // Make sure each room has at least 1 runner
			{
				SpawnBehavior.TrySpawnRunner(spawns, targetRoom);
			}
			else if (Find.MyObjects(targetRoom, Type.ConstructionSite).length === 0)
			{
				if (SpawnBehavior.ShouldSpawnUpgrader(targetRoom) !== false)
				{
					SpawnBehavior.TrySpawnUpgrader(spawns, targetRoom);
				}
			}
			else if ((workPartCounts.get(targetControllerId) || 0) < 4
				|| (carryPartCounts.get(targetControllerId) || 0) < 6)
			{
				SpawnBehavior.TrySpawnBuilder(spawns, targetRoom);
			}

			if (spawns.length === 0)
			{
				return;
			}

			for (let maxWorkCount: 1 | 2 | 3 | 4 = 1;
				maxWorkCount !== 5 && SpawnBehavior.TrySpawnHarvesterInRoom(spawns, targetRoom, workPartCounts, maxWorkCount as 1 | 2 | 3 | 4) === false;
				++maxWorkCount) // saturate sources with harvesters
				;

			if (spawns.length === 0)
			{
				return;
			}

			if (((Game.time & 0x7) === 0) && Find.Creeps(targetRoom, CreepType.Enemy).length !== 0)
			{
				SpawnBehavior.TrySpawnAttacker(spawns, targetRoom);
				return;
			}

			// SpawnBehavior.TrySpawnClaimer(spawns, targetRoom);
		}
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
		const bodyParts: BodyPartConstant[] = ["carry", "carry", "carry", "move", "move", "move"];

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

	private static ShouldSpawnUpgrader(targetRoom: ControllableRoom): boolean
	{
		if ((Game.time & 0xFF) !== 0 || Find.Creeps(targetRoom, CreepType.Enemy).length !== 0)
		{
			return false;
		}

		const targetPosition: RoomPosition = targetRoom.controller.pos;

		for (const testStorage of Find.MyObjects(targetRoom, Type.Storage))
		{
			if (Find.IsSameRoomAndWithinRange(testStorage.pos, targetPosition, 4) !== false)
			{
				return testStorage.EnergyLeftToTake < 900000;
			}
		}

		for (const testContainer of Find.MyObjects(targetRoom, Type.Container))
		{
			if (Find.IsSameRoomAndWithinRange(testContainer.pos, targetPosition, 4) !== false
				&& testContainer.EnergyLeftToTake >= 50)
			{
				return false;
			}
		}

		for (const testLink of Find.MyObjects(targetRoom, Type.Link))
		{
			if (Find.IsSameRoomAndWithinRange(testLink.pos, targetPosition, 4) !== false
				&& testLink.EnergyLeftToTake >= 50)
			{
				return false;
			}
		}

		return true;
	}

	private static TrySpawnUpgrader(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (targetRoom.EnergyLeftToGive <= targetRoom.energyCapacityAvailable - 50)
		{
			return true; // We have done everything we can do this tick!
		}

		let targetRoomEnergyToSpend: number = targetRoom.EnergyLeftToGive - (BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work);
		const bodyParts: BodyPartConstant[] = ["work", "carry", "move"];

		while ((targetRoomEnergyToSpend -= 100) >= 0)
		{
			bodyParts.push("work");
		}

		return SpawnBehavior.TrySpawn(spawns, CreepType.Upgrader, targetRoom.controller, bodyParts);
	}

	private static TrySpawnBuilder(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (SpawnBehavior.TrySpawn(spawns, CreepType.Builder, targetRoom.controller, c_optimalBuilderBody) !== false
			|| targetRoom.EnergyLeftToGive <= targetRoom.energyCapacityAvailable - 50)
		{
			return true; // We have done everything we can do this tick!
		}

		let targetRoomEnergyToSpend: number = targetRoom.EnergyLeftToGive - (BODYPART_COST.move + BODYPART_COST.carry + BODYPART_COST.work);
		const bodyParts: BodyPartConstant[] = ["work", "carry", "move"];

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
		return SpawnBehavior.TrySpawn(spawns, CreepType.Claimer, targetRoom.controller, ["move", "claim"]);
	}

	// @ts-ignore: Expected to be unused when I'm not attacking
	private static TrySpawnAttacker(spawns: StructureSpawn[], targetRoom: ControllableRoom): boolean
	{
		if (SpawnBehavior.TrySpawn(spawns, CreepType.Attacker, targetRoom.controller, c_optimalAttackerBody) !== false
			|| targetRoom.EnergyLeftToGive <= targetRoom.energyCapacityAvailable - 50)
		{
			return true; // We have done everything we can do this tick!
		}

		let targetRoomEnergyToSpend: number = targetRoom.EnergyLeftToGive - 8 * (BODYPART_COST.move + BODYPART_COST.attack);
		if (targetRoomEnergyToSpend < 0)
		{
			return false;
		}

		const bodyParts: BodyPartConstant[] = ["attack", "move", "attack", "move", "attack", "move", "attack", "move", "attack", "move", "attack", "move", "attack", "move", "attack", "move"];

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
			(closestDistance > 100 && closestSpawn.id !== Find.Closest(targetPosition, Find.MySpawns())!.id))
		{
			return false; // Wait for a closer spawn to be available
		}

		const closestSpawnRoom: ControllableRoom = closestSpawn.room;
		const creepName: string = `${CreepType.ToString(creepType)[0]}${targetPosition.roomName[targetPosition.roomName.length - 1]}${Memory.cc = (Memory.cc + 1 | 0) % 100}`;

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
}
