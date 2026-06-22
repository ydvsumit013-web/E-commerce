import mongoose, { Document } from 'mongoose';
export interface ICartItem {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
}
export interface ICart extends Document {
    user: mongoose.Types.ObjectId;
    items: ICartItem[];
    discountCode?: string;
    discountPercent: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICart, {}, {}, {}, mongoose.Document<unknown, {}, ICart, {}, mongoose.DefaultSchemaOptions> & ICart & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICart>;
export default _default;
//# sourceMappingURL=Cart.d.ts.map