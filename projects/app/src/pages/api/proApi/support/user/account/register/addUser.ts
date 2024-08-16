import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { clearCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { findTeamById } from '@fastgpt/service/support/user/team/controller';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum,
  notLeaveStatus
} from '@fastgpt/global/support/user/team/constant';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    // debugger
    const {password,username,team,permission} = req.body;
    if(username == ''){
      throw new Error('username为空');
    } 
    if(password == ''){
      throw new Error('password为空');
    }
    const user = await MongoUser.findOne({username:username}).lean();
    if (user && Object.keys(user).length > 0) {
        throw new Error('用户名已存在！');
    }else{
      const memberOwner = await MongoTeamMember.findOne({teamId: team._id,role:TeamMemberRoleEnum.owner}).lean()
      if(memberOwner && permission === ~0 >>> 0){
        throw new Error('创建者只能有一个');
      }
      const [{ _id: userId,lastLoginTmbId }] = await MongoUser.create(
        [
          {
            username: username,
            password: password
          }
        ],
      );
      const { _id: memberId } = await MongoTeamMember.create(
        {
          teamId: team._id,
          userId: userId,
          name: username,
          role: permission === ~0 >>> 0 ? TeamMemberRoleEnum.owner:"",
          status: TeamMemberStatusEnum.active,
          createTime: new Date(),
          defaultTeam: true
        }
      );
      if(permission !== ~0 >>> 0){
        await MongoResourcePermission.create(
          {
              teamId : team._id,
              tmbId : memberId,
              resourceType : PerResourceTypeEnum.team,
              permission : permission
          })
      }else{
        await MongoTeam.findOneAndUpdate(
          { _id: team._id },
          { $set: { ownerId: userId } }
        );
      }
    //   const userDetail = await getUserDetail({
    //     //tmbId: lastLoginTmbId,
    //     userId: userId
    //   });
  
    //   MongoUser.findByIdAndUpdate(userId, {
    //     lastLoginTmbId: userDetail.team.tmbId
    //   });
    //   //debugger
    //   const tokennew = createJWT(userDetail);
    //   clearCookie
    //   setCookie(res, tokennew);
      jsonRes(res);
    }
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
