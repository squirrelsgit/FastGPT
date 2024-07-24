//import Cookie from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import {
    TeamMemberRoleEnum,
    TeamMemberStatusEnum,
    notLeaveStatus
  } from '@fastgpt/global/support/user/team/constant';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    //debugger
    // const { username,code,password,inviterId } = req.body as{
    //     username: string;
    //     code: string;
    //     password: string;
    //     inviterId?: string;
    //   };
    let bodyData = '';
    // 监听请求体的 'data' 事件
    req.on('data', (chunk) => {
      bodyData += chunk;
    });
     // 监听请求体的 'end' 事件
    req.on('end', async () => {
      //debugger
      // 打印请求体的内容
      if(bodyData !== ''){
        const bodyJSON = JSON.parse(bodyData);
        const [{ _id: userId,lastLoginTmbId }] = await MongoUser.create(
            [
              {
                username: bodyJSON.username,
                password: bodyJSON.password
              }
            ],
            // { session }
          );
          const [{ _id: teamId }] = await MongoTeam.create(
            [
              {
                ownerId: userId,
                name: bodyJSON.username+"的团队",
                avatar: "/icon/human.svg",
                balance:999900000,
                createTime: new Date()
              }
            ],
            //{ session }
          );
          await MongoTeamMember.create(
            [
              {
                teamId: teamId,
                userId: userId,
                name: 'Owner',
                role: TeamMemberRoleEnum.owner,
                status: TeamMemberStatusEnum.active,
                createTime: new Date(),
                defaultTeam: true
              }
            ],
            //{ session }
          );
          const userDetail = await getUserDetail({
            //tmbId: lastLoginTmbId,
            userId: userId
          });
      
          MongoUser.findByIdAndUpdate(userId, {
            lastLoginTmbId: userDetail.team.tmbId
          });
          //debugger
          const token = createJWT(userDetail);
          setCookie(res, token);
          jsonRes(res, {
            data: {
              user: userDetail,
              token
            }
          });
      }
    })
    //jsonRes(res);
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
