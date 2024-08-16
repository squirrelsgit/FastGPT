import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { ResLogin } from '@/global/support/api/userRes.d';
import { useChatStore } from '@/web/core/chat/context/storeChat';
import { useUserStore } from '@/web/support/user/useUserStore';
import { clearToken, setToken } from '@/web/support/user/auth';
import { postFastLogin } from '@/web/support/user/api';
import { useToast } from '@fastgpt/web/hooks/useToast';
import Loading from '@fastgpt/web/components/common/MyLoading';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { createJWT, setCookie } from '@fastgpt/service/support/permission/controller';

const FastLogin = ({
  username,
  token,
  callbackUrl
}: {
  username: string;
  token: string;
  callbackUrl: string;
}) => {
  const { setLastChatId, setLastChatAppId } = useChatStore();
  const { setUserInfo } = useUserStore();
  const router = useRouter();
  const { toast } = useToast();
  //debugger
  const loginSuccess = useCallback(
    (res: ResLogin) => {
      debugger
      setToken(res.token);
      setUserInfo(res.user);
      // init store
      setLastChatId('');
      setLastChatAppId('');
      setTimeout(() => {
        router.push(decodeURIComponent(callbackUrl));
      }, 100);
    },
    [setLastChatId, setLastChatAppId, setUserInfo, router, callbackUrl]
  );

  const authCode = useCallback(
    async (username: string, token: string) => {
      try {
        const res = await postFastLogin({
          username,
          token
        });
        //debugger
        if (!res) {
          toast({
            status: 'warning',
            title: '登录异常'
          });
          return setTimeout(() => {
            router.replace('http://171.151.11.83:30000');
          }, 1000);
        }
        loginSuccess(res);
      } catch (error) {
        toast({
          status: 'warning',
          title: getErrText(error, '登录异常')
        });
        setTimeout(() => {
          router.replace('http://171.151.11.83:30000');
        }, 1000);
      }
    },
    [loginSuccess, router, toast]
  );

  useEffect(() => {
    // clearToken();
    router.prefetch(callbackUrl);
    authCode(username, token);
  }, []);

  return <Loading />;
};

export async function getServerSideProps(content: any) {
  return {
    props: {
      username: content?.query?.username || '',
      token: content?.query?.token || '',
      callbackUrl: content?.query?.callbackUrl || '/app/list',
      ...(await serviceSideProps(content))
    }
  };
}

export default FastLogin;
