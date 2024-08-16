import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { clearCookie } from '@fastgpt/service/support/permission/controller';
import { connectToDatabase } from '@/service/mongo';
import { MongoUser } from '@fastgpt/service/support/user/schema';
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
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { authTokenUrl,publicTeamName,publicTeamStart } from '@fastgpt/service/common/system/constants';
import { request } from 'http';
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    await connectToDatabase();
    //debugger
    const {token,username} = req.body;
    if(username == ''){
      throw new Error('username为空');
    } 
    if(token == ''){
      throw new Error('token为空');
    }
    var url = authTokenUrl + "&token="+token
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      //body: JSON.stringify({"model": "m3e", "input": ["laf是什么"]}),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const result = await response.json();
    if(result.user_name !== username){
      throw new Error('token验证失败！');
    }
    const user = await MongoUser.findOne({username:username}).lean();
    if (user && Object.keys(user).length > 0) {
      const userDetail = await getUserDetail({
        //tmbId: lastLoginTmbId,
        userId: user._id
      });
  
      MongoUser.findByIdAndUpdate(user._id, {
        lastLoginTmbId: userDetail.team.tmbId
      });
      const tokennew = createJWT(userDetail);
      clearCookie
      setCookie(res, tokennew);
      jsonRes(res, {
        data: {
          user: userDetail,
          token:tokennew
        }
      });
    }else{
      var createUser = await MongoUser.findOne({username:username}).lean();
      if(!user){
        createUser = await MongoUser.findOneAndUpdate(
          { username: username }, // 查找条件
          { $set: {username: username, password: hashStr("123456") } }, // 更新内容
          { upsert: true, new: true } // 配置项，确保如果没有找到则创建新文档
        );
      }
      const lsteam = await MongoTeam.findOne({name:publicTeamName}).lean()
      if(!lsteam){
        const root = await MongoUser.findOne({username:"root"}).lean()
        const { _id: teamId } = await MongoTeam.findOneAndUpdate(
            {
              name: publicTeamName
            },
            {
              ownerId: root?._id,
              name: publicTeamName,
              avatar: "/icon/human.svg",
              balance:999900000,
              createTime: new Date()
            },
            { upsert: true, new: true }
        );
        await MongoTeamMember.findOneAndUpdate(
            {
              teamId: teamId,
              userId: root?._id,
            },
            {
              teamId: teamId,
              userId: root?._id,
              name: root?.username,
              role: TeamMemberRoleEnum.owner,
              status: TeamMemberStatusEnum.active,
              createTime: new Date(),
              defaultTeam: true
            },
            { upsert: true, new: true }
        );
        const { _id: memberId } = await MongoTeamMember.findOneAndUpdate(
            {
              teamId: teamId,
              userId: createUser?._id
            },
            {
              teamId: teamId,
              userId: createUser?._id,
              name: username,
              role: "",
              status: TeamMemberStatusEnum.active,
              createTime: new Date(),
              defaultTeam: true
            },
            { upsert: true, new: true }
        );
        await MongoResourcePermission.findOneAndUpdate(
          {
              teamId : teamId,
              tmbId : memberId,
              resourceType : PerResourceTypeEnum.team,
          },
          {
            teamId : teamId,
            tmbId : memberId,
            resourceType : PerResourceTypeEnum.team,
            permission : publicTeamStart
          },
          { upsert: true, new: true }
        )
      }else{
        const { _id: memberId } = await MongoTeamMember.findOneAndUpdate(
            {
              teamId: lsteam._id,
              userId: createUser?._id,
            },
            {
              teamId: lsteam._id,
              userId: createUser?._id,
              name: username,
              role: "",
              status: TeamMemberStatusEnum.active,
              createTime: new Date(),
              defaultTeam: true
            },
            { upsert: true, new: true }
        );
        await MongoResourcePermission.findOneAndUpdate(
          {
              teamId : lsteam._id,
              tmbId : memberId,
              resourceType : PerResourceTypeEnum.team,
          },
          {
            teamId : lsteam._id,
            tmbId : memberId,
            resourceType : PerResourceTypeEnum.team,
            permission : publicTeamStart
          },
          { upsert: true, new: true }
        )
      }
      
      const userDetail = await getUserDetail({
        //tmbId: lastLoginTmbId,
        userId: createUser?._id
      });
  
      MongoUser.findByIdAndUpdate(createUser?._id, {
        lastLoginTmbId: userDetail.team.tmbId
      });
      //debugger
      const tokennew = createJWT(userDetail);
      clearCookie
      setCookie(res, tokennew);
      jsonRes(res, {
        data: {
          user: userDetail,
          token:tokennew
        }
      });
    }
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
