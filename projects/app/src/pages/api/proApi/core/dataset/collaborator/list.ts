import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { CollaboratorItemType } from '@fastgpt/global/support/permission/collaborator';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import {
    TeamMemberRoleEnum,
    TeamMemberStatusEnum,
    notLeaveStatus
  } from '@fastgpt/global/support/user/team/constant';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    //debugger
    await connectToDatabase();
    const {datasetId} = req.query
    const token = req.cookies.fastgpt_token as string; 
    // 解析 JWT 获取用户信息
    const userInfo =await authJWT(token)
    const teamId = userInfo.teamId as string
    const tmbperList = await MongoResourcePermission.find(
        { resourceId: datasetId, teamId: teamId },
    );
    const collaboratorItemTypes : CollaboratorItemType[] = [];
    for(const tmbper of tmbperList){
        try {
            const member = await MongoTeamMember.findById(
                { _id: tmbper.tmbId},
            );
            const user = await MongoUser.findById(
                { _id: member?.userId},
            );
            const collaboratorItemType: CollaboratorItemType = {
                teamId: tmbper?.teamId ?? "", // 使用空字符串作为默认值
                tmbId: tmbper.tmbId,
                avatar: user?.avatar ?? "", // 使用空字符串作为默认值
                name: member?.name??"",
                permission: new TeamPermission({
                  per: tmbper.permission,
                  isOwner: member?.role === TeamMemberRoleEnum.owner
                }) // 使用默认权限或根据实际情况设置
              }; 
            collaboratorItemTypes.push(collaboratorItemType)
        } catch (error) {
        console.error('Error updating document:', error);
        }
    }
    jsonRes(res,{
        data: collaboratorItemTypes,
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
