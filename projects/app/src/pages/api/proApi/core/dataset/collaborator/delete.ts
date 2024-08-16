import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    //debugger
    await connectToDatabase();
    const {tmbId,datasetId} = req.query
    const token = req.cookies.fastgpt_token as string; 
    // 解析 JWT 获取用户信息
    const userInfo =await authJWT(token)
    const teamId = userInfo.teamId as string
    await MongoResourcePermission.deleteOne({
        teamId:teamId,
        tmbId:tmbId,
        resourceId:datasetId,
        resourceType:PerResourceTypeEnum.dataset
    })
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
