import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { CreateQuestionGuideParams } from '@/global/core/ai/api.d';
import { pushQuestionGuideUsage } from '@/service/support/wallet/usage/push';
import { createQuestionGuide } from '@fastgpt/service/core/ai/functions/createQuestionGuide2';
import { authChatCert } from '@/service/support/permission/auth/chat';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { Types } from '@fastgpt/service/common/mongo';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const datasetIds = req.body ;
    const result = []
    for (const datasetId of datasetIds) {
        var size = 3
        if(datasetIds.length > 3){
          size = 1
        }
        const randomDatasetData = await MongoDatasetData.aggregate([
          {
            $match: {
              datasetId: new Types.ObjectId(datasetId.datasetId),
            }
          },
          { $sample: { size: size } }
        ]);
        result.push(...randomDatasetData)
    }
    jsonRes(res, {
      data: result
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
