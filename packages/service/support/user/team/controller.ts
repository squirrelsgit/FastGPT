import { TeamTmbItemType,TeamMemberItemType,TeamMemberSchema, TeamMemberWithTeamSchema, TeamSchema } from '@fastgpt/global/support/user/team/type';
import { ClientSession, Types } from '../../../common/mongo';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum,
  notLeaveStatus
} from '@fastgpt/global/support/user/team/constant';
import { MongoTeamMember } from './teamMemberSchema';
import { MongoTeam } from './teamSchema';
import { UpdateTeamProps } from '@fastgpt/global/support/user/team/controller';
import { getResourcePermission } from '../../permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { useUserStore } from '../../../../../projects/app/src/web/support/user/useUserStore';
import { assign } from 'lodash';
import { MongoUser } from '../schema';

async function getTeamMember(match: Record<string, any>): Promise<TeamTmbItemType> {
  const tmb = (await MongoTeamMember.findOne(match).populate('teamId')) as TeamMemberWithTeamSchema;
  if (!tmb) {
    return Promise.reject('member not exist');
  }

  const tmbPer = await getResourcePermission({
    resourceType: PerResourceTypeEnum.team,
    teamId: tmb.teamId._id,
    tmbId: tmb._id
  });

  return {
    userId: String(tmb.userId),
    teamId: String(tmb.teamId._id),
    teamName: tmb.teamId.name,
    memberName: tmb.name,
    avatar: tmb.teamId.avatar,
    balance: tmb.teamId.balance,
    tmbId: String(tmb._id),
    teamDomain: tmb.teamId?.teamDomain,
    role: tmb.role,
    status: tmb.status,
    defaultTeam: tmb.defaultTeam,
    lafAccount: tmb.teamId.lafAccount,
    permission: new TeamPermission({
      per: tmbPer?.permission ?? tmb.teamId.defaultPermission,
      isOwner: tmb.role === TeamMemberRoleEnum.owner
    })
  };
}

export async function getTmbInfoByTmbId({ tmbId }: { tmbId: string }) {
  if (!tmbId) {
    return Promise.reject('tmbId or userId is required');
  }
  return getTeamMember({
    _id: new Types.ObjectId(String(tmbId)),
    status: notLeaveStatus
  });
}

export async function getUserDefaultTeam({ userId }: { userId: string }) {
  if (!userId) {
    return Promise.reject('tmbId or userId is required');
  }
  return getTeamMember({
    userId: new Types.ObjectId(userId),
    defaultTeam: true
  });
}
export async function createDefaultTeam({
  userId,
  teamName = 'My Team',
  avatar = '/icon/logo.svg',
  balance,
  session
}: {
  userId: string;
  teamName?: string;
  avatar?: string;
  balance?: number;
  session: ClientSession;
}) {
  // auth default team
  const tmb = await MongoTeamMember.findOne({
    userId: new Types.ObjectId(userId),
    defaultTeam: true
  });

  if (!tmb) {
    // create
    const [{ _id: insertedId }] = await MongoTeam.create(
      [
        {
          ownerId: userId,
          name: teamName,
          avatar,
          balance,
          createTime: new Date()
        }
      ],
      { session }
    );
    await MongoTeamMember.create(
      [
        {
          teamId: insertedId,
          userId,
          name: 'Owner',
          role: TeamMemberRoleEnum.owner,
          status: TeamMemberStatusEnum.active,
          createTime: new Date(),
          defaultTeam: true
        }
      ],
      { session }
    );
    console.log('create default team', userId);
  } else {
    console.log('default team exist', userId);
    await MongoTeam.findByIdAndUpdate(tmb.teamId, {
      $set: {
        ...(balance !== undefined && { balance })
      }
    });
  }
}

export async function updateTeam({
  teamId,
  name,
  avatar,
  teamDomain,
  lafAccount
}: UpdateTeamProps & { teamId: string }) {
  await MongoTeam.findByIdAndUpdate(teamId, {
    name,
    avatar,
    teamDomain,
    lafAccount
  });
}

