export default class Profiler {
    private static usedOnStart = 0;
    private static enabled = false;
    private static depth = 0;

    private static setupProfiler() {
        Profiler.depth = 0; // reset depth, this needs to be done each tick.
        Game.profiler = {
            stream(duration: any, filter: any) {
                Profiler.setupMemory('stream', duration || 10, filter);
            },
            email(duration: any, filter: any) {
                Profiler.setupMemory('email', duration || 100, filter);
            },
            profile(duration: any, filter: any) {
                Profiler.setupMemory('profile', duration || 100, filter);
            },
            reset: Profiler.resetMemory,
        };

        Profiler.overloadCPUCalc();
    }

    private static setupMemory(profileType: any, duration: any, filter: any) {
        Profiler.resetMemory();
        if (!Memory["profiler"]) {
            Memory["profiler"] = {
                map: {},
                totalTime: 0,
                enabledTick: Game.time + 1,
                disableTick: Game.time + duration,
                type: profileType,
                filter,
            };
        }
    }

    private static resetMemory() {
        Memory["profiler"] = null;
    }

    private static overloadCPUCalc() {
        if (Game.rooms["sim"]) {
            Profiler.usedOnStart = 0; // This needs to be reset, but only in the sim.
            Game.cpu.getUsed = function getUsed() {
                return performance.now() - Profiler.usedOnStart;
            };
        }
    }

    private static getFilter() {
        return Memory["profiler"].filter;
    }

    private static wrapFunction(name: any, originalFunction: any) {
        return function wrappedFunction() {
            if (Profiler.Profiler.isProfiling()) {
                const nameMatchesFilter = name === Profiler.getFilter();
                const start = Game.cpu.getUsed();
                if (nameMatchesFilter) {
                    Profiler.depth++;
                }
                const result = originalFunction.apply(this, arguments);
                if (Profiler.depth > 0 || !Profiler.getFilter()) {
                    const end = Game.cpu.getUsed();
                    Profiler.Profiler.record(name, end - start);
                }
                if (nameMatchesFilter) {
                    Profiler.depth--;
                }
                return result;
            }

            return originalFunction.apply(this, arguments);
        };
    }

    private static hookUpPrototypes() {
        Profiler.Profiler.prototypes.forEach(proto => {
            Profiler.profileObjectFunctions(proto.val, proto.name);
        });
    }

    private static profileObjectFunctions(object: any, label: any) {
        const objectToWrap = object.prototype ? object.prototype : object;

        Object.keys(objectToWrap).forEach(functionName => {
            const extendedLabel = `${label}.${functionName}`;
            try {
                if (typeof objectToWrap[functionName] === 'function' && functionName !== 'getUsed') {
                    const originalFunction = objectToWrap[functionName];
                    objectToWrap[functionName] = Profiler.profileFunction(originalFunction, extendedLabel);
                }
            } catch (e) { } /* eslint no-empty:0 */
        });

        return objectToWrap;
    }

    private static profileFunction(fn: any, functionName: any) {
        const fnName = functionName || fn.name;
        if (!fnName) {
            console.log('Couldn\'t find a function name for - ', fn);
            console.log('Will not profile this function.');
            return fn;
        }

        return Profiler.wrapFunction(fnName, fn);
    }

    private static Profiler = {
        printProfile() {
            console.log(Profiler.Profiler.output());
        },

        emailProfile() {
            Game.notify(Profiler.Profiler.output(), 0);
        },

        output() {
            const elapsedTicks = Game.time - Memory["profiler"].enabledTick + 1;
            const header = 'calls\t\ttime\t\tavg\t\tfunction';
            const footer = [
                `Avg: ${(Memory["profiler"].totalTime / elapsedTicks).toFixed(2)}`,
                `Total: ${Memory["profiler"].totalTime.toFixed(2)}`,
                `Ticks: ${elapsedTicks}`,
            ].join('\t');
            return [].concat(header, Profiler.Profiler.lines().slice(0, 20), footer).join('\n');
        },

        lines() {
            const stats = Object.keys(Memory["profiler"].map).map(functionName => {
                const functionCalls = Memory["profiler"].map[functionName];
                return {
                    name: functionName,
                    calls: functionCalls.calls,
                    totalTime: functionCalls.time,
                    averageTime: functionCalls.time / functionCalls.calls,
                };
            }).sort((val1, val2) => {
                return val2.totalTime - val1.totalTime;
            });

            const lines = stats.map(data => {
                return [
                    data.calls,
                    data.totalTime.toFixed(1),
                    data.averageTime.toFixed(3),
                    data.name,
                ].join('\t\t');
            });

            return lines;
        },

        prototypes: [
            { name: 'Game', val: Game },
            { name: 'Room', val: Room },
            { name: 'Structure', val: Structure },
            { name: 'Spawn', val: Spawn },
            { name: 'Creep', val: Creep },
            { name: 'RoomPosition', val: RoomPosition },
            //{ name: 'Source', val: Source },
            { name: 'Flag', val: Flag },
        ],

        record(functionName: any, time: any) {
            if (!Memory["profiler"].map[functionName]) {
                Memory["profiler"].map[functionName] = {
                    time: 0,
                    calls: 0,
                };
            }
            Memory["profiler"].map[functionName].calls++;
            Memory["profiler"].map[functionName].time += time;
        },

        endTick() {
            if (Game.time >= Memory["profiler"].enabledTick) {
                const cpuUsed = Game.cpu.getUsed();
                Memory["profiler"].totalTime += cpuUsed;
                Profiler.Profiler.report();
            }
        },

        report() {
            if (Profiler.Profiler.shouldPrint()) {
                Profiler.Profiler.printProfile();
            } else if (Profiler.Profiler.shouldEmail()) {
                Profiler.Profiler.emailProfile();
            }
        },

        isProfiling() {
            return Profiler.enabled && !!Memory["profiler"] && Game.time <= Memory["profiler"].disableTick;
        },

        type() {
            return Memory["profiler"].type;
        },

        shouldPrint() {
            const streaming = Profiler.Profiler.type() === 'stream';
            const profiling = Profiler.Profiler.type() === 'profile';
            const onEndingTick = Memory["profiler"].disableTick === Game.time;
            return streaming || (profiling && onEndingTick);
        },

        shouldEmail() {
            return Profiler.Profiler.type() === 'email' && Memory["profiler"].disableTick === Game.time;
        },
    };

    public static wrap(callback: any) {
        if (Profiler.enabled) {
            Profiler.setupProfiler();
        }

        if (Profiler.Profiler.isProfiling()) {
            Profiler.usedOnStart = Game.cpu.getUsed();

            // Commented lines are part of an on going experiment to keep the profiler
            // performant, and measure certain types of overhead.

            // var callbackStart = Game.cpu.getUsed();
            const returnVal = callback();
            // var callbackEnd = Game.cpu.getUsed();
            Profiler.Profiler.endTick();
            // var end = Game.cpu.getUsed();

            // var profilerTime = (end - start) - (callbackEnd - callbackStart);
            // var callbackTime = callbackEnd - callbackStart;
            // var unaccounted = end - profilerTime - callbackTime;
            // console.log('total-', end, 'profiler-', profilerTime, 'callbacktime-',
            // callbackTime, 'start-', start, 'unaccounted', unaccounted);
            return returnVal;
        }

        return callback();
    }

    public static enable() {
        Profiler.enabled = true;
        Profiler.hookUpPrototypes();
    }

    public static registerObject(object: any, label: any) {
        return Profiler.profileObjectFunctions(object, label);
    }

    public static registerFN(fn: any, functionName: any) {
        return Profiler.profileFunction(fn, functionName);
    }
}