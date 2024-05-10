import { CreepBehavior } from "./Behaviors/Creep";
import { Find } from "./Find";
import { Log } from "./Log";
import { SpawnBehavior } from "./Behaviors/Spawn";
import { TowerBehavior } from "./Behaviors/Tower";

export const loop = function(): void
{
	// const cpu: number = Game.cpu.getUsed();
	// Log.Info(cpu.toString());

	Log.EnsureInitializedForBeginningOfTick();
	Find.EnsureInitializedForBeginningOfTick(
		/* SpawnBehavior.EnsureInitializedForBeginningOfTick */); // THIS MUST BE THE VERY FIRST THING WE DO! Otherwise our cache will be outdated

	TowerBehavior.Act();
	/* Log.Performance("CreepBehavior", */ CreepBehavior.Act();
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

	Log.ReportDataForEndOfTick();

	// const room: Room = Game.rooms["W32S28"];
	// for (const wall of Find.MyObjects(room, Type.Wall))
	// {
	// 	const x: number = wall.pos.x;
	// 	if (x > 21)
	// 	{
	// 		wall.destroy();
	// 	}
	// }
};
