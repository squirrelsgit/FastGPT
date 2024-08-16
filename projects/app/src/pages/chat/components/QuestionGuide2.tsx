import React, { useState, useEffect } from 'react';
import { Card, Box, Flex, Button, useTheme } from '@chakra-ui/react';
import { useMarkdown } from '@/web/common/hooks/useMarkdown';
import type {
  ChatSiteItemType,
} from '@fastgpt/global/core/chat/type.d';
import dynamic from 'next/dynamic';
import QuestionGuide from './QuestionGuide';
import { chats2GPTMessages } from '@fastgpt/global/core/chat/adapt';
import { postQuestionGuide2, getDatasetDataList } from '@/web/core/ai/api';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { AppChatConfigType, AppDetailType } from '@fastgpt/global/core/app/type';
import { defaultApp } from '@/web/core/app/constants';
import { delAppById, getAppDetailById, putAppById } from '@/web/core/app/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { DatasetDataListItemType } from '@/global/core/dataset/type';
import { ChatCompletionRequestMessageRoleEnum } from '@fastgpt/global/core/ai/constants';
import MyIcon from '@fastgpt/web/components/common/Icon';
const QuestionGuide2 = ({
  appId,
  chatId,
  chatRecords
}: {
  appId: string;
  chatId: string;
  chatRecords: ChatSiteItemType[];
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const datasetDatas = [] as DatasetDataListItemType[]
  const [appDetail, setAppDetail] = useState<AppDetailType>(defaultApp);
  const [isAppDetailReady, setIsAppDetailReady] = useState(false);
  const [shouldFetchData, setShouldFetchData] = useState(false);
  const { loading: loadingApp, runAsync: reloadApp } = useRequest2(
    () => {
      if (appId) {
        return getAppDetailById(appId);
      }
      return Promise.resolve(defaultApp);
    },
    {
      manual: false,
      refreshDeps: [appId],
      errorToast: t('common:core.app.error.Get app failed'),
      onError(err: any) {
        router.replace('/app/list');
      },
      onSuccess(res) {
        setAppDetail(res);
        setIsAppDetailReady(true); // 设置标志，表示appDetail已更新
      }
    }
  );


  useEffect(() => {
    let isMounted = true; // 用于处理组件卸载时的内存泄漏
    const fetchData = async () => {
      setIsLoading(true);
      if (appDetail.modules.length >= 4) {
        const datasetIds = appDetail.modules[3].inputs[0].value
        const res = await getDatasetDataList(datasetIds)
        datasetDatas.push(...res)
      }
      const messages = await chats2GPTMessages({ messages: chatRecords, reserveId: false }).slice(-6)
      if (datasetDatas.length > 0) {
        datasetDatas.map(data => {
          messages.push({ dataId: undefined, role: ChatCompletionRequestMessageRoleEnum.User, content: data.q })
          messages.push({ dataId: undefined, role: ChatCompletionRequestMessageRoleEnum.Assistant, content: data.a })
        })
      }
      try {
        var response = await postQuestionGuide2({
          messages: messages,
        });
        const start = response.indexOf('[');
        const end = response.lastIndexOf(']');
        if (start === -1) {
          const firstCommaIndex = response.indexOf(',');
          if (firstCommaIndex !== -1) {
            response = response.slice(firstCommaIndex + 1);
            response = '[' + response;
          }
        } else if (end === -1) {
          const lastCommaIndex = response.lastIndexOf(',');
          if (lastCommaIndex !== -1) {
            response = response.slice(0, lastCommaIndex);
            response += ']';
          }
        }
        setResult(response)
        setIsLoading(false);
      } catch (err) {
        err
      } finally {
        setIsLoading(false);
      }
    };

    if (isMounted && appDetail !== defaultApp && isAppDetailReady) {
      fetchData();
    }

    // 清理函数，在组件卸载时取消副作用
    return () => {
      isMounted = false;
    };
  }, [appId, appDetail, shouldFetchData]); // 依赖项数组，当这些变量变化时，重新执行副作用

  const handleClick = () => {
    setShouldFetchData(!shouldFetchData); // 触发 useEffect 中的 fetchData
  };
  return <MyBox
    isLoading={isLoading}
    display={'flex'}
    alignItems={'center'}
    flexDirection={'column'}
    w={'100%'}
    h={'100%'}
    bg={'white'}
    borderLeft={['', theme.borders.base]}
    whiteSpace={'nowrap'}
  >
    <Button
      variant={'whitePrimary'}
      //flex={['0 0 auto', 1]}
      //h={'100%'}
      w={'80%'}
      px={6}
      top={'2'}
      color={'primary.600'}
      borderRadius={'xl'}
      leftIcon={<MyIcon name={'core/chat/refresh'} w={'16px'} />}
      overflow={'hidden'}
      onClick={() => handleClick()}
    >
      {t('common:core.chat.refresh Question Guide')}
    </Button>
    <QuestionGuide
      text={result}
    />
  </MyBox>
};

export default QuestionGuide2;
