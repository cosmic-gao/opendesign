import { 
  Node, 
  Graph, 
  Runtime, 
  Slot, 
  Message,
  createMessage,
  InEndpoints,
  OutEndpoints,
} from '../src/index.js';

// 用户消息类型
interface UserMessage {
  content: string;
  role: 'user' | 'assistant';
}

// LLM 请求类型
interface LLMRequest {
  prompt: string;
  model?: string;
}

// LLM 响应类型
interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

// 工具结果类型
interface ToolResult {
  tool: string;
  result: unknown;
}

// ============ 节点定义 ============

// LLM Agent 节点
interface LLMAgentEndpoints {
  in: {
    user: Slot<UserMessage>;
    tool: Slot<ToolResult>;
  };
  out: {
    llm: Slot<LLMRequest>;
    error: Slot<{ message: string }>;
  };
}

class LLMAgent extends Node<LLMAgentEndpoints['in'], LLMAgentEndpoints['out']> {
  constructor() {
    super('llm-agent', 'LLMAgent', {
      in: {
        user: { _type: {} as UserMessage },
        tool: { _type: {} as ToolResult },
      },
      out: {
        llm: { _type: {} as LLMRequest },
        error: { _type: {} as { message: string } },
      },
    });
  }

  async handle(endpoint: keyof LLMAgentEndpoints['in'], msg: Message): Promise<Message[]> {
    console.log(`[LLMAgent] Received on ${endpoint}:`, msg.payload);

    if (endpoint === 'user') {
      const userMsg = msg.payload as UserMessage;
      
      // 模拟 LLM 处理
      return [createMessage({
        endpoint: 'out.llm',
        payload: {
          prompt: userMsg.content,
          model: 'gpt-4',
        },
      })];
    }

    if (endpoint === 'tool') {
      const toolResult = msg.payload as ToolResult;
      console.log(`[LLMAgent] Tool result from ${toolResult.tool}:`, toolResult.result);
      
      // 工具结果直接返回给用户（简化处理）
      return [];
    }

    return [];
  }
}

// LLM Provider 节点
interface LLMProviderEndpoints {
  in: {
    request: Slot<LLMRequest>;
  };
  out: {
    response: Slot<LLMResponse>;
    error: Slot<{ message: string }>;
  };
}

class LLMProvider extends Node<LLMProviderEndpoints['in'], LLMProviderEndpoints['out']> {
  constructor() {
    super('llm-provider', 'LLMProvider', {
      in: {
        request: { _type: {} as LLMRequest },
      },
      out: {
        response: { _type: {} as LLMResponse },
        error: { _type: {} as { message: string } },
      },
    });
  }

  async handle(endpoint: keyof LLMProviderEndpoints['in'], msg: Message): Promise<Message[]> {
    console.log(`[LLMProvider] Received request:`, msg.payload);

    const request = msg.payload as LLMRequest;
    
    // 模拟 LLM 调用
    const response: LLMResponse = {
      text: `Processed: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 20,
      },
    };

    return [createMessage({
      endpoint: 'out.response',
      payload: response,
    })];
  }
}

// ============ 图构建 ============

async function main() {
  console.log('=== Graph Runtime Demo ===\n');

  // 创建节点
  const agent = new LLMAgent();
  const llm = new LLMProvider();

  // 创建图
  const graph = new Graph('demo-graph', 'DemoGraph');
  
  // 添加节点
  graph.addNode(agent);
  graph.addNode(llm);

  // 连接边
  // Agent.out:llm -> LLM.in:request
  graph.connect('llm-agent.out:llm', 'llm-provider.in:request');
  
  // 广播边（用于日志）
  graph.connect('llm-provider.out:response', 'llm-agent.in:user');

  // 创建运行时
  const runtime = new Runtime(graph, { enableLogging: true });

  // 启动
  await runtime.start();

  // 发送初始消息
  const userMsg = createMessage<UserMessage>({
    endpoint: 'in.user',
    payload: {
      content: 'Hello, world!',
      role: 'user',
    },
  });

  console.log('\n--- Sending initial message ---');
  runtime.sendMessage('llm-agent', userMsg);

  // 等待处理
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 停止
  await runtime.stop();

  // 打印状态
  console.log('\n--- Runtime Status ---');
  console.log(runtime.getStatus());
  console.log(`\nCompleted ${runtime.getCurrentSuperstep()} superstep(s)`);

  process.exit(0);
}

main().catch(console.error);
