import { GET, POST, PUT, DELETE } from '@/web/common/api/request';
import type { CreateQuestionGuideParams,CreateQuestionGuideParams2 } from '@/global/core/ai/api.d';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';
import { DatasetDataListItemType } from '@/global/core/dataset/type';
export const postQuestionGuide = (data: CreateQuestionGuideParams, cancelToken: AbortController) =>
  POST<string[]>('/core/ai/agent/createQuestionGuide', data, { cancelToken });

export const postQuestionGuide2 = (data: CreateQuestionGuideParams2) =>
  POST<string>('/core/ai/agent/createQuestionGuide2', data);

export const getDatasetDataList = (data: {datasetIds : string[]}) =>
  POST<DatasetDataListItemType[]>('/core/ai/agent/getDatasetDataList', data);
