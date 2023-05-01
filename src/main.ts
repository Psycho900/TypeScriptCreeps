import { CreepBehavior } from "./Behaviors/Creep";
import { Find } from "./Find";
// import { Log } from "./Log";
import { SpawnBehavior } from "./Behaviors/Spawn";
import { TowerBehavior } from "./Behaviors/Tower";

export const loop = function(): void
{
	Find.EnsureInitializedForBeginningOfTick(
		/* SpawnBehavior.EnsureInitializedForBeginningOfTick */); // THIS MUST BE THE VERY FIRST THING WE DO! Otherwise our cache will be outdated

	TowerBehavior.Act();
	CreepBehavior.Act();
	SpawnBehavior.Act();

	// Log.Info(`[${Type.RoomPosition}] Current game tick is ${Game.time}`, OK, Object.values(Game.creeps)[0], Object.values(Game.rooms)[0].controller);
	// Log.Info(`${RoomObject.prototype.toString == StructureController.prototype.toString}`);

	// Automatically delete Memory of missing creeps
	for (const name in Memory.creeps)
	{
		if (Game.creeps[name] === undefined)
		{
			delete Memory.creeps[name];
		}
	}
};
