import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    //debugger
    await connectToDatabase();
    const {tmbId,teamId} = req.query
    const token = req.cookies.fastgpt_token as string; 
    // 解析 JWT 获取用户信息
    const userInfo =await authJWT(token)
    var tId = userInfo.teamId as string
    if(teamId){
      tId = teamId as string
    }
    await MongoResourcePermission.deleteOne(
        { tmbId: tmbId, teamId: tId },
    );
    const member = await MongoTeamMember.findOne({ _id: tmbId}).lean()
    if(member?.role == "owner"){
      await MongoTeam.findOneAndUpdate(
        { _id: tId},
        { $set: { ownerId: null } }
      );
    }
    await MongoTeamMember.deleteOne(
        { _id: tmbId},
    );
    
    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
