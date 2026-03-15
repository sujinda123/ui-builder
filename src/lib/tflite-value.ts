
import * as tflite from "@tensorflow/tfjs-tflite";
import * as tf from "@tensorflow/tfjs";

export class TFLiteValueModel {
  model: tflite.TFLiteModel | null = null;

  async load(modelUrl: string) {
    await tf.ready();
    this.model = await tflite.loadTFLiteModel(modelUrl);
  }

  async predictValue(state: Float32Array): Promise<number> {
    if (!this.model) throw new Error("TFLite model not loaded");

    const input = tf.tensor4d(state, [1, 8, 8, 5], "float32");
    const output = this.model.predict(input) as tf.Tensor;
    const data = await output.data();

    input.dispose();
    output.dispose();

    return Number(data[0]);
  }
}
