import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    //debugger
    await connectToDatabase();
    const {teamId} = req.query
    const token = req.cookies.fastgpt_token as string; 
    // 解析 JWT 获取用户信息
    const userInfo =await authJWT(token)
    const userId = userInfo.userId as string
    const tmb  = await MongoTeamMember.findOne({userId:userId,teamId:teamId})
    await MongoResourcePermission.deleteOne(
        { tmbId: tmb?._id, teamId: teamId },
    );
    await MongoTeamMember.deleteOne(
        { _id: tmb?._id},
    );
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
