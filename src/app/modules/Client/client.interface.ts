import { Document } from 'mongoose';
import { Types } from 'mongoose';

export interface IClient extends Document {
  auth: Types.ObjectId;

  // _id: Types.ObjectId;
  fullName: string;
  address: string;
  state: string;
  postalCode: string;

  image: string;

  fullNameInCard: string;
  cardNumber: string;
  cardExpiryDate: Date;
  cardCVC: string;

  // phoneNumber: string;
}
