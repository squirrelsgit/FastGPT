import React, { useEffect } from 'react';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { LLMModelTypeEnum, llmModelTypeFilterMap } from '@fastgpt/global/core/ai/constants';
import { Box, Button, Flex, css, useDisclosure } from '@chakra-ui/react';
import type { SettingAIDataType } from '@fastgpt/global/core/app/type.d';
import AISettingModal from '@/components/core/ai/AISettingModal';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { HUGGING_FACE_ICON } from '@fastgpt/global/common/system/constants';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { useTranslation } from 'next-i18next';

type Props = {
  llmModelType?: `${LLMModelTypeEnum}`;
  defaultData: SettingAIDataType;
  onChange: (e: SettingAIDataType) => void;
};

const SettingLLMModel = ({ llmModelType = LLMModelTypeEnum.all, defaultData, onChange }: Props) => {
  const { t } = useTranslation();
  const { llmModelList } = useSystemStore();

  const model = defaultData.model;

  const modelList = llmModelList.filter((model) => {
    if (!llmModelType) return true;
    const filterField = llmModelTypeFilterMap[llmModelType];
    if (!filterField) return true;
    //@ts-ignore
    return !!model[filterField];
  });

  const selectedModel = modelList.find((item) => item.model === model) || modelList[0];

  const {
    isOpen: isOpenAIChatSetting,
    onOpen: onOpenAIChatSetting,
    onClose: onCloseAIChatSetting
  } = useDisclosure();

  useEffect(() => {
    if (!model && modelList.length > 0) {
      onChange({
        ...defaultData,
        model: modelList[0].model
      });
    }
  }, []);

  return (
    <Box
      css={css({
        span: {
          display: 'block'
        }
      })}
      position={'relative'}
    >
      <MyTooltip label={t('common:core.app.Setting ai property')}>
        <Button
          w={'100%'}
          justifyContent={'flex-start'}
          variant={'whiteFlow'}
          _active={{
            transform: 'none'
          }}
          leftIcon={
            <Avatar
              borderRadius={'0'}
              src={selectedModel?.avatar || HUGGING_FACE_ICON}
              fallbackSrc={HUGGING_FACE_ICON}
              w={'18px'}
            />
          }
          pl={4}
          onClick={onOpenAIChatSetting}
        >
          {selectedModel?.name}
        </Button>
      </MyTooltip>
      {isOpenAIChatSetting && (
        <AISettingModal
          onClose={onCloseAIChatSetting}
          onSuccess={(e) => {
            onChange(e);
            onCloseAIChatSetting();
          }}
          defaultData={defaultData}
          llmModels={modelList}
        />
      )}
    </Box>
  );
};

export default React.memo(SettingLLMModel);
