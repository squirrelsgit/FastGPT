import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { clearCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { findTeamById, findMembersTeamId } from '@fastgpt/service/support/user/team/controller';
import { authJWT } from '@fastgpt/service/support/permission/controller';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();

    const token = req.cookies.fastgpt_token as string;
    // 解析 JWT 获取用户信息
    const userInfo = await authJWT(token)
    const teamId = userInfo.teamId as string
    const resout = await findMembersTeamId({ teamId });
    //debugger
    jsonRes(res, {
      data: resout,
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
