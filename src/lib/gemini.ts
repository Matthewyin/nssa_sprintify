import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

// Gemini API配置
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY

if (!API_KEY) {
  console.warn('Gemini API key not found. AI features will be disabled.')
}

// 初始化Gemini AI
let genAI: GoogleGenerativeAI | null = null
let model: GenerativeModel | null = null

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY)
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

/**
 * 检查Gemini API是否可用
 */
export function isGeminiAvailable(): boolean {
  return !!(API_KEY && genAI && model)
}

/**
 * 获取Gemini模型实例
 */
export function getGeminiModel(): GenerativeModel {
  if (!model) {
    throw new Error('Gemini API not configured. Please set GEMINI_API_KEY environment variable.')
  }
  return model
}

/**
 * 生成AI响应
 */
export async function generateAIResponse(prompt: string): Promise<string> {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API not available')
  }

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('AI生成失败，请稍后重试')
  }
}



/**
 * 生成冲刺计划
 */
export async function generateSprintPlan(params: {
  goal: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  userLevel?: string
}): Promise<{
  title: string
  description: string
  tasks: Array<{
    title: string
    description: string
    estimatedHours: number
    priority: 'high' | 'medium' | 'low'
    category: string
  }>
  tips: string[]
}> {
  const { goal, duration, difficulty, category, userLevel = 'normal' } = params

  const prompt = `
作为一个专业的学习和项目管理顾问，请为用户生成一个详细的${duration}天冲刺计划。

**用户信息：**
- 目标：${goal}
- 持续时间：${duration}天
- 难度级别：${difficulty}
- 类别：${category}
- 用户等级：${userLevel}

**要求：**
1. 生成一个清晰的计划标题和描述
2. 将目标分解为具体的任务，每个任务包含：
   - 任务标题
   - 详细描述
   - 预估完成时间（小时）
   - 优先级（high/medium/low）
   - 任务类别
3. 提供3-5个实用的学习/执行建议
4. 确保任务安排合理，符合${difficulty}难度级别
5. 任务总时间应该适合${duration}天的安排

请以JSON格式返回，结构如下：
{
  "title": "计划标题",
  "description": "计划描述",
  "tasks": [
    {
      "title": "任务标题",
      "description": "任务描述",
      "estimatedHours": 2,
      "priority": "high",
      "category": "学习"
    }
  ],
  "tips": ["建议1", "建议2", "建议3"]
}

请确保返回的是有效的JSON格式，不要包含任何其他文本。
`

  try {
    const response = await generateAIResponse(prompt)
    
    // 尝试解析JSON响应
    let parsedResponse
    try {
      // 清理响应文本，移除可能的markdown代码块标记
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsedResponse = JSON.parse(cleanResponse)
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      console.error('原始响应:', response)
      throw new Error('AI响应格式错误，请重试')
    }

    // 验证响应结构
    if (!parsedResponse.title || !parsedResponse.description || !Array.isArray(parsedResponse.tasks)) {
      throw new Error('AI响应结构不完整')
    }

    return parsedResponse
  } catch (error) {
    console.error('生成冲刺计划失败:', error)
    throw error
  }
}

/**
 * 优化现有计划
 */
export async function optimizePlan(
  currentPlan: any,
  feedback: string
): Promise<{
  suggestions: string[]
  optimizedTasks: any[]
}> {
  const prompt = `
作为专业顾问，请分析以下冲刺计划并根据用户反馈提供优化建议。

**当前计划：**
${JSON.stringify(currentPlan, null, 2)}

**用户反馈：**
${feedback}

请提供：
1. 3-5个具体的优化建议
2. 优化后的任务列表（如果需要调整）

以JSON格式返回：
{
  "suggestions": ["建议1", "建议2"],
  "optimizedTasks": [任务列表]
}
`

  try {
    const response = await generateAIResponse(prompt)
    const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanResponse)
  } catch (error) {
    console.error('优化计划失败:', error)
    throw new Error('计划优化失败，请重试')
  }
}
