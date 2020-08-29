"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
const router = express_1.Router();
const URL = `https://freetuts.net/reactjs/tu-hoc-reactjs`;
const options = {
    uri: URL,
    transform: (body) => {
        return cheerio_1.default.load(body);
    },
};
router.get('/all', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return res.status(http_status_codes_1.OK).json({ user: 123 });
}));
exports.default = router;
