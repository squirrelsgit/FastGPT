import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { clearCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { findTeamById } from '@fastgpt/service/support/user/team/controller';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const {avatar,name} = req.body
    // 解析 JWT 获取用户信息
    //const userInfo =await authJWT(token)
    //const userId = userInfo.userId as string
    const team =await MongoTeam.findOne({name:name}).lean()
    if(!!team){
      throw new Error('团队已存在！');
    }
    const [{ _id: teamId }] = await MongoTeam.create(
        [
          {
            ownerId: null,
            name: name,
            avatar: avatar,
            balance:999900000,
            createTime: new Date()
          }
        ],
      );
    //debugger
    jsonRes(res, {
      data: teamId,
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
