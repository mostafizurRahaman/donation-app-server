import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import sendResponse from '../../utils/sendResponse';
import { ContentService } from './content.service';

const createContentOrUpdate = asyncHandler(async (req, res) => {
  const result = await ContentService.createOrUpdatePage(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Content Created Successfully!',
    data: result,
  });
});

const getAllContent = asyncHandler(async (req, res) => {
  const result = await ContentService.getAllContent();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Content Retrieved Successfully!',
    data: result,
  });
});

const getContentByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const result = await ContentService.getContentByType(type);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Content Retrieved Successfully!',
    data: result,
  });
});

export const ContentController = {
  createContentOrUpdate,
  getAllContent,
  getContentByType,
};
