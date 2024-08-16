import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type.d';
import { getAIApi } from '../config';
import { countGptMessagesTokens } from '../../../common/string/tiktoken/index';

export const Prompt_QuestionGuide = `你是一个AI智能助手，可以回答和解决我的问题。请结合前面的对话记录，帮我生成 20 个问题，引导我继续提问。问题的长度应小于20个字符，按 JSON 格式返回: ["问题1", "问题2", "问题3"]`;

export async function createQuestionGuide({
  messages,
  model
}: {
  messages: ChatCompletionMessageParam[];
  model: string;
}) {
  const concatMessages: ChatCompletionMessageParam[] = [
    ...messages,
    {
      role: 'user',
      content: Prompt_QuestionGuide
    }
  ];
  const ai = getAIApi({
    timeout: 480000
  });
  const data = await ai.chat.completions.create({
    model: model,
    temperature: 0.1,
    max_tokens: 500,
    messages: concatMessages,
    stream: false
  });
  var answer = data.choices?.[0]?.message?.content || '';
  
  const start = answer.indexOf('[');
  const end = answer.lastIndexOf(']');
  if (start === -1) {
    const firstCommaIndex = answer.indexOf(',');
    if (firstCommaIndex !== -1) {
      answer = answer.slice(firstCommaIndex + 1);
      answer = '[' + answer;
    }
  } else if (end === -1) {
    const lastCommaIndex = answer.lastIndexOf(',');
    if (lastCommaIndex !== -1) {
      answer = answer.slice(0, lastCommaIndex);
      answer += ']';
    }
  }
  const tokens = await countGptMessagesTokens(concatMessages);
  const jsonStr = answer
  .substring(start, end + 1)
  .replace(/(\\n|\\)/g, '')
  .replace(/  /g, '');
  if (start === -1 || end === -1) {
    return {
      result: [],
      tokens: 0
    };
  }

  try {
    return {
      result: jsonStr,
      tokens
    };
  } catch (error) {
    return {
      result: [],
      tokens: 0
    };
  }
}
