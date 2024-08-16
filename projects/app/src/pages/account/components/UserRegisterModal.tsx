import Avatar from '@fastgpt/web/components/common/Avatar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyModal from '@fastgpt/web/components/common/MyModal';
import React, { useState, Dispatch, useCallback, useMemo } from 'react';
import { FormControl, Box, Input, Button, ModalFooter, ModalBody } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { postRegister2 } from '@/web/support/user/api';
import { useSendCode } from '@/web/support/user/hooks/useSendCode';
import type { ResLogin } from '@/global/support/api/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useTranslation } from 'next-i18next';
import { TeamSchema } from '@fastgpt/global/support/user/team/type';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useI18n } from '@/web/context/I18n';
import {
    ManagePermissionVal,
    ReadPermissionVal,
    WritePermissionVal,
    OwnerPermissionVal
} from '@fastgpt/global/support/permission/constant';
import {
    PermissionValueType
} from '@fastgpt/global/support/permission/type';
interface Props {
    loginSuccess: (e: ResLogin) => void;
    setPageType: Dispatch<`${LoginPageTypeEnum}`>;
}

interface RegisterType {
    username: string;
    password: string;
    password2: string;
    team: TeamSchema;
    permission: PermissionValueType
}
function UserRegisterModal({ onSuccess, onClose, team }: { onSuccess: () => void, onClose: () => void, team: TeamSchema | null }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { userT } = useI18n();
    const { feConfigs } = useSystemStore();
    const {
        register,
        handleSubmit,
        getValues,
        trigger,
        formState: { errors }
    } = useForm<RegisterType>({
        mode: 'onBlur'
    });

    const { sendCodeText, sendCode, codeCountDown } = useSendCode();

    const onclickSendCode = useCallback(async () => {
        const check = await trigger('username');
        if (!check) return;
        sendCode({
            username: getValues('username'),
            type: 'register'
        });
    }, [getValues, sendCode, trigger]);
    const { userInfo } = useUserStore();
    const [requesting, setRequesting] = useState(false);
    const inviteTypes = useMemo(
        () => [
            {
                label: userT('permission.Read'),
                description: userT('permission.Read desc'),
                value: ReadPermissionVal
            },
            {
                label: userT('permission.Write'),
                description: userT('permission.Write tip'),
                value: WritePermissionVal
            },
            ...(userInfo?.team?.permission.isOwner
                ? [
                    {
                        label: userT('permission.Manage'),
                        description: userT('permission.Manage tip'),
                        value: ManagePermissionVal
                    }
                ]
                : []),
            ...(userInfo?.team?.permission.isOwner
                ? [
                    {
                        label: userT('permission.Owner'),
                        description: userT('permission.Owner tip'),
                        value: OwnerPermissionVal
                    }
                ]
                : [])
        ],
        [userInfo?.team?.permission.isOwner, userT]
    );
    const [selectedInviteType, setSelectInviteType] = useState(inviteTypes[0].value);
    const onclickRegister = useCallback(
        async ({ username, password }: RegisterType) => {
            setRequesting(true);
            try {
                // loginSuccess(
                await postRegister2({
                    username,
                    password,
                    team: team,
                    permission: selectedInviteType
                })
                // );
                toast({
                    title: `注册成功`,
                    status: 'success'
                });
                onClose();
                onSuccess();
            } catch (error: any) {
                toast({
                    title: error.message || '注册异常',
                    status: 'error'
                });
            }
            setRequesting(false);
        },
        [selectedInviteType, t, toast]
    );



    return (
        <MyModal
            isOpen
            onClose={onClose}
            // maxW={['70vw', '1000px']}
            maxW={['300px', '300px']}
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
                        {'注册用户'}
                    </Box>
                </Box>
            }
        >
            <ModalBody style={{ padding: '10rpx' }}>
                <Box fontWeight={'bold'} fontSize={'2xl'} textAlign={'center'}>
                    添加 {team?.name} 成员
                </Box>
                <Box
                    mt={'42px'}
                    onKeyDown={(e) => {
                        if (e.keyCode === 13 && !e.shiftKey && !requesting) {
                            handleSubmit(onclickRegister)();
                        }
                    }}
                >
                    <FormControl isInvalid={!!errors.username}>
                        <Input
                            bg={'myGray.50'}
                            placeholder="用户名"
                            {...register('username', {
                                required: '用户名不能为空',
                                // pattern: {
                                //   value:
                                //     /(^1[3456789]\d{9}$)|(^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$)/,
                                //   message: '邮箱/手机号格式错误'
                                // }
                            })}
                        ></Input>
                    </FormControl>
                    <FormControl mt={6} isInvalid={!!errors.password}>
                        <Input
                            bg={'myGray.50'}
                            type={'password'}
                            placeholder="密码(4~20位)"
                            {...register('password', {
                                required: '密码不能为空',
                                minLength: {
                                    value: 4,
                                    message: '密码最少 4 位最多 20 位'
                                },
                                maxLength: {
                                    value: 20,
                                    message: '密码最少 4 位最多 20 位'
                                }
                            })}
                        ></Input>
                    </FormControl>
                    <FormControl mt={6} isInvalid={!!errors.password2}>
                        <Input
                            bg={'myGray.50'}
                            type={'password'}
                            placeholder="确认密码"
                            {...register('password2', {
                                validate: (val) => (getValues('password') === val ? true : '两次密码不一致')
                            })}
                        ></Input>
                        <Box mt={4}>
                            <MySelect list={inviteTypes} value={selectedInviteType} onchange={setSelectInviteType} />
                        </Box>
                    </FormControl>
                    <Button
                        type="submit"
                        mt={6}
                        w={'100%'}
                        size={['md', 'lg']}
                        colorScheme="blue"
                        isLoading={requesting}
                        onClick={handleSubmit(onclickRegister)}
                    >
                        确认注册
                    </Button>
                    {/* <Box
                        float={'right'}
                        fontSize="sm"
                        mt={2}
                        mb={'50px'}
                        color={'primary.700'}
                        cursor={'pointer'}
                        _hover={{ textDecoration: 'underline' }}
                        onClick={() => setPageType(LoginPageTypeEnum.passwordLogin)}
                    >
                        已有账号，去登录
                    </Box> */}
                </Box>
            </ModalBody>
            <ModalFooter mb={2}>
                <Button variant={'whiteBase'} mr={3} onClick={onClose}>
                    {t('common:common.Close')}
                </Button>
                {/* <Button isLoading={isUpdating} onClick={handleSubmit((data) => onclickUpdate(data))}>
                    {t('common:user.team.Tags Async')}
                </Button> */}
            </ModalFooter>
        </MyModal>
    );
}

export default UserRegisterModal;
