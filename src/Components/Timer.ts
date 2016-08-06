export class Timer {
    private id: string;
    private interval: number;
    private onElapsed: { (timer: Timer): void };
    private autoReset: boolean;

    constructor(id: string, interval: number, onElapsed: { (timer: Timer): void }) {
        this.id = id;
        this.interval = interval;
        this.onElapsed = onElapsed;

        if (!Memory["Timers"]) {
            Memory["Timers"] = {};
        }

        if (!this.Tick) {
            this.reset();
        }
    }

    private get Tick(): number {
        return Memory["Timers"][this.id];
    }
    private set Tick(value: number) {
        Memory["Timers"][this.id] = value;
    }

    public reset(): void {
        this.Tick = this.interval;
    }

    public update(): void {
        if (++this.Tick >= this.interval) {
            this.Tick = 0;
            this.onElapsed(this);
        }
    }
}