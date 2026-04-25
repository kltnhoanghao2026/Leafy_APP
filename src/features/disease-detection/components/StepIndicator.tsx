import React from "react";
import { View, Text } from "react-native";
import { Check } from "lucide-react-native";

import type { Step } from "./predict.types";

type StepIndicatorProps = {
  step: Step;
  palette: { primary: string };
};

const STEP_MAP: Record<Step, number> = { pick: 1, detect: 2, result: 3 };

export default function StepIndicator({ step, palette }: StepIndicatorProps) {
  const stepNumber = STEP_MAP[step];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        gap: 6,
      }}
    >
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor:
                s <= stepNumber ? palette.primary : `${palette.primary}20`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {s < stepNumber ? (
              <Check size={14} color="#FFF" strokeWidth={3} />
            ) : (
              <Text
                style={{
                  color: s <= stepNumber ? "#FFF" : palette.primary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View
              style={{
                width: 32,
                height: 2,
                borderRadius: 1,
                backgroundColor:
                  s < stepNumber ? palette.primary : `${palette.primary}20`,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
