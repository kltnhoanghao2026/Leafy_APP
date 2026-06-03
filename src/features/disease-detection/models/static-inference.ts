import * as ImageManipulator from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import { Buffer } from 'buffer';

import { Image } from 'react-native';

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

export async function processImageToRgbBuffer(
  uri: string,
  targetSize: number,
  cropBox?: { x: number; y: number; w: number; h: number },
  letterbox: boolean = false
): Promise<Uint8Array> {
  let newWidth = targetSize;
  let newHeight = targetSize;

  // 1. Crop and resize the image
  const actions: ImageManipulator.Action[] = [];
  if (cropBox) {
    actions.push({
      crop: {
        originX: cropBox.x,
        originY: cropBox.y,
        width: cropBox.w,
        height: cropBox.h,
      },
    });
  }

  if (letterbox) {
    const size = await getImageSize(uri);
    // If cropBox exists, we use its size for aspect ratio instead of the full image
    const origW = cropBox ? cropBox.w : size.width;
    const origH = cropBox ? cropBox.h : size.height;
    
    const scale = Math.min(targetSize / origW, targetSize / origH);
    newWidth = Math.round(origW * scale);
    newHeight = Math.round(origH * scale);
    
    actions.push({
      resize: {
        width: newWidth,
        height: newHeight,
      },
    });
  } else {
    actions.push({
      resize: {
        width: targetSize,
        height: targetSize,
      },
    });
  }

  const manipResult = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!manipResult.base64) {
    throw new Error('Failed to extract base64 from image');
  }

  // 2. Decode JPEG to RGBA
  const rawBuffer = Buffer.from(manipResult.base64, 'base64');
  const rawImageData = jpeg.decode(rawBuffer, { useTArray: true });
  const rgbaData = rawImageData.data;

  // 3. Extract RGB channels and handle letterbox padding
  const pixelCount = targetSize * targetSize;
  const rgbBuffer = new Uint8Array(pixelCount * 3);

  if (letterbox) {
    // Fill with YOLO padding color (114)
    rgbBuffer.fill(114);
    
    const padX = Math.floor((targetSize - newWidth) / 2);
    const padY = Math.floor((targetSize - newHeight) / 2);
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcIdx = (y * newWidth + x) * 4;
        const dstIdx = ((y + padY) * targetSize + (x + padX)) * 3;
        rgbBuffer[dstIdx] = rgbaData[srcIdx];
        rgbBuffer[dstIdx + 1] = rgbaData[srcIdx + 1];
        rgbBuffer[dstIdx + 2] = rgbaData[srcIdx + 2];
      }
    }
  } else {
    for (let i = 0; i < pixelCount; i++) {
      rgbBuffer[i * 3] = rgbaData[i * 4];       // R
      rgbBuffer[i * 3 + 1] = rgbaData[i * 4 + 1]; // G
      rgbBuffer[i * 3 + 2] = rgbaData[i * 4 + 2]; // B
    }
  }

  return rgbBuffer;
}

export async function processImageToFloat32Buffer(
  uri: string,
  targetSize: number,
  cropBox?: { x: number; y: number; w: number; h: number },
  letterbox: boolean = false
): Promise<Float32Array> {
  const rgbBuffer = await processImageToRgbBuffer(uri, targetSize, cropBox, letterbox);
  const floatBuffer = new Float32Array(rgbBuffer.length);
  for (let i = 0; i < rgbBuffer.length; i++) {
    floatBuffer[i] = rgbBuffer[i] / 255.0;
  }
  return floatBuffer;
}
