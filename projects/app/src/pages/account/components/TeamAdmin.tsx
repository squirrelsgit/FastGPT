import Avatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { TeamSchema } from '@fastgpt/global/support/user/team/type';
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
import PermissionSelect from '@/components/support/permission/MemberManager/PermissionSelect';
import { CollaboratorContext } from '@/components/support/permission/MemberManager/context';
import { delRemoveMember } from '@/web/support/user/team/api';
import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import {
    getTeamList2
} from '@/web/support/user/team/api';
import EditModal from '../../../components/support/user/team/TeamManageModal/components/EditInfoModal';
import MemberTable from './UserAdmin';
interface DefaultForm {
    id?: string;
    name: string;
    avatar: string;
}
function TeamTable() {
    const { userInfo } = useUserStore();
    const { t } = useTranslation();
    const { onUpdateCollaborators } = useContextSelector(CollaboratorContext, (v) => v);
    const [defaultForm, setDefaultForm] = useState<DefaultForm>({
        name: '',
        avatar: "/icon/logo.svg",
    });
    const {
        data: myTeams = [],
        isFetching: isLoadingTeams,
        refetch: refetchTeams
    } = useQuery(['getTeams', userInfo?._id], () => getTeamList2(TeamMemberStatusEnum.active));
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
    const filtermyTeams = useMemo(() => {
        return myTeams.filter((team) => {
            // if (member.permission.isOwner) return false;
            //debugger
            if (!searchKey) return true;
            return !!team.teamId.name.includes(searchKey);
        });
    }, [myTeams, searchKey]);
    const [selectedTeam, setSelectedTeam] = useState<TeamSchema | null>(null);
    const { isOpen: isOpenInvite, onOpen: onOpenInvite, onClose: onCloseInvite } = useDisclosure();
    const { isOpen: isOpenCreateTeam, onOpen: onOpenCreateTeam, onClose: onCloseCreateTeam } = useDisclosure();
    const openUserTable = async (team: TeamSchema) => {
        setSelectedTeam(team)
        await onOpenInvite()
    };
    const openUpdateTeam = async (team: TeamSchema) => {
        setDefaultForm({ id: team._id, name: "", avatar: "/icon/logo.svg" })
        await onOpenCreateTeam()
    };
    const MoreActionsCell: React.FC<{ item: TeamSchema }> = ({ item }) => {
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const handleMenuOpen = () => setIsMenuOpen(true);
        const handleMenuClose = () => setIsMenuOpen(false);
        return (
            <Td>
                <IconButton
                    icon={<MyIcon name="more" h="16px" w="16px" />}
                    aria-label={'left'}
                    size={'smSquare'}
                    variant={'whiteBase'}
                    onClick={() => handleMenuOpen()}
                />
                <Menu isOpen={isMenuOpen} onClose={handleMenuClose}>
                    <MenuButton
                    // colorScheme="white"
                    // variant="ghost"
                    // icon={<AddIcon />}
                    // size="sm"
                    />
                    <MenuList p={4}>
                        <MenuItem onClick={() => openUserTable(item)}>成员列表</MenuItem>
                        <MenuItem onClick={() => openUpdateTeam(item)}>编辑信息</MenuItem>
                        {/* <MenuItem onClick={() => openUpdateTeam(item)}>分配管理者</MenuItem> */}
                    </MenuList>
                </Menu>
            </Td>
        );
    };
    const TeamMemberStatusCell: React.FC<{ item: TeamSchema }> = ({ item }) => {
        const createTime = new Date(item.createTime);
        const formattedCreateTime = createTime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        return (
            <td style={{ textAlign: 'left' }}>
                {formattedCreateTime}
            </td>
        );
    };
    return (
        <MyBox isLoading={isLoadingTeams}>
            <Flex
                flex={'1 0 0'}
                flexDirection={'column'}
                h={'100%'}
                pr={[4, 10]}
                pl={3}
                pb={3}
                overflowY={'auto'}
                overflowX={'hidden'}
            >
                <Flex pt={[4, 6]} alignItems={'center'} gap={3}>

                    <Box flex={1} />

                    {RenderSearchInput}

                    {userInfo?.team.permission.hasWritePer &&

                        <Button onClick={onOpenCreateTeam} variant={'primary'} leftIcon={<AddIcon />}>
                            <Box>{t('common:common.Create New')}</Box>
                        </Button>}
                </Flex>

                {/* {<Box mt={2}>{RenderSearchInput}</Box>} */}

            </Flex>
            <TableContainer overflow={'unset'} fontSize={'sm'}>
                <Table overflow={'unset'}>
                    <Thead bg={'myWhite.400'}>
                        <Tr>
                            <Th borderRadius={'none !important'}>{t('admin.team_admin.team_name')}</Th>
                            <Th>{t('admin.team_admin.team_owner')}</Th>
                            <Th>{t('admin.team_admin.team_create_time')}</Th>
                            <Th borderRadius={'none !important'}>{t('common:common.Action')}</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filtermyTeams.map((item) => (
                            <Tr key={item.teamId._id} overflow={'unset'}>
                                <Td>
                                    <HStack>
                                        <Avatar src={item.teamId.avatar} w={['18px', '22px']} />
                                        <Box maxW={'150px'} className={'textEllipsis'}>
                                            {item.teamId.name}
                                        </Box>
                                    </HStack>
                                </Td>
                                <Td>
                                    {item.name ? item.name : "暂未分配管理者"}
                                </Td>
                                {/* {t(TeamMemberStatusMap[item.status]?.label || ('' as any))} */}
                                <TeamMemberStatusCell item={item.teamId} />
                                <MoreActionsCell item={item.teamId} />
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                <ConfirmRemoveMemberModal />
            </TableContainer>
            {isOpenInvite && <MemberTable team={selectedTeam} onClose={onCloseInvite} onSuccess={refetchTeams} />}
            {isOpenCreateTeam && <EditModal defaultData={defaultForm} onClose={onCloseCreateTeam} onSuccess={refetchTeams} />}
            {/* {isOpenCreateTeam && <MemberTable team={selectedTeam} onClose={onCloseCreateTeam} />} */}
        </MyBox>
    );
}

export default TeamTable;
