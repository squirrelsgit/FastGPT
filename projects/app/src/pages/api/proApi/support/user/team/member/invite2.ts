import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { clearCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { findTeamById,findMembersTeamId } from '@fastgpt/service/support/user/team/controller';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import {
    CreateTeamProps,
    InviteMemberProps,
    InviteMemberResponse,
    UpdateInviteProps,
    UpdateTeamProps
  } from '@fastgpt/global/support/user/team/controller.d';
import {
    TeamMemberRoleEnum,
    TeamMemberStatusEnum,
    notLeaveStatus
  } from '@fastgpt/global/support/user/team/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { TeamMemberSchema } from '@fastgpt/global/support/user/team/type';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    const {permission,teamId,usernames} = req.body
    //const token = req.cookies.fastgpt_token as string; 
    // 解析 JWT 获取用户信息
    //const userInfo =await authJWT(token)
    const response: InviteMemberResponse = {
        invite: [
        ],
        inValid: [
        ],
        inTeam: [
        ]
      };
    //debugger
    for(const username of usernames){
        const user = await MongoUser.findOne({
            username:username
        })
        if(user == null){
            response.inValid.push({username:username,userId:""})
            continue
        }
        const result: Document | null = await MongoTeamMember.findOne({
            teamId: teamId,
            userId: user?._id
          });
        if(result){
            response.inTeam.push({username:username,userId:user?._id??""})
            continue
        }
        
        if(permission == ~0 >>> 0){
           // 首先查询teamId对应的文档，检查ownerId是否为空
            const team = await MongoTeam.findOne({ _id: teamId }).lean();
            if (team) {
              // 如果文档存在，检查ownerId是否为空
              if (team.ownerId === null || team.ownerId === undefined) {
                // 如果ownerId为空，则更新ownerId为user._id
                await MongoTeam.findOneAndUpdate(
                  { _id: teamId },
                  { $set: { ownerId: user._id } }
                );
                await MongoTeamMember.create(
                  {
                  teamId: teamId,
                  userId: user?._id,
                  name: user?.username,
                  role: permission == ~0 >>> 0 ? TeamMemberRoleEnum.owner : "",
                  status: TeamMemberStatusEnum.active,
                  createTime: new Date(),
                  defaultTeam: false
                  }
              );
              } else {
                // 如果ownerId不为空，则抛出异常
                throw new Error('创建者只能有一个');
              }
            } else {
              // 如果文档不存在，可以处理这种情况，例如抛出异常或创建新文档
              throw new Error('找不到对应的团队');
            }
        }else{
          const member = await MongoTeamMember.create(
            {
            teamId: teamId,
            userId: user?._id,
            name: user?.username,
            role: permission == 7 ? "" : "",
            status: TeamMemberStatusEnum.active,
            createTime: new Date(),
            defaultTeam: false
            });
          await MongoResourcePermission.create(
            {
                teamId : teamId,
                tmbId : member._id,
                resourceType : PerResourceTypeEnum.team,
                permission : permission
            })
        }
        response.invite.push({username:username,userId:user?._id??""})
    }
    
    
    //debugger
    jsonRes(res, {
      data: response,
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
