export type Step = "pick" | "detect" | "result";

export type PredictMode = "api" | "local-capture" | "local-realtime";

export type ImageSize = {
  width: number;
  height: number;
};

export type ScaledBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CardStyleProps = {
  cardBg: string;
  borderColor: string;
};
