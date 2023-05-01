/* eslint-disable @typescript-eslint/no-unsafe-member-access */

let s_currentError: Error | null = null;
let s_shouldReportError: boolean = true; // Gets reset every ~150 ticks or so

export abstract /* static */ class Log
{
	public static GetTimestamp(): number
	{
		return Game.time % 10000;
	}

	public static Info(
		message: string,
		hr?: ScreepsReturnCode,
		objectToLog?: RoomObject | string,
		targetToLog?: RoomObject | RoomPosition | string): void
	{
		// @ts-ignore: Compiler optimization to not compile "console"
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		console.log(Log.GetMessagePrefix() + Log.GenerateMessage(message, hr || OK, objectToLog, targetToLog));
	}

	public static Error(
		message: string,
		hr: ScreepsReturnCode,
		objectToLog?: RoomObject | string,
		targetToLog?: RoomObject | RoomPosition | string): false
	{
		if (s_currentError !== null)
		{
			Log.Info(`!MULTIPLE ERRORS!:\n${s_currentError.message}\n${s_currentError.stack}`, hr);
		}

		message = Log.GenerateMessage(message, hr, objectToLog, targetToLog);
		s_currentError = new Error(message); // thrown at the end of main

		debugger;
		return false;
	}

	public static Warning(
		message: string,
		hr: ScreepsReturnCode,
		objectToLog?: RoomObject | string,
		targetToLog?: RoomObject | RoomPosition | string): void
	{
		message = `!WARNING!: ${message}`;

		if ((Game.time % 100) !== 0)
		{
			Log.Info(message, hr, objectToLog, targetToLog);
		}
		else // To get my attention if the issue persists enough ticks in a row
		{
			Log.Error(message, hr, objectToLog, targetToLog);
		}
	}

	public static TakeCurrentError(): Error | null
	{
		if (s_currentError === null)
		{
			return null;
		}

		const error: Error = s_currentError;
		s_currentError = null;

		error.message = Log.GetMessagePrefix() + error.message;
		return error;
	}

	public static Succeeded(
		hr: ScreepsReturnCode,
		objectToLog?: RoomObject | string,
		targetToLog?: RoomObject | RoomPosition | string): boolean
	{
		// //if (Game.cpu.getUsed() > 1.4 * Game.cpu.limit)
		if (s_shouldReportError !== false && Game.cpu.bucket < 9900)
		{
			Log.Error("Approaching CPU limit!", hr, objectToLog, targetToLog);
			s_shouldReportError = false;
		}

		if (hr === 0)
		{
			return true;
		}

		if (hr === ERR_NOT_IN_RANGE || hr === ERR_NOT_ENOUGH_RESOURCES)
		{
			// Expected?
			Log.Error("Rarely expected error code?", hr, objectToLog, targetToLog);
		}
		else if (hr === ERR_NO_PATH)
		{
			Log.Warning("Rarely expected error code", hr, objectToLog, targetToLog);
		}
		else if (hr === ERR_NO_BODYPART)
		{
			Log.Error("No body part", hr, objectToLog, targetToLog);

			// objectToLog?.suicide(); // TODO_KevSchil: Are we ready for this yet?
		}
		else
		{
			Log.Error("Unexpected error code", hr, objectToLog, targetToLog);
		}

		return false;
	}

	// public static Assert(
	// 	condition: boolean,
	// 	message: string,
	// 	objectToLog?: Creep,
	// 	targetToLog?: RoomObject): condition is true
	// {
	// 	if (condition !== true)
	// 	{
	// 		Log.Error(message, OK, objectToLog, targetToLog);
	// 	}
	//
	// 	return condition;
	// }

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

	private static ReturnCodeToString(hr: ScreepsReturnCode): string
	{
		switch (hr)
		{
			case OK: return "OK";
			case ERR_NOT_OWNER /*      */: return "ERR_NOT_OWNER";
			case ERR_NO_PATH /*        */: return "ERR_NO_PATH";
			case ERR_NAME_EXISTS /*    */: return "ERR_NAME_EXISTS";
			case ERR_BUSY /*           */: return "ERR_BUSY";
			case ERR_NOT_FOUND /*      */: return "ERR_NOT_FOUND";
			case ERR_NOT_ENOUGH_RESOURCES: return "ERR_NOT_ENOUGH_RESOURCES";
			case ERR_INVALID_TARGET /* */: return "ERR_INVALID_TARGET";
			case ERR_FULL /*           */: return "ERR_FULL";
			case ERR_NOT_IN_RANGE /*   */: return "ERR_NOT_IN_RANGE";
			case ERR_INVALID_ARGS /*   */: return "ERR_INVALID_ARGS";
			case ERR_TIRED /*          */: return "ERR_TIRED";
			case ERR_NO_BODYPART /*    */: return "ERR_NO_BODYPART";
			case ERR_RCL_NOT_ENOUGH /* */: return "ERR_RCL_NOT_ENOUGH";
			case ERR_GCL_NOT_ENOUGH /* */: return "ERR_GCL_NOT_ENOUGH";
			default /*                 */: return (hr as number | null | undefined)?.toString() ?? "NULLish";
		}
	}

	private static GenerateMessage(
		message: string,
		hr: ScreepsReturnCode,
		objectToLog: RoomObject | string | undefined,
		targetToLog: RoomObject | RoomPosition | string | undefined): string
	{
		if (hr !== 0)
		{
			message = `${Log.ReturnCodeToString(hr)}! ${message}`;
		}

		return message
			+ Log.ToLogString(objectToLog)
			+ Log.ToLogString(targetToLog);
	}
}
