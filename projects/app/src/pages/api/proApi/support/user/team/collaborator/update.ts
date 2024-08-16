import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const {permission,tmbIds,teamId} = req.body
    const token = req.cookies.fastgpt_token as string; 
    // 解析 JWT 获取用户信息
    const userInfo =await authJWT(token)
    var tId = userInfo.teamId as string
    if(teamId){
      tId = teamId
    }
    for(const tmbId of tmbIds){
        try {
            const updatedDocument = await MongoResourcePermission.findOneAndUpdate(
              { tmbId: tmbId, teamId: tId },
              { $set: { permission: permission } },
              { new: true }
            );
            console.log('Updated document:', updatedDocument);
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