export async function findMembersTeamId({
  teamId,
}: {
  teamId: string;
}): Promise<TeamMemberItemType[]> {
  //debugger
  const children = await MongoTeamMember.find({
    teamId // 这里替换为你的实际 userId
  }).lean();
  //debugger
  const teamMemberItemTypes : TeamMemberItemType[] = [];
  // //debugger
  for (const child of children) {
    //debugger
    const user = await MongoUser.findOne({
      _id: child.userId,
    })
    const team = await MongoTeam.findOne({
      _id: child.teamId,
    })
    const tmbPer = await getResourcePermission({
      resourceType: PerResourceTypeEnum.team,
      teamId: child?.teamId,
      tmbId: child?._id??""
    });
    //const { userInfo, teamPlanStatus } = useUserStore();
    const teamMemberItemType: TeamMemberItemType = {
      userId: child.userId,
      teamId: child?.teamId ?? "", // 使用空字符串作为默认值
      memberName: child?.name ?? "", // 使用空字符串作为默认值
      avatar: user?.avatar ?? "", // 使用空字符串作为默认值
      tmbId: child?._id, // 假设这是根据你的逻辑来设置的
      role: child.role,
      status: child.status,
      permission: new TeamPermission({
        per: tmbPer?.permission ?? team?.defaultPermission,
        isOwner: child?.role === TeamMemberRoleEnum.owner
      }) // 使用默认权限或根据实际情况设置
    }; 
    teamMemberItemTypes.push(teamMemberItemType);
  }

  return teamMemberItemTypes;
}

export async function findTeamById({
  userId,
}: {
  userId: string;
}): Promise<TeamTmbItemType[]> {
  const children = await MongoTeamMember.aggregate([
    // 首先使用 $match 操作符根据 userId 过滤文档
    {
      $match: {
        userId: new Types.ObjectId(userId) // 这里替换为你的实际 userId
      }
    },
    // 然后使用 $group 操作符根据 teamId 进行分组
    {
      $group: {
        _id: '$teamId', // 将每个文档根据teamId分组
        members: {
          $push: '$$ROOT' // 将整个文档推送到数组中
        }
      }
    }
  ]);
  const teamTmbItemTypes : TeamTmbItemType[] = [];
  //debugger
  for (const child of children) {
    //debugger
    const team = await MongoTeam.findOne({
      _id: child._id,
    })
    const teamTmbItemType: TeamTmbItemType = {
      userId: child.members[0].userId,
      teamId: team?._id ?? "", // 使用空字符串作为默认值
      teamName: team?.name ?? "", // 使用空字符串作为默认值
      memberName: child.members[0].name,
      avatar: team?.avatar ?? "", // 使用空字符串作为默认值
      balance: team?.balance ?? 0, // 使用0作为默认值
      tmbId: "", // 假设这是根据你的逻辑来设置的
      teamDomain: "", // 假设这是根据你的逻辑来设置的
      defaultTeam: child.members[0].defaultTeam,
      role: child.members[0].role,
      status: child.members[0].status,
      permission: new TeamPermission() // 使用默认权限或根据实际情况设置
    }; 
    teamTmbItemTypes.push(teamTmbItemType);
  }

  return teamTmbItemTypes;
}

export async function findTeamAll(): Promise<TeamMemberWithTeamSchema[]> {
  const twsList : TeamMemberWithTeamSchema[] = [];
  const teamLsit:TeamSchema[] = await MongoTeam.find({}).sort({ createTime: -1 })
  //debugger
  for(const team of teamLsit ){
    const t:TeamMemberSchema|null = await MongoTeamMember.findOne({
      teamId: team._id,
      role: TeamMemberRoleEnum.owner,
    }).lean();
    if (t) { // 检查 t 是否为 null
      const tws: TeamMemberWithTeamSchema = { ...t, teamId: team }; // 确保 teamId 是正确的类型
      twsList.push(tws);
    }else{
      const tws: TeamMemberWithTeamSchema = {_id:"",userId:"",createTime:new Date(),name:"",role:"owner",status:"active",defaultTeam:true,  teamId: team }; // 确保 teamId 是正确的类型
      twsList.push(tws);
    }
    // const tws: TeamMemberWithTeamSchema = {...t,teamId:team};
    // twsList.push(tws)
  }
  return twsList;
}
