import axios from 'axios';
import cheerio from 'cheerio';
import { Request, Response, Router } from 'express';
import * as admin from 'firebase-admin';
import { OK } from 'http-status-codes';
import rp from 'request-promise';
'use strict';


// tslint:disable-next-line: no-var-requires
const fs = require('fs');

// tslint:disable-next-line: no-var-requires

const router = Router();

const getId = (url: string) => {
    const arr = url.split('/');
    return arr[5];
}

const findImage = (images: any = [], width: number, height: number) => {
    const image = images.find((x: any) => x.width === width && x.height === height)
    return image && image.value ? image.value : '';
}
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
        console.log(productBox)
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
                // const productDetail = {
                //     title: $(product).find('.title').text().trim(),
                //     image: $(product).find('img').attr('src'),
                //     category: $(product).attr('data-category'),
                //     id,
                //     price: $(product).attr('data-price'),
                //     brand:  $(product).attr('data-brand'),
                //     sku: $(product).attr('product-sku')
                // }
                // const responseData = await axios.get(productUrl);
                // admin.database().ref('products').push({
                //     id: responseData.data.id,
                //     sku: responseData.data.sku,
                //     name: responseData.data.name,
                //     price: responseData.data.price,
                //     discount: responseData.data.discount,
                //     categories: responseData.data.categories,
                //     meta_title: responseData.data.meta_title,
                //     description: responseData.data.description,
                //     brand: responseData.data.brand,
                //     current_seller: responseData.data.current_seller,
                //     thumbnail_url: responseData.data.thumbnail_url,

                // })
                data.push(1);
            }
        }
        return res.status(OK).json({ data, total: data.length });
    } catch (e) {
        console.error(e);
    }
});

router.get('/now', async (req: Request, res: Response) => {

    const data = require('../assets/data/com.json');
    const items = [];
    for (const item of data) {
        if (item.title.toLowerCase().includes('cơm')) {
            item.price = item.price.replace(/[^\w\s]/gi, '');
            item.promotionPrice = Number(item.price) - Math.ceil(Number(item.price) * 0.1);
            admin.database().ref('categories/-MIyoqIy1Q3SlnmygjlN').push(item);
            items.push(item);
        }
    }
    return res.json({ items });
})

router.get('/cat', async (req: Request, res: Response) => {
    const cat = await admin.database().ref('categories').push({ categoryName: 'Trà sữa ' })

    const data = require('../assets/data/trasua.json');
    const items = [];
    for (const item of data) {
        if (item.title.toLowerCase().includes('trà')) {
            item.price = item.price.replace(/[^\w\s]/gi, '');
            item.promotionPrice = Number(item.price) - Math.ceil(Number(item.price) * 0.1);
            admin.database().ref(`categories/${cat.key}/products`).push(item);
            items.push(item);
        }
    }
    return res.json({
        key: cat.key,
        data: items
    })
})

router.get('/banhmi', async (req: Request, res: Response) => {
    const catId = '-MIyqjAJJdbiWeKDeYtC';

    const config = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7,fr-FR;q=0.6,fr;q=0.5',
            'origin': 'https://www.foody.vn',
            'referer': 'https://www.foody.vn/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
            'x-foody-api-version': '1',
            'x-foody-app-type': '1004',
            'x-foody-client-id': '',
            'x-foody-client-type': '1',
            'x-foody-client-version': '1',
        }
    }


    const listSrc = require('../assets/data/banhmi.json');

    const data = [];
    for (const src of listSrc) {
        const id = getId(src);

        const productUrl = `https://gappapi.deliverynow.vn/api/delivery/get_detail?request_id=${id}&id_type=1`;

        const productData = await axios.get(productUrl, config);
        let productDetail: any = { ...productData.data.reply.delivery_detail };
        const product = {
            id,
            name: productDetail.name || '',
            displayImage: findImage(productDetail.photos, 640, 400),
            price:productDetail && productDetail.min_order_value && productDetail.min_order_value.value || 30000,
        }
        // tslint:disable-next-line: variable-name
        const res_photos = productDetail && productDetail.res_photos ? productDetail.res_photos : []
        admin.database().ref(`categories/${catId}/products/${id}`).set(product).then((newProduct) => {
            if(productDetail.res_photos){
                // tslint:disable-next-line: variable-name
                for (const res_photo of res_photos) {
                    const p = findImage(res_photo.photos, 640, 400);
                    admin.database().ref(`categories/${catId}/products/${id}/photos`).push(p)
                }
            }
        });

        data.push({...product,res_photos});
    }
    return res.json({
        mess: 'success',
        data
    })
})

