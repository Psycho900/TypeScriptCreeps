import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

export abstract /* static */ class TowerBehavior
{
	public static Act(): void
	{
		for (const room of Find.VisibleRooms())
		{
			const enemyCreeps: readonly EnemyCreep[] = Find.Creeps(room, CreepType.Enemy);
			let towers: readonly StructureTower[];

			if (enemyCreeps.length === 0 || (towers = Find.MyObjects(room, Type.Tower)).length === 0)
			{
				continue;
			}

			const enemyCreep: EnemyCreep = TowerBehavior.GetEnemyToAttack(enemyCreeps);

			for (const tower of towers)
			{
				Log.Succeeded(tower.attack(enemyCreep), tower, enemyCreep);
			}
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
