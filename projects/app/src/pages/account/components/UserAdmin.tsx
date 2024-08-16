import Avatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyModal from '@fastgpt/web/components/common/MyModal';
import {
    Box,
    HStack,
    MenuButton,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Input,
    InputGroup,
    InputLeftElement,
    Button,
    Flex,
    IconButton,
    Menu,
    MenuList,
    MenuItem,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import {
    TeamMemberRoleEnum,
    TeamMemberStatusMap
} from '@fastgpt/global/support/user/team/constant';
import { useTranslation } from 'next-i18next';
import { useContextSelector } from 'use-context-selector';
import { useUserStore } from '@/web/support/user/useUserStore';
import { TeamModalContext } from '../../../components/support/user/team/TeamManageModal/context';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import MyBox from '@fastgpt/web/components/common/MyBox';
import PermissionTags from '@/components/support/permission/PermissionTags';
import { TeamPermissionList } from '@fastgpt/global/support/permission/user/constant';
import PermissionSelect from './PermissionSelect';
import { CollaboratorContext } from '@/components/support/permission/MemberManager/context';
import { delRemoveMember } from '@/web/support/user/team/api';
import React, { useMemo, useState, useCallback } from 'react';
import { TeamSchema } from '@fastgpt/global/support/user/team/type';
import { useQuery } from '@tanstack/react-query';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import {
    getTeamMembers2
} from '@/web/support/user/team/api';
import UserRegisterModal from './UserRegisterModal';
import {
    CollaboratorItemType,
    UpdateClbPermissionProps
} from '@fastgpt/global/support/permission/collaborator';
import {
    delMemberPermission,
    getTeamList,
    getTeamMembers,
    putSwitchTeam,
    updateMemberPermission
} from '@/web/support/user/team/api';
import { useRequest, useRequest2 } from '@fastgpt/web/hooks/useRequest';
import dynamic from 'next/dynamic';
function MemberTable({ onClose, team, onSuccess }: { onClose: () => void, team: TeamSchema | null, onSuccess: () => void; }) {
    const { userInfo } = useUserStore();
    const { t } = useTranslation();
    const InviteModal = dynamic(() => import('./InviteModal'));
    // const {
    //     data: members = [],
    //     isFetching: isLoadingTeams,
    //     refetch: refetchMembers
    // } = useQuery(['getTeamMembers', userInfo?._id], async () => {
    //     if (team === null) {
    //         // 处理team为null的情况，例如返回一个默认值或抛出错误
    //         return Promise.resolve([]);
    //     }
    //     return await getTeamMembers2(team._id);
    // }, {
    //     staleTime: Infinity,
    //     enabled: team !== null // 确保team不是null时才执行查询
    // });
    const {
        data: members = [],
        runAsync: refetchMembers,
        loading: loadingMembers
    } = useRequest2(
        () => {
            if (!team?._id) return Promise.resolve([]);
            return getTeamMembers2(team._id);
        },
        {
            manual: false,
            refreshDeps: [team?._id]
        }
    );
    // const { onUpdateCollaborators } = useContextSelector(CollaboratorContext, (v) => v);
    const { runAsync: onUpdateCollaborators, loading: isUpdatingPer } = useRequest2(
        (props: UpdateClbPermissionProps) => {
            return updateMemberPermission(props);
        }
    );
    const onUpdateCollaboratorsThen = async (props: UpdateClbPermissionProps) => {
        onUpdateCollaborators(props);
        //refetchCollaboratorList();
    };
    const inviteAfter = async () => {
        await refetchMembers()
        await onSuccess()
    };
    const { ConfirmModal: ConfirmRemoveMemberModal, openConfirm: openRemoveMember } = useConfirm({
        type: 'delete'
    });
    const [searchKey, setSearchKey] = useState('');
    const RenderSearchInput = useMemo(
        () => (
            <InputGroup textAlign={'right'} maxW={['auto', '250px']}>
                <InputLeftElement h={'full'} alignItems={'center'} display={'flex'}>
                    <MyIcon name={'common/searchLight'} w={'1rem'} />
                </InputLeftElement>
                <Input
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    //   placeholder={appT('search_app')}
                    maxLength={30}
                    bg={'white'}
                />
            </InputGroup>
        ),
        [searchKey, setSearchKey]
    );
    const filterMembers = useMemo(() => {
        return members.filter((member) => {
            // if (member.permission.isOwner) return false;
            //debugger
            if (!searchKey) return true;
            return !!member.memberName.includes(searchKey);
        });
    }, [members, searchKey]);
    const { isOpen: isOpenCreateUser, onOpen: onOpenCreateUser, onClose: onCloseCreateUser } = useDisclosure();
    const { isOpen: isOpenInvite, onOpen: onOpenInvite, onClose: onCloseInvite } = useDisclosure();
    // const MoreActionsCell = ({ item }) => {
    //     const [isMenuOpen, setIsMenuOpen] = useState(false);

    //     const handleMenuOpen = () => setIsMenuOpen(true);
    //     const handleMenuClose = () => setIsMenuOpen(false);

    //     return (
    //         <Td>
    //             <IconButton
    //                 onClick={handleMenuOpen}
    //                 colorScheme="white"
    //                 variant="ghost"
    //                 icon={<MyIcon name="more" h="16px" w="16px" />}
    //                 size="sm"
    //             />
    //             <Menu isOpen={isMenuOpen} onClose={handleMenuClose}>
    //                 <MenuButton
    //                 // colorScheme="white"
    //                 // variant="ghost"
    //                 // icon={<AddIcon />}
    //                 // size="sm"
    //                 />
    //                 <MenuList p={4}>
    //                     <MenuItem onClick={handleMenuClose}>成员列表</MenuItem>
    //                     <MenuItem onClick={handleMenuClose}>编辑信息</MenuItem>
    //                 </MenuList>
    //             </Menu>
    //         </Td>
    //     );
    // };
    // const { members, refetchMembers } = useContextSelector(TeamModalContext, (v) => v);
    return (
        <MyModal
            isOpen
            onClose={onClose}
            maxW={['70vw', '1000px']}
            w={'100%'}
            h={'550px'}
            iconSrc="/imgs/modal/team.svg"
            isCentered
            bg={'white'}
            overflow={'hidden'}
            title={
                <Box>
                    <Box>{team?.name}</Box>
                    <Box color={'myGray.500'} fontSize={'xs'} fontWeight={'normal'}>
                        {'成员列表'}
                    </Box>
                </Box>
            }
        >
            <ModalBody style={{ padding: '10rpx' }}>
                <MyBox isLoading={loadingMembers}>
                    <Flex
                        flex={'1 0 0'}
                        flexDirection={'column'}
                        h={'100%'}
                        // pr={[4, 10]}
                        pl={3}
                        pb={3}
                        overflowY={'auto'}
                        overflowX={'hidden'}
                    >
                        <Flex alignItems={'center'} gap={3}>

                            <Box flex={1} />

                            {RenderSearchInput}

                            <Button onClick={onOpenCreateUser} variant={'primary'} leftIcon={<AddIcon />}>
                                <Box>{t('common:common.Create New')}</Box>
                            </Button>
                            <Button
                                variant={'whitePrimary'}
                                size="sm"
                                borderRadius={'md'}
                                ml={3}
                                leftIcon={<MyIcon name="common/inviteLight" w={'14px'} color={'primary.500'} />}
                                onClick={() => {
                                    onOpenInvite();
                                }}
                            >
                                {t('common:user.team.Invite Member')}
                            </Button>
                        </Flex>

                        {/* {<Box mt={2}>{RenderSearchInput}</Box>} */}

                    </Flex>
                    <TableContainer overflow={'unset'} overflowY={'auto'} maxHeight={'350px'} fontSize={'sm'}>
                        <Table overflow={'unset'}>
                            <Thead bg={'myWhite.400'}>
                                <Tr>
                                    <Th borderRadius={'none !important'}>{t('common:common.Username')}</Th>
                                    <Th>{t('common:common.Permission')}</Th>
                                    <Th>{t('common:common.Status')}</Th>
                                    <Th borderRadius={'none !important'}>{t('common:common.Action')}</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filterMembers.map((item) => (
                                    <Tr key={item.userId} overflow={'unset'}>
                                        <Td>
                                            <HStack>
                                                <Avatar src={item.avatar} w={['18px', '22px']} />
                                                <Box maxW={'150px'} className={'textEllipsis'}>
                                                    {item.memberName}
                                                </Box>
                                            </HStack>
                                        </Td>
                                        <Td>
                                            <PermissionTags
                                                permission={item.permission}
                                                permissionList={TeamPermissionList}
                                            />
                                        </Td>
                                        <Td color={TeamMemberStatusMap[item.status].color}>
                                            {t(TeamMemberStatusMap[item.status]?.label || ('' as any))}
                                        </Td>
                                        <Td>
                                            {userInfo?.team.permission.hasManagePer &&
                                                item.tmbId !== userInfo?.team.tmbId && (
                                                    <PermissionSelect
                                                        member={item}
                                                        value={item.permission.value}
                                                        Button={
                                                            <MenuButton
                                                                _hover={{
                                                                    color: 'primary.600'
                                                                }}
                                                                borderRadius={'md'}
                                                                px={2}
                                                                py={1}
                                                                lineHeight={1}
                                                            >
                                                                <MyIcon name={'edit'} cursor={'pointer'} w="1rem" />
                                                            </MenuButton>
                                                        }
                                                        onChange={(permission) => {
                                                            onUpdateCollaboratorsThen({
                                                                tmbIds: [item.tmbId],
                                                                permission,
                                                                teamId: team?._id
                                                            }).then(() => {
                                                                // 调用 refetchMembers 函数，不需要传递任何参数
                                                                refetchMembers()
                                                            }).catch(error => {
                                                                // 处理可能出现的错误
                                                                console.error('Error updating collaborators:', error);
                                                            });
                                                        }}
                                                        onDelete={() => {
                                                            openRemoveMember(
                                                                () => delRemoveMember(item.tmbId, item.teamId).then(() => {
                                                                    // 调用 refetchMembers 函数，不需要传递任何参数
                                                                    refetchMembers();
                                                                    onSuccess()
                                                                }),
                                                                undefined,
                                                                t('user.team.Remove Member Confirm Tip', {
                                                                    username: item.memberName
                                                                })
                                                            )();
                                                        }}
                                                    />
                                                )}
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>

                        <ConfirmRemoveMemberModal />
                    </TableContainer>
                </MyBox>
            </ModalBody>
            <ModalFooter mb={2}>
                <Button variant={'whiteBase'} mr={3} onClick={onClose}>
                    {t('common:common.Close')}
                </Button>
                {/* <Button isLoading={isUpdating} onClick={handleSubmit((data) => onclickUpdate(data))}>
                    {t('common:user.team.Tags Async')}
                </Button> */}
            </ModalFooter>
            {isOpenCreateUser && <UserRegisterModal onClose={onCloseCreateUser} onSuccess={inviteAfter} team={team} />}
            {isOpenInvite && (
                <InviteModal
                    teamId={team?._id ?? ""}
                    onClose={onCloseInvite}
                    onSuccess={inviteAfter}
                />
            )}
        </MyModal>
    );
}

export default MemberTable;
