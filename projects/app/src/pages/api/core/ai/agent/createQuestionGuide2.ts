import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import type { CreateQuestionGuideParams } from '@/global/core/ai/api.d';
import { pushQuestionGuideUsage } from '@/service/support/wallet/usage/push';
import { createQuestionGuide } from '@fastgpt/service/core/ai/functions/createQuestionGuide2';
import { authChatCert } from '@/service/support/permission/auth/chat';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    var { messages } = req.body ;
    // const { tmbId, teamId } = await authChatCert({
    //   req,
    //   authToken: true
    // });
    function getRandomSubarray(arr:[], size:number) {
      let shuffled = arr.slice(0), i = arr.length, temp, index;
      while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
      }
      return shuffled.slice(0, size);
    }
    if(messages && messages.length > 24){
      messages = getRandomSubarray(messages,24)
    }
    const qgModel = global.llmModels[0];
    const { result, tokens } = await createQuestionGuide({
      messages,
      model: qgModel.model
    });
    jsonRes(res, {
      data: result
    });

    // pushQuestionGuideUsage({
    //   tokens,
    //   teamId,
    //   tmbId
    // });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