router.get('/comrang', async (req: Request, res: Response) => {
    const catId = '-MIys7i-9MBKrV-OpmBM';

    const config = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7,fr-FR;q=0.6,fr;q=0.5',
            'origin': 'https://www.foody.vn',
            'referer': 'https://www.foody.vn/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
            'x-foody-api-version': '1',
            'x-foody-app-type': '1004',
            'x-foody-client-id': '',
            'x-foody-client-type': '1',
            'x-foody-client-version': '1',
        }
    }


    const listSrc = require('../assets/data/comrang.json');

    const data = [];
    for (const src of listSrc) {
        const id = getId(src);

        const productUrl = `https://gappapi.deliverynow.vn/api/delivery/get_detail?request_id=${id}&id_type=1`;

        const productData = await axios.get(productUrl, config);
        let productDetail: any = { ...productData.data.reply.delivery_detail };
        const product = {
            id,
            name: productDetail.name || '',
            displayImage: findImage(productDetail.photos, 640, 400),
            price:productDetail && productDetail.min_order_value && productDetail.min_order_value.value || 30000,
        }
        // tslint:disable-next-line: variable-name
        const res_photos = productDetail && productDetail.res_photos ? productDetail.res_photos : []
        admin.database().ref(`categories/${catId}/products/${id}`).set(product).then((newProduct) => {
            if(productDetail.res_photos){
                // tslint:disable-next-line: variable-name
                for (const res_photo of res_photos) {
                    const p = findImage(res_photo.photos, 640, 400);
                    admin.database().ref(`categories/${catId}/products/${id}/photos`).push(p)
                }
            }
        });

        data.push({...product,res_photos});
    }
    return res.json({
        mess: 'success',
        data
    })
})

router.get('/pho', async (req: Request, res: Response) => {
    const catId = '-MIyqc-mRxt8UccHAOBZ';

    const config = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7,fr-FR;q=0.6,fr;q=0.5',
            'origin': 'https://www.foody.vn',
            'referer': 'https://www.foody.vn/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
            'x-foody-api-version': '1',
            'x-foody-app-type': '1004',
            'x-foody-client-id': '',
            'x-foody-client-type': '1',
            'x-foody-client-version': '1',
        }
    }


    const listSrc = require('../assets/data/pho.json');

    const data = [];
    for (const src of listSrc) {
        const id = getId(src);

        const productUrl = `https://gappapi.deliverynow.vn/api/delivery/get_detail?request_id=${id}&id_type=1`;

        const productData = await axios.get(productUrl, config);
        let productDetail: any = { ...productData.data.reply.delivery_detail };
        const product = {
            id,
            name: productDetail.name || '',
            displayImage: findImage(productDetail.photos, 640, 400),
            price:productDetail && productDetail.min_order_value && productDetail.min_order_value.value || 30000,
        }
        // tslint:disable-next-line: variable-name
        const res_photos = productDetail && productDetail.res_photos ? productDetail.res_photos : []
        admin.database().ref(`categories/${catId}/products/${id}`).set(product).then((newProduct) => {
            if(productDetail.res_photos){
                // tslint:disable-next-line: variable-name
                for (const res_photo of res_photos) {
                    const p = findImage(res_photo.photos, 640, 400);
                    admin.database().ref(`categories/${catId}/products/${id}/photos`).push(p)
                }
            }
        });

        data.push({...product,res_photos});
    }
    return res.json({
        mess: 'success',
        data
    })
})

