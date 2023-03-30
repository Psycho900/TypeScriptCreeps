import { CreepBehavior } from "./Behaviors/Creep";
import { Find } from "./Find";
import { SpawnBehavior } from "./Behaviors/Spawn";

export const loop = function(): void
{
	Find.ResetCacheForBeginningOfTick(); // THIS MUST BE THE VERY FIRST THING WE DO! Otherwise our cache will be outdated

	SpawnBehavior.TryAct();
	CreepBehavior.Act();

	// Log.Info(`[${Type.RoomPosition}] Current game tick is ${Game.time}`, OK, Object.values(Game.creeps)[0], Object.values(Game.rooms)[0].controller);
	// Log.Info(`${RoomObject.prototype.toString == StructureController.prototype.toString}`);

	if ((Game.time & 0x1F) !== 0)
	{
		return;
	}

	// Automatically delete Memory of missing creeps
	for (const name in Memory.creeps)
	{
		if (Game.creeps[name] == null)
		{
			delete Memory.creeps[name];
		}
	}
};
