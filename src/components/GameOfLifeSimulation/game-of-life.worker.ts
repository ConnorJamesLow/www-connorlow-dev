/// <reference lib="webworker" />
import type { WorkerMessage } from "./game-of-life-worker-impl.js";

/**
 * Worker entry must not statically import WASM (top-level await) before
 * `onmessage` is registered; otherwise `init` can be posted and lost.
 */
let messageChain: Promise<void> = Promise.resolve();

self.onmessage = (event: MessageEvent) => {
    messageChain = messageChain
        .then(async () => {
            const { handleGameOfLifeWorkerMessage } = await import(
                "./game-of-life-worker-impl.js"
            );
            handleGameOfLifeWorkerMessage(
                event as MessageEvent<WorkerMessage>,
            );
        })
        .catch(() => {});
};
