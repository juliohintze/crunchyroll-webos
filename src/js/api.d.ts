declare interface Data {
    [key: string]: any;
}
declare var Api: {
    request: (method: string, endpoint: string, data: Data) => Promise<any>;
    createUuid: () => string;
    tryLogin: () => Promise<any>;
    toSerie: (data: Data) => object;
    toSerieEpisode: (data: Data, source: string) => object;
}