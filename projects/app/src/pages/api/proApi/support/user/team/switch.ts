import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { clearCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { findTeamById } from '@fastgpt/service/support/user/team/controller';
import { authJWT } from '@fastgpt/service/support/permission/controller';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamTmbItemType, TeamMemberItemType, TeamMemberWithTeamSchema, TeamSchema } from '@fastgpt/global/support/user/team/type';
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
        const toteamId = req.body.teamId
        const token = req.cookies.fastgpt_token as string;
        // 解析 JWT 获取用户信息
        const userInfo = await authJWT(token)
        const userDetail = await getUserDetail({
            // tmbId: user?.lastLoginTmbId,
            userId: userInfo.userId
        });

        const team = await MongoTeam.findOne({
            _id: toteamId,
        }) as TeamSchema
        const member = await MongoTeamMember.findOne({
            teamId: toteamId,
            userId: userInfo.userId
        })
        const tmbPer = await getResourcePermission({
          resourceType: PerResourceTypeEnum.team,
          teamId: team._id,
          tmbId: member?._id??""
        });
        //debugger
        const teamTmbItemType: TeamTmbItemType = {
            userId: member?.userId ?? "",
            teamId: team?._id ?? "", // 使用空字符串作为默认值
            teamName: team?.name ?? "", // 使用空字符串作为默认值
            memberName: member?.name ?? "",
            avatar: team?.avatar ?? "", // 使用空字符串作为默认值
            balance: team?.balance ?? 0, // 使用0作为默认值
            tmbId: member?._id ?? "",// 假设这是根据你的逻辑来设置的
            teamDomain: "", // 假设这是根据你的逻辑来设置的
            defaultTeam: member?.defaultTeam ?? true,
            role: member?.role??"owner",
            status: member?.status ?? "active",
            //lafAccount: member.LafAccountType,
            permission: new TeamPermission({
              per: tmbPer?.permission ?? team.defaultPermission,
              isOwner: member?.role === TeamMemberRoleEnum.owner
            })
        };
        userDetail.team = teamTmbItemType
        MongoUser.findByIdAndUpdate(userInfo.userId, {
            lastLoginTmbId: userDetail.team.tmbId
        });
        const tokennew = createJWT(userDetail);
        setCookie(res, tokennew);
        jsonRes(res, {
            data: tokennew,
        });
    } catch (err) {
        jsonRes(res, {
            code: 500,
            error: err
        });
    }
}
