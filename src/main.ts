import { Find } from "./Find";
// import { Log } from "./Log";
import { SpawnBehavior } from "./Behaviors/Spawn";
// import { Type } from "./Type";

declare global
{
	/*
	Example types, expand on these or remove them and add your own.
	Note: Values, properties defined here do no fully *exist* by this type definition alone.
	You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

	Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
	Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
	*/
	// Memory extension samples
	// interface Memory
	// {
	// 	/*uuid: number;*/
	// 	/*log: any;*/
	// }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = function (): void
{
	Find.ResetCacheForBeginningOfTick(); // THIS MUST BE THE VERY FIRST THING WE DO! Otherwise our cache will be outdated

	SpawnBehavior.Act();

	// Log.Info(`[${Type.RoomPosition}] Current game tick is ${Game.time}`, OK, Object.values(Game.creeps)[0], Object.values(Game.rooms)[0].controller);
	// Log.Info(`${RoomObject.prototype.toString == StructureController.prototype.toString}`);

	if (Game.time & 0x1FF)
	{
		return;
	}

	// Automatically delete Memory of missing creeps
	for (const name in Memory.creeps)
	{
		if (!(name in Game.creeps))
		{
			delete Memory.creeps[name];
		}
	}
};