router.get('/com', async (req: Request, res: Response) => {
    const catId = '-MIyqPkogem_wdARRdmk';

    const config = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7,fr-FR;q=0.6,fr;q=0.5',
            'origin': 'https://www.foody.vn',
            'referer': 'https://www.foody.vn/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
            'x-foody-api-version': '1',
            'x-foody-app-type': '1004',
            'x-foody-client-id': '',
            'x-foody-client-type': '1',
            'x-foody-client-version': '1',
        }
    }


    const listSrc = require('../assets/data/com.json');

    const data = [];
    for (const src of listSrc) {
        const id = getId(src);

        const productUrl = `https://gappapi.deliverynow.vn/api/delivery/get_detail?request_id=${id}&id_type=1`;

        const productData = await axios.get(productUrl, config);
        let productDetail: any = { ...productData.data.reply.delivery_detail };
        const product = {
            id,
            name: productDetail.name || '',
            displayImage: findImage(productDetail.photos, 640, 400),
            price:productDetail && productDetail.min_order_value && productDetail.min_order_value.value || 30000,
        }
        // tslint:disable-next-line: variable-name
        const res_photos = productDetail && productDetail.res_photos ? productDetail.res_photos : []
        admin.database().ref(`categories/${catId}/products/${id}`).set(product).then((newProduct) => {
            if(productDetail.res_photos){
                // tslint:disable-next-line: variable-name
                for (const res_photo of res_photos) {
                    const p = findImage(res_photo.photos, 640, 400);
                    admin.database().ref(`categories/${catId}/products/${id}/photos`).push(p)
                }
            }
        });

        data.push({...product,res_photos});
    }
    return res.json({
        mess: 'success',
        data
    })
})

router.get('/bun', async (req: Request, res: Response) => {
    const catId = '-MIyrLUfaY5rW-KKYEfp';

    const config = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7,fr-FR;q=0.6,fr;q=0.5',
            'origin': 'https://www.foody.vn',
            'referer': 'https://www.foody.vn/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
            'x-foody-api-version': '1',
            'x-foody-app-type': '1004',
            'x-foody-client-id': '',
            'x-foody-client-type': '1',
            'x-foody-client-version': '1',
        }
    }


    const listSrc = require('../assets/data/bun.json');

    const data = [];
    for (const src of listSrc) {
        const id = getId(src);

        const productUrl = `https://gappapi.deliverynow.vn/api/delivery/get_detail?request_id=${id}&id_type=1`;

        const productData = await axios.get(productUrl, config);
        let productDetail: any = { ...productData.data.reply.delivery_detail };
        const product = {
            id,
            name: productDetail.name || '',
            displayImage: findImage(productDetail.photos, 640, 400),
            price:productDetail && productDetail.min_order_value && productDetail.min_order_value.value || 30000,
        }
        // tslint:disable-next-line: variable-name
        const res_photos = productDetail && productDetail.res_photos ? productDetail.res_photos : []
        admin.database().ref(`categories/${catId}/products/${id}`).set(product).then((newProduct) => {
            if(productDetail.res_photos){
                // tslint:disable-next-line: variable-name
                for (const res_photo of res_photos) {
                    const p = findImage(res_photo.photos, 640, 400);
                    admin.database().ref(`categories/${catId}/products/${id}/photos`).push(p)
                }
            }
        });

        data.push({...product,res_photos});
    }
    return res.json({
        mess: 'success',
        data
    })
})

router.get('/trasua', async (req: Request, res: Response) => {
    const catId = '-MIyt2n7Qzs3h4MpP7KN';

    const config = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7,fr-FR;q=0.6,fr;q=0.5',
            'origin': 'https://www.foody.vn',
            'referer': 'https://www.foody.vn/',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
            'x-foody-api-version': '1',
            'x-foody-app-type': '1004',
            'x-foody-client-id': '',
            'x-foody-client-type': '1',
            'x-foody-client-version': '1',
        }
    }


    const listSrc = require('../assets/data/trasua.json');

    const data = [];
    for (const src of listSrc) {
        const id = getId(src);

        const productUrl = `https://gappapi.deliverynow.vn/api/delivery/get_detail?request_id=${id}&id_type=1`;

        const productData = await axios.get(productUrl, config);
        let productDetail: any = { ...productData.data.reply.delivery_detail };
        const product = {
            id,
            name: productDetail.name || '',
            displayImage: findImage(productDetail.photos, 640, 400),
            price:productDetail && productDetail.min_order_value && productDetail.min_order_value.value || 30000,
        }
        // tslint:disable-next-line: variable-name
        const res_photos = productDetail && productDetail.res_photos ? productDetail.res_photos : []
        admin.database().ref(`categories/${catId}/products/${id}`).set(product).then((newProduct) => {
            if(productDetail.res_photos){
                // tslint:disable-next-line: variable-name
                for (const res_photo of res_photos) {
                    const p = findImage(res_photo.photos, 640, 400);
                    admin.database().ref(`categories/${catId}/products/${id}/photos`).push(p)
                }
            }
        });

        data.push({...product,res_photos});
    }
    return res.json({
        mess: 'success',
        data
    })
})
export default router;