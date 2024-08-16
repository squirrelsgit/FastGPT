import React, { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';

interface Props extends BoxProps { }

const SideBar = (e?: Props) => {
  const {
    w = ['100%', '0 0 250px', '0 0 270px', '0 0 290px', '0 0 310px'],
    children,
    ...props
  } = e || {};

  const [foldSideBar, setFoldSideBar] = useState(true);
  return (
    <Box
      position={'relative'}
      flex={foldSideBar ? '0 0 0' : w}
      w={['100%', 0]}
      h={'100%'}
      zIndex={0}
      transition={'0.2s'}
      _hover={{
        '& > div': { visibility: 'visible', opacity: 1 }
      }}
      {...props}
    >
      <Flex
        position={'absolute'}
        left={0} // 修改为左侧定位
        top={'50%'} // 修改为底部定位
        transform={'translate(-50%,-50%)'} // 修改为相对于自身宽高的负方向平移
        alignItems={'center'}
        justifyContent={'flex-start'} // 修改为左对齐
        pl={1} // 修改为左侧内边距
        w={'36px'}
        h={'50px'}
        borderRadius={'10px'}
        bg={'rgba(0,0,0,0.5)'}
        cursor={'pointer'}
        transition={'0.2s'}
        {...(foldSideBar
          ? {
            opacity: 0.6
          }
          : {
            visibility: 'hidden',
            opacity: 0
          })}
        onClick={() => setFoldSideBar(!foldSideBar)}
      >
        <MyIcon
          name={'common/backLight'}
          transform={foldSideBar ? '' : 'rotate(180deg)'}
          w={'14px'}
          color={'white'}
        />
      </Flex>
      <Box position={'relative'} width={"100%"} h={'100%'} overflow={foldSideBar ? 'hidden' : 'visible'}>
        {children}
      </Box>
    </Box>
  );
};

export default SideBar;
