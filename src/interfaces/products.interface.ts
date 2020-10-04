export interface IProduct {
    productId: string;
    name: string;
    detail: string;
    image: string;
    price?: number;
    promotionPrice?: number;
}

export interface ICategory {
    categoryId: string;
    categoryName: string;
    products?: IProduct[];
}
