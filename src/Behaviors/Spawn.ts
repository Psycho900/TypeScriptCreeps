declare global
{
	interface StructureSpawn { Act(): void; }
}

StructureSpawn.prototype.Act = function (): void
{
	return; // TODO_KevSchil: Implement this
}
