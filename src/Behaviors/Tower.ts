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
			const enemyCreep: EnemyCreep | undefined = Find.Creeps(room, CreepType.Enemy)[0];
			if (enemyCreep === undefined)
			{
				continue;
			}

			for (const tower of Find.MyObjects(room, Type.Tower))
			{
				Log.Succeeded(tower.attack(enemyCreep), tower, enemyCreep);
			}
		}
	}
}
