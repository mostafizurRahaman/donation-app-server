import { TContent } from './page.constant';

export interface IContent extends Document {
  type: TContent;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TContentPayload {
  type: TContent;
  title: string;
  content: string;
}
