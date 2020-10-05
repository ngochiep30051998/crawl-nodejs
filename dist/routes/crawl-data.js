"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const request_promise_1 = tslib_1.__importDefault(require("request-promise"));
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
const axios_1 = tslib_1.__importDefault(require("axios"));
const admin = tslib_1.__importStar(require("firebase-admin"));
const router = express_1.Router();
router.get('/all', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const URL = `https://tiki.vn/bach-hoa-online/c4384?src=c.4384.hamburger_menu_fly_out_banner`;
        const options = {
            uri: URL,
            transform: (body) => {
                return cheerio_1.default.load(body);
            },
        };
        const $ = yield request_promise_1.default(options);
        const productBox = $('.product-box');
        const productList = productBox.find('.product-box-list');
        const data = [];
        for (let i = 0; i < productList.length; i++) {
            const item = $(productList[i]);
            const listItem = item.find('.product-item');
            for (let j = 0; j < listItem.length; j++) {
                const product = $(listItem[j]);
                const id = $(product).attr('data-id');
                const productUrl = `https://tiki.vn/api/v2/products/${id}`;
                const productDetail = yield axios_1.default.get(productUrl);
                const responseData = yield axios_1.default.get(productUrl);
                admin.database().ref('products').push({
                    id: responseData.data.id,
                    sku: responseData.data.sku,
                    name: responseData.data.name,
                    price: responseData.data.price,
                    discount: responseData.data.discount,
                    categories: responseData.data.categories,
                    meta_title: responseData.data.meta_title,
                    description: responseData.data.description,
                    brand: responseData.data.brand,
                    current_seller: responseData.data.current_seller,
                    thumbnail_url: responseData.data.thumbnail_url,
                });
                data.push(responseData.data);
            }
        }
        return res.status(http_status_codes_1.OK).json({ data, total: data.length });
    }
    catch (e) {
        console.error(e);
    }
}));
exports.default = router;
