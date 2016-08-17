export class Timer {
    private id: string;
    private interval: number;
    private onElapsed: { (timer: Timer): void };
    private autoReset: boolean;
    private memoryRoot: any;

    constructor(id: string, interval: number, onElapsed: { (timer: Timer): void }, memoryRoot?: any) {
        this.id = id;
        this.interval = interval;
        this.onElapsed = onElapsed;
        this.memoryRoot = memoryRoot ? memoryRoot : Memory;

        if (!this.memoryRoot["timers"]) {
            this.memoryRoot["timers"] = {};
        }

        if (!this.Tick) {
            this.reset();
        }
    }

    private get Tick(): number {
        return this.memoryRoot["timers"][this.id];
    }
    private set Tick(value: number) {
        this.memoryRoot["timers"][this.id] = value;
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