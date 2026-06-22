"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTime = void 0;
const responseTime = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        // Already set by routes; log here too
        if (!res.headersSent) {
            res.setHeader('X-Response-Time', `${duration}ms`);
        }
    });
    next();
};
exports.responseTime = responseTime;
//# sourceMappingURL=responseTime.js.map