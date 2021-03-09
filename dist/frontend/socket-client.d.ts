import { Disposable } from "@nivinjoseph/n-util";
/**
 * This should only listen (subscribe) to events, should not emit (publish)
 */
export declare class SocketClient implements Disposable {
    private readonly _serverUrl;
    private readonly _master;
    private readonly _channels;
    private readonly _mutex;
    private _isDisposed;
    private _disposePromise;
    constructor(serverUrl: string);
    subscribe(channel: string, event: string): Promise<SocketChannelSubscription>;
    dispose(): Promise<void>;
    private createChannel;
}
export interface SocketChannelSubscription {
    eventName: string;
    onData(callback: (data: any) => void): this;
    onConnectionChange(callback: () => void): this;
    unsubscribe(): void;
}
