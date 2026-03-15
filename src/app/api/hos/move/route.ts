
import { NextResponse } from 'next/server'
import path from 'path'
import { ThaiCheckers8 } from '../../../../lib/thai-checkers'
import { chooseMoveSearch } from '../../../../lib/ai'
import { TFLiteValueModel } from '../../../../lib/tflite-value'

// Singleton to cache the model instance across requests in dev/production
// Note: In serverless (Vercel), this might be reset, but helps for warm starts.
let valueModel: TFLiteValueModel | null = null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { board, player, depth } = body

    if (!board || !player) {
      return NextResponse.json({ error: 'Missing board or player' }, { status: 400 })
    }

    // Initialize model if not already loaded
    if (!valueModel) {
      valueModel = new TFLiteValueModel()
      
      // Construct absolute path to the model file
      const modelPath = path.join(process.cwd(), 'public', 'models', 'thai_checkers_8_value.tflite')
      
      // Create a file URL for the model
      // Note: In Node.js environment, we need to ensure tfjs-tflite can load this.
      // If using standard fetch, file:// might not be supported without config.
      // But let's try this standard approach first.
      const modelUrl = `file://${modelPath.split(path.sep).join('/')}`
      
      console.log(`Loading TFLite model from: ${modelUrl}`)
      await valueModel.load(modelUrl)
    }

    const game = new ThaiCheckers8()
    
    // Perform the AI search
    // We use the provided depth or default to 2
    const move = await chooseMoveSearch(game, board, player, depth || 2, valueModel)

    return NextResponse.json({ move })
  } catch (error: any) {
    console.error('AI Processing Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
