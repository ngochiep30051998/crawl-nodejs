import { Request, Response, Router } from 'express';
import { BAD_REQUEST, CREATED, OK } from 'http-status-codes';
import { ParamsDictionary } from 'express-serve-static-core';

import { paramMissingError } from '@shared/constants';

import rp from 'request-promise';
import cheerio from 'cheerio';
import axios from 'axios';
import * as admin from 'firebase-admin';

const router = Router();



router.get('/all', async (req: Request, res: Response) => {
    try {
        const URL = `https://tiki.vn/bach-hoa-online/c4384?src=c.4384.hamburger_menu_fly_out_banner`;

        const options = {
            uri: URL,
            transform: (body: any) => {
                // Khi lấy dữ liệu từ trang thành công nó sẽ tự động parse DOM
                return cheerio.load(body);
            },
        };
        const $ = await rp(options);
        const productBox = $('.product-box');
        const productList = productBox.find('.product-box-list');
        const data = [];
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < productList.length; i++) {
            const item = $(productList[i]);
            const listItem = item.find('.product-item');
            // tslint:disable-next-line: prefer-for-of
            for (let j = 0; j < listItem.length; j++) {
                const product = $(listItem[j]);
                const id = $(product).attr('data-id');
                const productUrl = `https://tiki.vn/api/v2/products/${id}`;
                const productDetail = await axios.get(productUrl);
                // const productDetail = {
                //     title: $(product).find('.title').text().trim(),
                //     image: $(product).find('img').attr('src'),
                //     category: $(product).attr('data-category'),
                //     id,
                //     price: $(product).attr('data-price'),
                //     brand:  $(product).attr('data-brand'),
                //     sku: $(product).attr('product-sku')
                // }
                const responseData = await axios.get(productUrl);
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

                })
                data.push(responseData.data);
            }
        }
        return res.status(OK).json({ data, total: data.length });
    } catch (e) {
        console.error(e);
    }
});
export default router;