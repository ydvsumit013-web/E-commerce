declare const client: import("redis").RedisClientType<{}, {}, {}, 3, {}>;
export declare const connectRedis: () => Promise<void>;
export declare const getCache: (key: string) => Promise<string | null>;
export declare const setCache: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
export declare const deleteCache: (key: string) => Promise<void>;
export declare const deleteCachePattern: (pattern: string) => Promise<void>;
export default client;
//# sourceMappingURL=redisService.d.ts.map