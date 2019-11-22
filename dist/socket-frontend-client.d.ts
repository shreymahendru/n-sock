import { Disposable } from "@nivinjoseph/n-util";
export declare class SocketFrontEndClient implements Disposable {
    private readonly _serverUrl;
    private readonly _channels;
    private _isDisposed;
    constructor(serverUrl: string);
    subscribe(channel: string, event: string, handler: (data: any) => void): void;
    unsubscribe(channel: string, event?: string, handler?: (data: any) => void): void;
    dispose(): Promise<void>;
    private createChannel;
}
