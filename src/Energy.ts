

interface RoomObject { GetCurrentEnergy(): number; }
interface RoomObject { GetCurrentResources(): number; }
interface RoomObject { GetCurrentNonEnergy(): number; }

RoomObject.prototype.GetCurrentEnergy = function ()
{
	// @ts-ignore: Intentional Reflection
	return 0 | (this.store ? this.store[RESOURCE_ENERGY] : this.energy);
};

RoomObject.prototype.GetCurrentResources = function ()
{
	// @ts-ignore: Intentional Reflection
	return (this.store && this.store.getUsedCapacity()) || this.amount || this.mineralAmount || (0 | this.energy);
};

RoomObject.prototype.GetCurrentNonEnergy = function ()
{
	// @ts-ignore: Intentional Reflection
	return this.store ? (this.store.getUsedCapacity() - (0 | this.store[RESOURCE_ENERGY])) : (this.amount || this.mineralAmount);
};
