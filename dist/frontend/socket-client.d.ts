import { Disposable } from "@nivinjoseph/n-util";
/**
 * This should only listen (subscribe) to events, should not emit (publish)
 */
export declare class SocketClient implements Disposable {
    private readonly _serverUrl;
    private readonly _client;
    private readonly _channels;
    private readonly _mutex;
    private _isDisposed;
    constructor(serverUrl: string);
    subscribe(channel: string, event: string, handler: (data: any) => void): Promise<void>;
    unsubscribe(channel: string, event?: string, handler?: (data: any) => void): Promise<void>;
    dispose(): Promise<void>;
    private createChannel;
}
