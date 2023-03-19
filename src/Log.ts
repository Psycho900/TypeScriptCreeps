/* eslint-disable @typescript-eslint/no-unsafe-member-access */

const c_hrToString: Record<ScreepsReturnCode, string> =
{
	[0]: "OK",
	[-1]: "ERR_NOT_OWNER",
	[-2]: "ERR_NO_PATH",
	[-3]: "ERR_NAME_EXISTS",
	[-4]: "ERR_BUSY",
	[-5]: "ERR_NOT_FOUND",
	[-6]: "ERR_NOT_ENOUGH_RESOURCES/ENERGY",
	[-7]: "ERR_INVALID_TARGET",
	[-8]: "ERR_FULL",
	[-9]: "ERR_NOT_IN_RANGE",
	[-10]: "ERR_INVALID_ARGS",
	[-11]: "ERR_TIRED",
	[-12]: "ERR_NO_BODYPART",
	[-14]: "ERR_RCL_NOT_ENOUGH",
	[-15]: "ERR_GCL_NOT_ENOUGH",
};

let s_currentError: Error | null = null;
let s_shouldReportError: boolean = true; // Gets reset every ~150 ticks or so

export abstract /* static */ class Log
{
	public static GetTimestamp(): number
	{
		return Game.time % 10000;
	}

	private static GetMessagePrefix(): string
	{
		return `[${Game.time} @ ${(100 * Game.cpu.getUsed() / Game.cpu.limit) | 0}% CPU]: `;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private static ToLogString(objectToLog: any | null | undefined): string
	{
		return objectToLog == null // null || undefined
			? "" // eslint-disable-next-line @typescript-eslint/no-unsafe-call
			: `\n${objectToLog.ToString ? objectToLog.ToString() : objectToLog}`;
	}

	private static GenerateMessage(
		message: string | null | undefined,
		hr?: ScreepsReturnCode | null,
		creepToLog?: Creep,
		targetToLog?: RoomObject): string
	{
		message ??= "";

		if (hr)
		{
			message = `${c_hrToString[hr] || hr}! ${message}`;
		}

		return message
			+ Log.ToLogString(creepToLog)
			+ Log.ToLogString(targetToLog);
	}

	public static Info(
		message: string | null | undefined,
		hr?: ScreepsReturnCode | null,
		creepToLog?: Creep,
		targetToLog?: RoomObject): void
	{
		message = Log.GenerateMessage(message, hr, creepToLog, targetToLog);

		// eslint-disable-next-line no-console
		console.log(Log.GetMessagePrefix() + message);
	}

	public static Error(
		message: string | null | undefined,
		hr: ScreepsReturnCode,
		creepToLog?: Creep,
		targetToLog?: RoomObject): void
	{
		if (s_currentError)
		{
			Log.Info(s_currentError.stack);
		}

		message = Log.GenerateMessage(message, hr, creepToLog, targetToLog);
		s_currentError = new Error(message); // thrown at the end of main
	}

	public static Warning(
		message: string | null | undefined,
		hr: ScreepsReturnCode,
		creepToLog?: Creep,
		targetToLog?: RoomObject): void
	{
		// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
		message = "Warning: " + message;

		if (Game.time % 1000)
		{
			Log.Info(message, hr, creepToLog, targetToLog);
		}
		else // To get my attention if the issue persists enough ticks in a row
		{
			Log.Error(message, hr, creepToLog, targetToLog);
		}
	}

	public static TakeCurrentErrorfunction(): Error | null
	{
		if (!s_currentError)
		{
			return null;
		}

		const error = s_currentError;
		s_currentError = null;

		error.message = Log.GetMessagePrefix() + error.message;
		return error;
	}

	public static Succeeded(
		hr: ScreepsReturnCode,
		creepToLog?: Creep,
		targetToLog?: RoomObject): boolean
	{
		// //if (Game.cpu.getUsed() > 1.4 * Game.cpu.limit)
		if (s_shouldReportError && Game.cpu.bucket < 9900)
		{
			Log.Error("Approaching CPU limit!", hr, creepToLog, targetToLog);
			s_shouldReportError = false;
		}

		if (hr === OK)
		{
			return true;
		}

		if (hr === ERR_NOT_IN_RANGE || hr === ERR_NOT_ENOUGH_RESOURCES)
		{
			// Expected
		}
		else if (hr === ERR_NO_PATH)
		{
			Log.Warning("Rarely expected error code", hr, creepToLog, targetToLog);
		}
		else if (hr === ERR_NO_BODYPART)
		{
			Log.Error("No body part. Self destructing now", hr, creepToLog, targetToLog);

			if (creepToLog)
			{
				creepToLog.suicide();
			}
		}
		else
		{
			Log.Error("Unexpected error code", hr, creepToLog, targetToLog);
		}

		return false;
	}

	public static Assert(
		condition: boolean,
		message: string,
		creepToLog?: Creep,
		targetToLog?: RoomObject): boolean
	{
		if (!condition)
		{
			Log.Error(message, OK /* hr */, creepToLog, targetToLog);
		}

		return condition;
	}
}
