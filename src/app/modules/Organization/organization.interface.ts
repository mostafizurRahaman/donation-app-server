import { Document, Types } from 'mongoose';

export interface IORGANIZATION extends Document {
  _id: Types.ObjectId;
  auth: Types.ObjectId;

  name: string;
  serviceType: string;
  address: string;
  state: string;
  postalCode: string;
  website: string;

  phoneNumber: string;

  boardMemberFullName: string;
  boardMemberEmail: string;
  boardMemberPhoneNumber: string;

  fullNameInCard: string;
  cardNumber: string;
  cardExpiryDate: Date;
  cardCVC: string;


  tfnOrAbnNumber: string;
  zakatLicenseHolderNumber: string | null;
}
