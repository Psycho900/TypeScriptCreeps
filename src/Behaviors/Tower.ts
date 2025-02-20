import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

export abstract /* static */ class TowerBehavior
{
	public static Act(): void
	{
		for (const room of Find.s_visibleRooms)
		{
			const towers: readonly StructureTower[] = Find.MyObjects(room, Type.Tower);
			if (towers.length === 0)
			{
				continue;
			}

			const enemyCreeps: readonly EnemyCreep[] = Find.Creeps(room, CreepType.Enemy);

			if (enemyCreeps.length !== 0)
			{
				const enemyCreep: EnemyCreep = TowerBehavior.GetEnemyToAttack(enemyCreeps);
				for (const tower of towers)
				{
					if (tower.store.energy >= 10)
					{
						Log.Succeeded(tower.attack(enemyCreep), tower, enemyCreep);
					}
				}

				continue;
			}

			const allStructures: readonly Structure[] = Find.MyObjects(room, Type.AllStructures);
			let weakestStructure: Structure | undefined;
			let weakestStructureHitPoints: number = 100000;
			for (let tick: number = Game.time; (tick & 1) === 0; tick >>= 1)
			{
				weakestStructureHitPoints += 50000;
			}

			for (const currentStructure of allStructures)
			{
				const currentStructureHitPoints: number = currentStructure.hits;

				if (currentStructureHitPoints < weakestStructureHitPoints &&
					currentStructureHitPoints < currentStructure.hitsMax - 799) // Towers repair up to 800 hits within a range of <= 5
				{
					weakestStructure = currentStructure;
					weakestStructureHitPoints = currentStructureHitPoints;
				}
			}

			if (weakestStructure !== undefined)
			{
				for (const tower of towers)
				{
					if (tower.store.energy > 950)
					{
						Log.Succeeded(tower.repair(weakestStructure), tower, weakestStructure);
					}
				}

				continue;
			}

			// for (const tower of towers)
			// {
			// 	Log.Succeeded(tower.attack(enemyCreep), tower, enemyCreep);
			// }
			//
			// const allCreeps: readonly Creep[] = Find.Creeps(room, CreepTypes.All);
			// const creepCount: number = allCreeps.length;
			// let weakestCreep: Creep | undefined = allCreeps[0];
			//
			// if (creepCount > 1)
			// {
			// 	let bestScore: number = scoreFunction(weakestCreep);
			//
			// 	for (let i: number = 1; i < creepCount; ++i)
			// 	{
			// 		const currentElement: T = allCreeps[i];
			// 		const currentScore: number = scoreFunction(currentElement);
			//
			// 		if (currentScore > bestScore) // Take the 1st one with the highest score
			// 		{
			// 			weakestCreep = currentElement;
			// 			bestScore = currentScore;
			// 		}
			// 	}
			// }
			//
			//
			//
			// for (const tower of towers)
			// {
			// 	Log.Succeeded(tower.attack(enemyCreep), tower, enemyCreep);
			// }
		}
	}

	private static GetEnemyToAttack(enemyCreeps: readonly EnemyCreep[]): EnemyCreep
	{
		enemyCreeps = TowerBehavior.GetEnemiesToAttack(enemyCreeps);

		const enemyCreepsLength: number = enemyCreeps.length;
		let enemyCreepWithLowestHealth: EnemyCreep | undefined = enemyCreeps[0];

		if (enemyCreeps.length > 1)
		{
			let lowestHealth: number = enemyCreepWithLowestHealth.hits;

			for (let i: number = 1; i < enemyCreepsLength; ++i)
			{
				const currentEnemyCreep: EnemyCreep = enemyCreeps[i];
				const currentEnemyCreepHealth: number = currentEnemyCreep.hits;

				if (currentEnemyCreepHealth < lowestHealth) // Take the 1st one with the lowest health
				{
					enemyCreepWithLowestHealth = currentEnemyCreep;
					lowestHealth = currentEnemyCreepHealth;
				}
			}
		}

		return enemyCreepWithLowestHealth;
	}

	private static GetEnemiesToAttack(enemyCreeps: readonly EnemyCreep[]): readonly EnemyCreep[]
	{
		if (enemyCreeps.length <= 1)
		{
			return enemyCreeps;
		}

		let bestEnemyCreeps: EnemyCreep[] | undefined;

		for (const enemyCreep of enemyCreeps)
		{
			if (enemyCreep.getActiveBodyparts("heal") !== 0)
			{
				(bestEnemyCreeps ||= []).push(enemyCreep);
			}
		}

		if (bestEnemyCreeps !== undefined)
		{
			return bestEnemyCreeps;
		}

		for (const enemyCreep of enemyCreeps)
		{
			if (enemyCreep.getActiveBodyparts("attack") !== 0)
			{
				(bestEnemyCreeps ||= []).push(enemyCreep);
			}
		}

		if (bestEnemyCreeps !== undefined)
		{
			return bestEnemyCreeps;
		}

		for (const enemyCreep of enemyCreeps)
		{
			if (enemyCreep.getActiveBodyparts("ranged_attack") !== 0)
			{
				(bestEnemyCreeps ||= []).push(enemyCreep);
			}
		}

		return bestEnemyCreeps || enemyCreeps;
	}
}
