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
    const {permission,tmbIds,datasetId} = req.body
    const token = req.cookies.fastgpt_token as string; 
    // 解析 JWT 获取用户信息
    const userInfo =await authJWT(token)
    const teamId = userInfo.teamId as string
    for(const tmbId of tmbIds){
        try {
            const filter = {
                teamId: teamId,
                tmbId: tmbId,
                resourceId: datasetId,
                resourceType: PerResourceTypeEnum.dataset
            };
        
            const update = {
                permission: permission
            };
        
            const options = {
                upsert: true, // 如果没有找到匹配的文档，则创建一个新文档
                new: true // 返回更新后的文档
            };
            await MongoResourcePermission.findOneAndUpdate(filter, update, options);
          } catch (error) {
            console.error('Error updating document:', error);
          }
    }
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
